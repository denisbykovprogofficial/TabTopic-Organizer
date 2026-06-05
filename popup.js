/**
 * popup.js — Логика интерфейса расширения TabTopic Organizer.
 *
 * Управляет:
 * - Кнопками «Сгруппировать» и «Разгруппировать»
 * - Переключателем автогруппировки
 * - Редактированием пользовательских категорий
 * - Навигацией по секциям popup
 *
 * Взаимодействие с background.js через browser.runtime.sendMessage().
 */

"use strict";

// === Константы цветов для выпадающего списка ===

const COLOR_OPTIONS = [
  { value: "blue", label: "Синий" },
  { value: "red", label: "Красный" },
  { value: "yellow", label: "Жёлтый" },
  { value: "green", label: "Зелёный" },
  { value: "pink", label: "Розовый" },
  { value: "purple", label: "Фиолетовый" },
  { value: "cyan", label: "Бирюзовый" },
  { value: "orange", label: "Оранжевый" },
  { value: "grey", label: "Серый" }
];

const COLOR_HEX = {
  blue: "#0060df",
  red: "#d70022",
  yellow: "#e5a100",
  green: "#058b00",
  pink: "#ff6b9d",
  purple: "#9059ff",
  cyan: "#00b3f4",
  orange: "#ff6b35",
  grey: "#999999"
};

// === DOM-элементы ===

const btnGroup = document.getElementById("btn-group");
const btnUngroup = document.getElementById("btn-ungroup");
const statusEl = document.getElementById("status");
const statusIcon = document.getElementById("status-icon");
const statusText = document.getElementById("status-text");
const warningEl = document.getElementById("warning");
const warningText = document.getElementById("warning-text");
const toggleAutoGroup = document.getElementById("toggle-auto-group");
const btnAddCategory = document.getElementById("btn-add-category");
const btnSaveCategories = document.getElementById("btn-save-categories");
const btnResetCategories = document.getElementById("btn-reset-categories");
const categoriesList = document.getElementById("categories-list");
const tabCategories = document.getElementById("tab-categories");
const tabAbout = document.getElementById("tab-about");
const panelCategories = document.getElementById("panel-categories");
const panelAbout = document.getElementById("panel-about");

// === Состояние ===

let currentCategories = {};

// === Утилиты отображения ===

/**
 * Устанавливает статус: loading, success или error.
 */
function setStatus(type, text) {
  statusEl.classList.remove("status--loading", "status--success", "status--error");
  statusIcon.classList.remove("status__icon--loading", "status__icon--success", "status__icon--error");

  statusEl.classList.add(`status--${type}`);

  if (type === "loading") {
    statusIcon.classList.add("status__icon--loading");
    statusIcon.textContent = "";
  } else if (type === "success") {
    statusIcon.classList.add("status__icon--success");
    statusIcon.textContent = "\u2713";
  } else if (type === "error") {
    statusIcon.classList.add("status__icon--error");
    statusIcon.textContent = "\u2717";
  }

  statusText.textContent = text;
}

/**
 * Показывает или скрывает блок предупреждения.
 */
function showWarning(message) {
  if (message) {
    warningText.textContent = message;
    warningEl.hidden = false;
  } else {
    warningEl.hidden = true;
  }
}

/**
 * Отправляет сообщение в background.js и возвращает ответ.
 */
function sendMessage(msg) {
  return browser.runtime.sendMessage(msg);
}

// === Переключение секций ===

function switchTab(activeTab, activePanel) {
  tabCategories.classList.remove("tabs-nav__btn--active");
  tabAbout.classList.remove("tabs-nav__btn--active");
  panelCategories.hidden = true;
  panelAbout.hidden = true;

  activeTab.classList.add("tabs-nav__btn--active");
  activePanel.hidden = false;
}

tabCategories.addEventListener("click", () => switchTab(tabCategories, panelCategories));
tabAbout.addEventListener("click", () => switchTab(tabAbout, panelAbout));

// === Основные кнопки ===

btnGroup.addEventListener("click", async () => {
  btnGroup.disabled = true;
  btnUngroup.disabled = true;
  setStatus("loading", "Выполняется группировка вкладок...");
  showWarning(null);

  try {
    const response = await sendMessage({ action: "group" });
    if (response && response.success) {
      setStatus("success", response.message);
    } else {
      setStatus("error", response ? response.message : "Неизвестная ошибка");
    }
  } catch (err) {
    console.error("[TabTopic Popup] Ошибка связи с background:", err);
    setStatus("error", "Не удалось связаться с фоновым скриптом.");
  } finally {
    btnGroup.disabled = false;
    btnUngroup.disabled = false;
  }
});

