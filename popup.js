/**
 * popup.js — Логика интерфейса расширения TabTopic Organizer.
 *
 * Управляет кнопками "Сгруппировать" и "Разгруппировать", отображает
 * статус выполнения и предупреждения о недоступности API.
 *
 * Взаимодействие с background.js осуществляется через
 * browser.runtime.sendMessage().
 */

"use strict";

// === DOM-элементы ===

const btnGroup = document.getElementById("btn-group");
const btnUngroup = document.getElementById("btn-ungroup");
const statusEl = document.getElementById("status");
const statusIcon = document.getElementById("status-icon");
const statusText = document.getElementById("status-text");
const warningEl = document.getElementById("warning");
const warningText = document.getElementById("warning-text");

// === Утилиты отображения ===

/**
 * Устанавливает статус: loading, success или error.
 *
 * @param {"loading"|"success"|"error"} type — тип статуса
 * @param {string} text — текст сообщения
 */
function setStatus(type, text) {
  // Сбрасываем предыдущие модификаторы
  statusEl.classList.remove("status--loading", "status--success", "status--error");
  statusIcon.classList.remove(
    "status__icon--loading",
    "status__icon--success",
    "status__icon--error"
  );

  // Устанавливаем новый тип
  statusEl.classList.add(`status--${type}`);

  if (type === "loading") {
    statusIcon.classList.add("status__icon--loading");
  } else if (type === "success") {
    statusIcon.classList.add("status__icon--success");
    statusIcon.textContent = "✓";
  } else if (type === "error") {
    statusIcon.classList.add("status__icon--error");
    statusIcon.textContent = "✕";
  }

  statusText.textContent = text;
}

/**
 * Показывает или скрывает блок предупреждения.
 *
 * @param {string|null} message — текст предупреждения или null для скрытия
 */
function showWarning(message) {
  if (message) {
    warningText.textContent = message;
    warningEl.hidden = false;
  } else {
    warningEl.hidden = true;
  }
}

// === Обработчики кнопок ===

/**
 * Обработчик нажатия кнопки "Сгруппировать вкладки".
 * Отправляет сообщение background.js с action: "group".
 */
btnGroup.addEventListener("click", async () => {
  // Блокируем кнопки на время выполнения
  btnGroup.disabled = true;
  btnUngroup.disabled = true;

  setStatus("loading", "Выполняется группировка вкладок...");
  showWarning(null);

  try {
    // Отправляем запрос в background.js
    const response = await browser.runtime.sendMessage({ action: "group" });

    if (response && response.success) {
      setStatus("success", response.message);
    } else {
      setStatus("error", response ? response.message : "Неизвестная ошибка");
    }
  } catch (err) {
    console.error("[TabTopic Popup] Ошибка связи с background:", err);
    setStatus(
      "error",
      "Не удалось связаться с фоновым скриптом. Проверьте консоль."
    );
  } finally {
    // Разблокируем кнопки
    btnGroup.disabled = false;
    btnUngroup.disabled = false;
  }
});

/**
 * Обработчик нажатия кнопки "Разгруппировать все".
 * Отправляет сообщение background.js с action: "ungroup".
 */
btnUngroup.addEventListener("click", async () => {
  btnGroup.disabled = true;
  btnUngroup.disabled = true;

  setStatus("loading", "Удаление групп...");
  showWarning(null);

  try {
    const response = await browser.runtime.sendMessage({ action: "ungroup" });

    if (response && response.success) {
      setStatus("success", response.message);
    } else {
      setStatus("error", response ? response.message : "Неизвестная ошибка");
    }
  } catch (err) {
    console.error("[TabTopic Popup] Ошибка связи с background:", err);
    setStatus(
      "error",
      "Не удалось связаться с фоновым скриптом. Проверьте консоль."
    );
  } finally {
    btnGroup.disabled = false;
    btnUngroup.disabled = false;
  }
});

// === Инициализация: проверка поддержки API при открытии popup ===

(async function init() {
  try {
    const response = await browser.runtime.sendMessage({ action: "checkAPI" });

    if (response && !response.supported) {
      showWarning(
        "API группировки вкладок (browser.tabs.group) недоступен. " +
          "Расширение требует Firefox 128+. " +
          "Попробуйте включить layout.tabs.groups в about:config."
      );
      btnGroup.disabled = true;
      btnUngroup.disabled = true;
      setStatus("error", "API группировки не поддерживается");
    }
  } catch (err) {
    // Если не удалось связаться с background — возможно расширение не загружено
    showWarning("Не удалось инициализировать расширение.");
    setStatus("error", "Ошибка инициализации");
  }
})();
