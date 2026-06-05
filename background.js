/**
 * background.js — Service Worker для расширения TabTopic Organizer.
 *
 * Отвечает за:
 * 1. Получение всех вкладок текущего окна.
 * 2. Категоризацию каждой вкладки через функцию categorizeTab() из utils.js.
 * 3. Создание визуальных групп (Tab Groups) с помощью browser.tabs.group().
 * 4. Удаление всех групп (разгруппировку) по запросу из popup.
 *
 * Взаимодействие с popup осуществляется через browser.runtime.onMessage.
 */

"use strict";

/**
 * Проверяет доступность API browser.tabs.group.
 * В старых версиях Firefox этот API может отсутствовать.
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
 * Основная функция группировки вкладок.
 *
 * Алгоритм:
 * 1. Запрашивает все вкладки в текущем окне.
 * 2. Фильтрует служебные страницы (about:*, moz-extension:*).
 * 3. Каждую вкладку категоризует.
 * 4. Группирует вкладки по категориям.
 * 5. Для каждой группы вызывает browser.tabs.group() с заголовком и цветом.
 *
 * @returns {Promise<{ success: boolean, message: string, groupCount?: number }>}
 */
async function groupAllTabs() {
  // Проверяем поддержку API группировки
  if (!isTabGroupAPISupported()) {
    return {
      success: false,
      message:
        "API browser.tabs.group недоступен. " +
        "Убедитесь, что вы используете Firefox 128+. " +
        "В Firefox этот API может потребовать включения в about:config " +
        "(layout.tabs.groups)."
    };
  }

  try {
    // Получаем все вкладки текущего окна
    const tabs = await browser.tabs.query({ currentWindow: true });

    if (!tabs || tabs.length === 0) {
      return { success: false, message: "Нет открытых вкладок для группировки." };
    }

    // Фильтруем: исключаем служебные страницы Firefox (about:*, moz-extension:*)
    const eligibleTabs = tabs.filter((tab) => {
      const url = tab.url || "";
      return (
        !url.startsWith("about:") &&
        !url.startsWith("moz-extension:") &&
        !url.startsWith("https://addons.mozilla.org/")
      );
    });

    if (eligibleTabs.length === 0) {
      return {
        success: false,
        message: "Все вкладки являются служебными — группировать нечего."
      };
    }

    // Категоризуем каждую вкладку
    const categorized = new Map(); // ключ: имя категории, значение: { color, tabIds }

    for (const tab of eligibleTabs) {
      const { name, color } = categorizeTab(tab);

      if (!categorized.has(name)) {
        categorized.set(name, { color, tabIds: [] });
      }
      categorized.get(name).tabIds.push(tab.id);
    }

    // Создаём группы для каждой категории
    let groupCount = 0;

    for (const [categoryName, { color, tabIds }] of categorized) {
      // Если в категории только 1 вкладка — группируем только если их 2+ в общей сложности
      // (Firefox не позволяет создать группу из одной вкладки напрямую через group)
      if (tabIds.length < 1) continue;

      try {
        // browser.tabs.group принимает массив tabIds и создаёт группу
        const groupId = await browser.tabs.group({
          tabIds: tabIds
        });

        // Устанавливаем заголовок и цвет для созданной группы
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
 * Функция разгруппировки — удаляет все группы в текущем окне.
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
    // Получаем все вкладки текущего окна
    const tabs = await browser.tabs.query({ currentWindow: true });

    // Собираем ID всех вкладок, которые состоят в группе
    const tabIdsToUngroup = tabs
      .filter((tab) => tab.groupId !== undefined && tab.groupId !== -1)
      .map((tab) => tab.id);

    if (tabIdsToUngroup.length === 0) {
      return { success: false, message: "Нет сгруппированных вкладок для удаления." };
    }

    // Разгруппировываем каждую вкладку
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

/**
 * Слушатель сообщений из popup.js.
 * Popup отправляет { action: "group" } или { action: "ungroup" },
 * background обрабатывает и возвращает результат.
 */
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.action === "group") {
    // groupAllTabs возвращает Promise — Firefox поддерживает async sendResponse
    groupAllTabs().then(sendResponse);
    // Возвращаем true, чтобы indicate sendResponse будет вызван асинхронно
    return true;
  }

  if (message && message.action === "ungroup") {
    ungroupAllTabs().then(sendResponse);
    return true;
  }

  if (message && message.action === "checkAPI") {
    sendResponse({ supported: isTabGroupAPISupported() });
    return false;
  }
});