btnUngroup.addEventListener("click", async () => {
  btnGroup.disabled = true;
  btnUngroup.disabled = true;
  setStatus("loading", "Удаление групп...");
  showWarning(null);

  try {
    const response = await sendMessage({ action: "ungroup" });
    if (response && response.success) {
      setStatus("success", response.message);
    } else {
      setStatus("error", response ? response.message : "Неизвестная ошибка");
    }
  } catch (err) {
    console.error("[TabTopic Popup] Ошибка связи с background:", err);
    setStatus("error", "Не удалось связаться с фоновым скриптом.");
  } finally {
    btnGroup.disabled = false;
    btnUngroup.disabled = false;
  }
});

// === Переключатель автогруппировки ===

toggleAutoGroup.addEventListener("change", async () => {
  try {
    await sendMessage({
      action: "setAutoGroup",
      enabled: toggleAutoGroup.checked
    });
  } catch (err) {
    console.error("[TabTopic Popup] Ошибка переключения автогруппировки:", err);
  }
});

// === Редактор категорий ===

/**
 * Создаёт DOM-элемент карточки категории.
 *
 * @param {string} name — название категории
 * @param {{ keywords: string[], color: string }} data — данные категории
 * @returns {HTMLElement} — элемент карточки
 */
function createCategoryCard(name, data) {
  const card = document.createElement("div");
  card.className = "category-card";
  card.dataset.name = name;

  // Строка 1: название + кнопка удаления
  const row1 = document.createElement("div");
  row1.className = "category-card__row";

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.className = "category-card__name";
  nameInput.value = name;
  nameInput.placeholder = "Название категории";

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "category-card__delete";
  deleteBtn.textContent = "\u00D7";
  deleteBtn.title = "Удалить категорию";

  row1.appendChild(nameInput);
  row1.appendChild(deleteBtn);

  // Строка 2: цвет
  const row2 = document.createElement("div");
  row2.className = "category-card__row";

  const colorLabel = document.createElement("span");
  colorLabel.textContent = "Цвет:";
  colorLabel.style.fontSize = "11px";
  colorLabel.style.color = "var(--muted-color)";

  const colorInput = document.createElement("input");
  colorInput.type = "color";
  colorInput.className = "category-card__color";
  colorInput.value = COLOR_HEX[data.color] || COLOR_HEX.grey;

  row2.appendChild(colorLabel);
  row2.appendChild(colorInput);

  // Строка 3: ключевые слова
  const keywordsInput = document.createElement("textarea");
  keywordsInput.className = "category-card__keywords";
  keywordsInput.value = (data.keywords || []).join(", ");
  keywordsInput.placeholder = "Ключевые слова через запятую";
  keywordsInput.rows = 1;

  // Сборка карточки
  card.appendChild(row1);
  card.appendChild(row2);
  card.appendChild(keywordsInput);

  // Обработчик удаления
  deleteBtn.addEventListener("click", () => {
    card.remove();
    delete currentCategories[name];
    updateAboutCategoriesCount(currentCategories);
  });

  // Обработчик изменения имени
  nameInput.addEventListener("change", () => {
    const oldName = card.dataset.name;
    const newName = nameInput.value.trim();

    if (newName && newName !== oldName) {
      // Переносим данные под новым именем
      currentCategories[newName] = currentCategories[oldName];
      delete currentCategories[oldName];
      card.dataset.name = newName;
    }
  });

  // Обработчик изменения цвета
  colorInput.addEventListener("input", () => {
    const colorName = Object.keys(COLOR_HEX).find(
      (k) => COLOR_HEX[k] === colorInput.value
    );
    if (colorName && card.dataset.name) {
      if (currentCategories[card.dataset.name]) {
        currentCategories[card.dataset.name].color = colorName;
      }
    }
  });

  // Обработчик изменения ключевых слов
  keywordsInput.addEventListener("change", () => {
    const cardName = card.dataset.name;
    if (currentCategories[cardName]) {
      currentCategories[cardName].keywords = keywordsInput.value
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k.length > 0);
    }
  });

  return card;
}

/**
 * Отрисовывает список категорий из currentCategories.
 */
function renderCategories() {
  categoriesList.innerHTML = "";

  for (const [name, data] of Object.entries(currentCategories)) {
    const card = createCategoryCard(name, data);
    categoriesList.appendChild(card);
  }
}

/**
 * Загружает категории из background.js и отрисовывает их.
 */
async function loadCategories() {
  try {
    const response = await sendMessage({ action: "getCategories" });
    if (response && response.categories) {
      currentCategories = response.categories;
      renderCategories();
    }
  } catch (err) {
    console.error("[TabTopic Popup] Ошибка загрузки категорий:", err);
  }
}

/**
 * Собирает данные из всех карточек категорий и возвращает объект.
 */
function collectCategoriesFromUI() {
  const categories = {};
  const cards = categoriesList.querySelectorAll(".category-card");

  cards.forEach((card) => {
    const name = card.querySelector(".category-card__name").value.trim();
    const colorValue = card.querySelector(".category-card__color").value;
    const keywordsRaw = card.querySelector(".category-card__keywords").value;

    if (!name) return;

    const colorName = Object.keys(COLOR_HEX).find(
      (k) => COLOR_HEX[k] === colorValue
    ) || "grey";

    const keywords = keywordsRaw
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    categories[name] = { keywords, color: colorName };
  });

  return categories;
}

