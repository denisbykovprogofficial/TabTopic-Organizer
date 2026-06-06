"use strict";

const COLOR_HEX = { blue:"#0060df", red:"#d70022", yellow:"#e5a100", green:"#058b00", pink:"#ff6b9d", purple:"#9059ff", cyan:"#00b3f4", orange:"#ff6b35", grey:"#999999" };
const THEME_ORDER = ["auto", "light", "dark"];

const $ = (id) => document.getElementById(id);
const send = (msg) => browser.runtime.sendMessage(msg);

// DOM
const btnGroup = $("btn-group"), btnUngroup = $("btn-ungroup"), btnTheme = $("btn-theme");
const btnAdd = $("btn-add"), btnSave = $("btn-save"), btnReset = $("btn-reset");
const statusEl = $("status"), sIcon = $("status-icon"), sText = $("status-text");
const warningEl = $("warning"), warningText = $("warning-text");
const toggleAuto = $("toggle-auto"), catList = $("categories");
const counterText = $("counter-text"), icoSun = $("ico-sun"), icoMoon = $("ico-moon");

let cats = {}, theme = "auto";

// === UI helpers ===
function setStatus(type, text) {
  statusEl.className = "toast" + ({ ok: " toast--ok", err: " toast--err", load: " toast--load" }[type] || "");
  sIcon.className = "toast__icon" + ({ ok: " toast__icon--ok", err: " toast__icon--err", load: " toast__icon--spin" }[type] || "");
  sIcon.textContent = type === "ok" ? "\u2713" : type === "err" ? "\u2717" : "";
  sText.textContent = text;
}

function showWarning(msg) {
  if (msg) { warningText.textContent = msg; warningEl.hidden = false; }
  else warningEl.hidden = true;
}

function updateCounter(tabs) {
  const eligible = tabs.filter((t) => {
    const u = t.url || "";
    return !u.startsWith("about:") && !u.startsWith("moz-extension:") && !u.startsWith("https://addons.mozilla.org/");
  });
  counterText.innerHTML = `Открыто вкладок: <span class="counter__num">${eligible.length}</span>`;
}

// === Theme ===
function applyTheme(t) {
  theme = t;
  document.body.classList.remove("theme-light", "theme-dark");
  const isDark = t === "dark" || (t === "auto" && matchMedia("(prefers-color-scheme:dark)").matches);
  document.body.classList.add(isDark ? "theme-dark" : "theme-light");
  icoSun.hidden = isDark; icoMoon.hidden = !isDark;
}

async function loadTheme() {
  const { theme: saved } = await browser.storage.local.get(["theme"]);
  applyTheme(saved || "auto");
}

async function cycleTheme() {
  const next = THEME_ORDER[(THEME_ORDER.indexOf(theme) + 1) % 3];
  applyTheme(next);
  await browser.storage.local.set({ theme: next });
}

btnTheme.addEventListener("click", cycleTheme);

// === Actions ===
async function doAction(action, loadingText) {
  btnGroup.disabled = btnUngroup.disabled = true;
  setStatus("load", loadingText);
  showWarning(null);
  try {
    const r = await send({ action });
    setStatus(r?.success ? "ok" : "err", r?.message || "Неизвестная ошибка");
  } catch {
    setStatus("err", "Ошибка связи с background");
  } finally {
    btnGroup.disabled = btnUngroup.disabled = false;
  }
}

btnGroup.addEventListener("click", () => doAction("group", "Группировка..."));
btnUngroup.addEventListener("click", () => doAction("ungroup", "Удаление групп..."));
toggleAuto.addEventListener("change", () => send({ action: "setAutoGroup", enabled: toggleAuto.checked }));

