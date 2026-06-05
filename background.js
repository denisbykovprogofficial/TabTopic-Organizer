/**
 * background.js — Service Worker для расширения TabTopic Organizer.
 *
 * Отвечает за:
 * 1. Загрузку и сохранение пользовательских категорий из browser.storage.
 * 2. Получение всех вкладок текущего окна.
 * 3. Категоризацию каждой вкладки через функцию categorizeTab() из utils.js.
 * 4. Создание визуальных групп (Tab Groups) с помощью browser.tabs.group().
 * 5. Удаление всех групп (разгруппировку) по запросу из popup.
 * 6. Автогруппировку при открытии новых вкладок (опционально).
 *
 * Взаимодействие с popup осуществляется через browser.runtime.onMessage.
 */

"use strict";

// === Флаг автогруппировки (загружается из storage) ===
let autoGroupEnabled = false;

/**
 * Проверяет доступность API browser.tabs.group.
 *
 * @returns {boolean} — true, если API доступен
 */
function isTabGroupAPISupported() {
  return (
    typeof browser !== "undefined" &&
    browser.tabs &&
    typeof browser.tabs.group === "function" &&
    typeof browser.tabs.ungroup === "function"
  );
}

/**
 * Фильтрует вкладки: исключает служебные страницы Firefox.
 *
 * @param {browser.tabs.Tab[]} tabs — массив вкладок
 * @returns {browser.tabs.Tab[]} — отфильтрованный массив
 */
function filterEligibleTabs(tabs) {
  return tabs.filter((tab) => {
    const url = tab.url || "";
    return (
      !url.startsWith("about:") &&
      !url.startsWith("moz-extension:") &&
      !url.startsWith("https://addons.mozilla.org/")
    );
  });
}

/**
 * Группирует массив вкладок по категориям.
 *
 * @param {browser.tabs.Tab[]} tabs — вкладки для группировки
 * @returns {Promise<{ success: boolean, message: string, groupCount?: number }>}
 */
async function groupTabs(tabs) {
  if (!isTabGroupAPISupported()) {
    return {
      success: false,
      message:
        "API browser.tabs.group недоступен. " +
        "Убедитесь, что вы используете Firefox 128+."
    };
  }

  try {
    if (!tabs || tabs.length === 0) {
      return { success: false, message: "Нет открытых вкладок для группировки." };
    }

    const eligibleTabs = filterEligibleTabs(tabs);

    if (eligibleTabs.length === 0) {
      return {
        success: false,
        message: "Все вкладки являются служебными — группировать нечего."
      };
    }

    // Категоризуем каждую вкладку
    const categorized = new Map();

    for (const tab of eligibleTabs) {
      const { name, color } = categorizeTab(tab);

      if (!categorized.has(name)) {
        categorized.set(name, { color, tabIds: [] });
      }
      categorized.get(name).tabIds.push(tab.id);
    }

    // Создаём группы
    let groupCount = 0;

    for (const [categoryName, { color, tabIds }] of categorized) {
      if (tabIds.length < 1) continue;

      try {
        const groupId = await browser.tabs.group({ tabIds });

        await browser.tabGroups.update(groupId, {
          title: categoryName,
          color: color,
          collapsed: false
        });

        groupCount++;
      } catch (groupErr) {
        console.error(
          `[TabTopic] Ошибка при создании группы "${categoryName}":`,
          groupErr
        );
      }
    }

    return {
      success: true,
      message: `Группировка завершена: создано ${groupCount} групп из ${eligibleTabs.length} вкладок.`,
      groupCount
    };
  } catch (err) {
    console.error("[TabTopic] Критическая ошибка при группировке:", err);
    return {
      success: false,
      message: `Ошибка: ${err.message || String(err)}`
    };
  }
}

/**
 * Группирует все вкладки текущего окна.
 *
 * @returns {Promise<{ success: boolean, message: string, groupCount?: number }>}
 */
async function groupAllTabs() {
  const tabs = await browser.tabs.query({ currentWindow: true });
  return groupTabs(tabs);
}

/**
 * Разгруппировывает все вкладки текущего окна.
 *
 * @returns {Promise<{ success: boolean, message: string }>}
 */