// Кнопка «Добавить категорию»
btnAddCategory.addEventListener("click", () => {
  const newName = "Новая категория";
  let uniqueName = newName;
  let counter = 1;

  while (currentCategories[uniqueName]) {
    uniqueName = `${newName} ${counter}`;
    counter++;
  }

  currentCategories[uniqueName] = { keywords: [], color: "grey" };

  const card = createCategoryCard(uniqueName, currentCategories[uniqueName]);
  categoriesList.appendChild(card);

  // Фокус на поле имени новой карточки
  card.querySelector(".category-card__name").focus();
  card.querySelector(".category-card__name").select();
  updateAboutCategoriesCount(currentCategories);
});

// Кнопка «Сохранить»
btnSaveCategories.addEventListener("click", async () => {
  const categories = collectCategoriesFromUI();

  try {
    await sendMessage({ action: "saveCategories", categories });
    currentCategories = categories;
    setStatus("success", "Категории сохранены");
    updateAboutCategoriesCount(currentCategories);
  } catch (err) {
    setStatus("error", "Ошибка сохранения категорий");
    console.error("[TabTopic Popup] Ошибка сохранения:", err);
  }
});

// Кнопка «Сбросить»
btnResetCategories.addEventListener("click", async () => {
  try {
    const response = await sendMessage({ action: "resetCategories" });
    if (response && response.categories) {
      currentCategories = response.categories;
      renderCategories();
      setStatus("success", "Категории сброшены на стандартные");
      updateAboutCategoriesCount(currentCategories);
    }
  } catch (err) {
    setStatus("error", "Ошибка сброса категорий");
    console.error("[TabTopic Popup] Ошибка сброса:", err);
  }
});

// === Обновление информации в секции «О расширении» ===

/**
 * DOM-элементы секции «О расширении».
 */
const aboutApiStatus = document.getElementById("about-api-status");
const aboutAutoStatus = document.getElementById("about-auto-status");
const aboutCategoriesCount = document.getElementById("about-categories-count");
const aboutStorageStatus = document.getElementById("about-storage-status");

/**
 * Обновляет статус API в секции «О расширении».
 *
 * @param {boolean} supported — доступен ли API группировки
 * @param {boolean} autoGroup — включена ли автогруппировка
 */
function updateAboutAPIStatus(supported, autoGroup) {
  if (supported) {
    aboutApiStatus.textContent = "доступен";
    aboutApiStatus.classList.remove("about__status-value--fail");
    aboutApiStatus.classList.add("about__status-value--ok");
  } else {
    aboutApiStatus.textContent = "недоступен";
    aboutApiStatus.classList.remove("about__status-value--ok");
    aboutApiStatus.classList.add("about__status-value--fail");
  }

  aboutAutoStatus.textContent = autoGroup ? "включена" : "выключена";
  aboutAutoStatus.classList.toggle("about__status-value--ok", autoGroup);
}

/**
 * Обновляет счётчик загруженных категорий.
 */
function updateAboutCategoriesCount(categories) {
  const count = categories ? Object.keys(categories).length : 0;
  aboutCategoriesCount.textContent = `${count} шт.`;
}

/**
 * Проверяет доступность browser.storage.local.
 */
async function checkStorageAvailability() {
  try {
    await browser.storage.local.set({ __test: true });
    await browser.storage.local.remove("__test");
    aboutStorageStatus.textContent = "доступно";
    aboutStorageStatus.classList.remove("about__status-value--fail");
    aboutStorageStatus.classList.add("about__status-value--ok");
  } catch {
    aboutStorageStatus.textContent = "недоступно";
    aboutStorageStatus.classList.remove("about__status-value--ok");
    aboutStorageStatus.classList.add("about__status-value--fail");
  }
}

// === Инициализация ===

(async function init() {
  // Проверяем storage
  await checkStorageAvailability();

  try {
    const response = await sendMessage({ action: "checkAPI" });

    if (response && !response.supported) {
      showWarning(
        "API группировки вкладок (browser.tabs.group) недоступен. " +
          "Расширение требует Firefox 128+."
      );
      btnGroup.disabled = true;
      btnUngroup.disabled = true;
      toggleAutoGroup.disabled = true;
      setStatus("error", "API группировки не поддерживается");
      updateAboutAPIStatus(false, false);
    } else if (response) {
      toggleAutoGroup.checked = !!response.autoGroup;
      updateAboutAPIStatus(true, !!response.autoGroup);
    }
  } catch (err) {
    showWarning("Не удалось инициализировать расширение.");
    setStatus("error", "Ошибка инициализации");
    updateAboutAPIStatus(false, false);
  }

  // Загружаем категории
  await loadCategories();

  // Обновляем счётчик в «О расширении»
  updateAboutCategoriesCount(currentCategories);
})();