// === Categories ===
function createCard(name, data) {
  const card = document.createElement("div");
  card.className = "cat"; card.dataset.name = name;

  const row = document.createElement("div"); row.className = "cat__row";

  const nameIn = Object.assign(document.createElement("input"), { type: "text", className: "cat__name", value: name, placeholder: "Название" });
  const del = Object.assign(document.createElement("button"), { type: "button", className: "cat__del", textContent: "\u00D7", title: "Удалить" });
  row.append(nameIn, del);

  const row2 = document.createElement("div"); row2.className = "cat__row";
  const colorIn = Object.assign(document.createElement("input"), { type: "color", className: "cat__color", value: COLOR_HEX[data.color] || COLOR_HEX.grey });
  const colorLbl = Object.assign(document.createElement("span"), { textContent: "Цвет" });
  colorLbl.style.cssText = "font-size:10px;color:var(--muted)";
  row2.append(colorIn, colorLbl);

  const kwIn = Object.assign(document.createElement("textarea"), { className: "cat__kw", rows: 1, placeholder: "Ключевые слова через запятую" });
  kwIn.value = (data.keywords || []).join(", ");

  card.append(row, row2, kwIn);

  del.addEventListener("click", () => { card.remove(); delete cats[name]; });
  nameIn.addEventListener("change", () => {
    const old = card.dataset.name, nw = nameIn.value.trim();
    if (nw && nw !== old) { cats[nw] = cats[old]; delete cats[old]; card.dataset.name = nw; }
  });
  colorIn.addEventListener("input", () => {
    const c = Object.keys(COLOR_HEX).find((k) => COLOR_HEX[k] === colorIn.value);
    if (c && cats[card.dataset.name]) cats[card.dataset.name].color = c;
  });
  kwIn.addEventListener("change", () => {
    const cn = card.dataset.name;
    if (cats[cn]) cats[cn].keywords = kwIn.value.split(",").map((k) => k.trim()).filter(Boolean);
  });

  return card;
}

function render() { catList.innerHTML = ""; Object.entries(cats).forEach(([n, d]) => catList.appendChild(createCard(n, d))); }

async function loadCats() {
  const r = await send({ action: "getCategories" });
  if (r?.categories) { cats = r.categories; render(); }
}

function collectFromUI() {
  const out = {};
  catList.querySelectorAll(".cat").forEach((c) => {
    const name = c.querySelector(".cat__name").value.trim();
    if (!name) return;
    const colorVal = c.querySelector(".cat__color").value;
    const kw = c.querySelector(".cat__kw").value.split(",").map((k) => k.trim()).filter(Boolean);
    out[name] = { keywords: kw, color: Object.keys(COLOR_HEX).find((k) => COLOR_HEX[k] === colorVal) || "grey" };
  });
  return out;
}

btnAdd.addEventListener("click", () => {
  let n = "Новая категория", i = 1;
  while (cats[n]) n = `Новая категория ${i++}`;
  cats[n] = { keywords: [], color: "grey" };
  const c = createCard(n, cats[n]); catList.appendChild(c);
  const inp = c.querySelector(".cat__name"); inp.focus(); inp.select();
});

btnSave.addEventListener("click", async () => {
  const data = collectFromUI();
  await send({ action: "saveCategories", categories: data });
  cats = data; setStatus("ok", "Сохранено");
});

btnReset.addEventListener("click", async () => {
  const r = await send({ action: "resetCategories" });
  if (r?.categories) { cats = r.categories; render(); setStatus("ok", "Сброшено"); }
});

// === Init ===
(async () => {
  await loadTheme();

  try {
    const r = await send({ action: "checkAPI" });
    if (r && !r.supported) {
      showWarning("API группировки недоступен. Firefox 128+.");
      btnGroup.disabled = btnUngroup.disabled = toggleAuto.disabled = true;
      setStatus("err", "API не поддерживается");
    } else if (r) {
      toggleAuto.checked = !!r.autoGroup;
    }
  } catch {
    showWarning("Ошибка инициализации расширения.");
    setStatus("err", "Ошибка инициализации");
  }

  await loadCats();

  // Load tab count
  try {
    const tabs = await browser.tabs.query({ currentWindow: true });
    updateCounter(tabs);
  } catch {
    counterText.textContent = "Не удалось загрузить вкладки";
  }
})();