async function ungroupAllTabs() {
  if (!isTabGroupAPISupported()) {
    return {
      success: false,
      message: "API browser.tabs.ungroup недоступен."
    };
  }

  try {
    const tabs = await browser.tabs.query({ currentWindow: true });

    const tabIdsToUngroup = tabs
      .filter((tab) => tab.groupId !== undefined && tab.groupId !== -1)
      .map((tab) => tab.id);

    if (tabIdsToUngroup.length === 0) {
      return { success: false, message: "Нет сгруппированных вкладок для удаления." };
    }

    await browser.tabs.ungroup(tabIdsToUngroup);

    return {
      success: true,
      message: `Разгруппировано ${tabIdsToUngroup.length} вкладок.`
    };
  } catch (err) {
    console.error("[TabTopic] Ошибка при разгруппировке:", err);
    return {
      success: false,
      message: `Ошибка: ${err.message || String(err)}`
    };
  }
}

// === Автогруппировка при создании новой вкладки ===

/**
 * Обработчик события создания новой вкладки.
 * Если автогруппировка включена, группирует новую вкладку по тематике.
 */
async function handleTabCreated(tab) {
  if (!autoGroupEnabled) return;
  if (!isTabGroupAPISupported()) return;

  // Ждём загрузки URL вкладки
  try {
    const updatedTab = await browser.tabs.get(tab.id);
    const url = updatedTab.url || "";

    // Пропускаем служебные страницы
    if (
      url.startsWith("about:") ||
      url.startsWith("moz-extension:") ||
      url.startsWith("https://addons.mozilla.org/")
    ) {
      return;
    }

    const { name, color } = categorizeTab(updatedTab);

    // Создаём группу для одной вкладки
    const groupId = await browser.tabs.group({ tabIds: [tab.id] });

    await browser.tabGroups.update(groupId, {
      title: name,
      color: color,
      collapsed: false
    });
  } catch (err) {
    // Игнорируем ошибки автогруппировки — не критично
    console.warn("[TabTopic] Автогруппировка не удалась:", err.message);
  }
}

// === Слушатель сообщений из popup.js ===

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Группировка всех вкладок
  if (message && message.action === "group") {
    groupAllTabs().then(sendResponse);
    return true;
  }

  // Разгруппировка всех вкладок
  if (message && message.action === "ungroup") {
    ungroupAllTabs().then(sendResponse);
    return true;
  }

  // Проверка поддержки API
  if (message && message.action === "checkAPI") {
    sendResponse({
      supported: isTabGroupAPISupported(),
      autoGroup: autoGroupEnabled
    });
    return false;
  }

  // Получение текущих категорий
  if (message && message.action === "getCategories") {
    loadCategoriesFromStorage().then((categories) => {
      sendResponse({ categories });
    });
    return true;
  }

  // Сохранение пользовательских категорий
  if (message && message.action === "saveCategories") {
    saveCategoriesToStorage(message.categories).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }

  // Сброс категорий на значения по умолчанию
  if (message && message.action === "resetCategories") {
    resetCategoriesToDefault().then(() => {
      sendResponse({ success: true, categories: getActiveCategories() });
    });
    return true;
  }

  // Включение/выключение автогруппировки
  if (message && message.action === "setAutoGroup") {
    autoGroupEnabled = !!message.enabled;
    browser.storage.local.set({ autoGroup: autoGroupEnabled }).then(() => {
      sendResponse({ success: true, autoGroup: autoGroupEnabled });
    });
    return true;
  }
});

// === Инициализация при загрузке Service Worker ===

(async function initBackground() {
  // Загружаем категории из storage
  await loadCategoriesFromStorage();

  // Загружаем настройку автогруппировки
  try {
    const result = await browser.storage.local.get(["autoGroup"]);
    autoGroupEnabled = !!result.autoGroup;
  } catch (err) {
    console.error("[TabTopic] Ошибка загрузки настроек:", err);
  }

  // Регистрируем обработчик создания вкладок
  browser.tabs.onCreated.addListener(handleTabCreated);

  console.log("[TabTopic] Background инициализирован. Автогруппировка:", autoGroupEnabled);
})();
