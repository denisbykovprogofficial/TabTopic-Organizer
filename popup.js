/**
 * popup.js — Логика интерфейса TabTopic Organizer v0.4.
 *
 * Управляет:
 * - Кнопками «Сгруппировать» и «Разгруппировать»
 * - Переключателем автогруппировки
 * - Редактированием пользовательских категорий
 * - Переключателем темы (светлая/тёмная)
 *
 * Взаимодействие с background.js через browser.runtime.sendMessage().
 */

"use strict";

// === Константы цветов ===

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
const btnTheme = document.getElementById("btn-theme");
const iconSun = document.getElementById("icon-sun");
const iconMoon = document.getElementById("icon-moon");

// === Состояние ===

let currentCategories = {};
let currentTheme = "auto";

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
 * Отправляет сообщение в background.js.
 */
function sendMessage(msg) {
  return browser.runtime.sendMessage(msg);
}

// === Переключение темы ===

/**
 * Применяет тему к body и обновляет иконки.
 *
 * @param {"auto"|"light"|"dark"} theme
 */
function applyTheme(theme) {
  currentTheme = theme;
  document.body.classList.remove("theme-light", "theme-dark");

  if (theme === "light") {
    document.body.classList.add("theme-light");
    iconSun.hidden = true;
    iconMoon.hidden = false;
  } else if (theme === "dark") {
    document.body.classList.add("theme-dark");
    iconSun.hidden = false;
    iconMoon.hidden = true;
  } else {
    // auto — определяем по системе
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (prefersDark) {
      document.body.classList.add("theme-dark");
      iconSun.hidden = false;
      iconMoon.hidden = true;
    } else {
      document.body.classList.add("theme-light");
      iconSun.hidden = true;
      iconMoon.hidden = false;
    }
  }
}

/**
 * Переключает тему: auto -> light -> dark -> auto
 */
function cycleTheme() {
  const order = ["auto", "light", "dark"];
  const idx = order.indexOf(currentTheme);
  const next = order[(idx + 1) % order.length];
  applyTheme(next);
  saveThemeToStorage(next);
}

/**
 * Сохраняет выбор темы в storage.
 */
async function saveThemeToStorage(theme) {
  try {
    await browser.storage.local.set({ theme });
  } catch (err) {
    console.warn("[TabTopic] Не удалось сохранить тему:", err);
  }
}

/**
 * Загружает тему из storage.
 */
async function loadThemeFromStorage() {
  try {
    const result = await browser.storage.local.get(["theme"]);
    if (result.theme) {
      applyTheme(result.theme);
    } else {
      applyTheme("auto");
    }
  } catch {
    applyTheme("auto");
  }
}

// === Основные кнопки ===

btnGroup.addEventListener("click", async () => {
  btnGroup.disabled = true;
  btnUngroup.disabled = true;
  setStatus("loading", "Выполняется группировка...");
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

// === Кнопка темы ===

btnTheme.addEventListener("click", cycleTheme);

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
  nameInput.placeholder = "Название";

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "category-card__delete";
  deleteBtn.textContent = "\u00D7";
  deleteBtn.title = "Удалить";

  row1.appendChild(nameInput);
  row1.appendChild(deleteBtn);

  // Строка 2: цвет
  const row2 = document.createElement("div");
  row2.className = "category-card__row";

  const colorInput = document.createElement("input");
  colorInput.type = "color";
  colorInput.className = "category-card__color";
  colorInput.value = COLOR_HEX[data.color] || COLOR_HEX.grey;

  const colorLabel = document.createElement("span");
  colorLabel.textContent = "Цвет";
  colorLabel.style.fontSize = "11px";
  colorLabel.style.color = "var(--text-muted)";
  colorLabel.style.marginLeft = "4px";

  row2.appendChild(colorInput);
  row2.appendChild(colorLabel);

  // Строка 3: ключевые слова
  const keywordsInput = document.createElement("textarea");
  keywordsInput.className = "category-card__keywords";
  keywordsInput.value = (data.keywords || []).join(", ");
  keywordsInput.placeholder = "Ключевые слова через запятую";
  keywordsInput.rows = 1;

  // Сборка
  card.appendChild(row1);
  card.appendChild(row2);
  card.appendChild(keywordsInput);

  // Обработчики
  deleteBtn.addEventListener("click", () => {
    card.remove();
    delete currentCategories[name];
  });

  nameInput.addEventListener("change", () => {
    const oldName = card.dataset.name;
    const newName = nameInput.value.trim();
    if (newName && newName !== oldName) {
      currentCategories[newName] = currentCategories[oldName];
      delete currentCategories[oldName];
      card.dataset.name = newName;
    }
  });

  colorInput.addEventListener("input", () => {
    const colorName = Object.keys(COLOR_HEX).find(
      (k) => COLOR_HEX[k] === colorInput.value
    );
    if (colorName && currentCategories[card.dataset.name]) {
      currentCategories[card.dataset.name].color = colorName;
    }
  });

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
 * Отрисовывает список категорий.
 */
function renderCategories() {
  categoriesList.innerHTML = "";
  for (const [name, data] of Object.entries(currentCategories)) {
    const card = createCategoryCard(name, data);
    categoriesList.appendChild(card);
  }
}

/**
 * Загружает категории из background.js.
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
 * Собирает данные из карточек.
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

// Кнопка «Добавить»
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

  card.querySelector(".category-card__name").focus();
  card.querySelector(".category-card__name").select();
});

// Кнопка «Сохранить»
btnSaveCategories.addEventListener("click", async () => {
  const categories = collectCategoriesFromUI();

  try {
    await sendMessage({ action: "saveCategories", categories });
    currentCategories = categories;
    setStatus("success", "Категории сохранены");
  } catch (err) {
    setStatus("error", "Ошибка сохранения");
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
      setStatus("success", "Категории сброшены");
    }
  } catch (err) {
    setStatus("error", "Ошибка сброса");
    console.error("[TabTopic Popup] Ошибка сброса:", err);
  }
});

// === Инициализация ===

(async function init() {
  // Загружаем тему
  await loadThemeFromStorage();

  try {
    const response = await sendMessage({ action: "checkAPI" });

    if (response && !response.supported) {
      showWarning(
        "API группировки (browser.tabs.group) недоступен. Firefox 128+."
      );
      btnGroup.disabled = true;
      btnUngroup.disabled = true;
      toggleAutoGroup.disabled = true;
      setStatus("error", "API не поддерживается");
    } else if (response) {
      toggleAutoGroup.checked = !!response.autoGroup;
    }
  } catch (err) {
    showWarning("Не удалось инициализировать расширение.");
    setStatus("error", "Ошибка инициализации");
  }

  // Загружаем категории
  await loadCategories();
})();
