"use strict";

const COLOR_HEX = { blue:"#0060df", red:"#d70022", yellow:"#e5a100", green:"#058b00", pink:"#ff6b9d", purple:"#9059ff", cyan:"#00b3f4", orange:"#ff6b35", grey:"#999999" };
const THEME_ORDER = ["auto", "light", "dark"];

const $ = (id) => document.getElementById(id);
const send = (msg) => browser.runtime.sendMessage(msg);

// DOM
const btnGroup=$("btn-group"), btnUngroup=$("btn-ungroup"), btnTheme=$("btn-theme"), btnUndo=$("btn-undo");
const btnCollapse=$("btn-collapse"), btnExpand=$("btn-expand");
const btnAdd=$("btn-add"), btnSave=$("btn-save"), btnReset=$("btn-reset");
const btnExport=$("btn-export"), btnImport=$("btn-import"), btnDupes=$("btn-dupes");
const btnSaveSession=$("btn-save-session"), btnShowSessions=$("btn-show-sessions");
const btnCloseDupes=$("btn-close-dupes");
const statusEl=$("status"), sIcon=$("status-icon"), sText=$("status-text");
const warningEl=$("warning"), warningText=$("warning-text");
const toggleAuto=$("toggle-auto"), catList=$("categories"), counterText=$("counter-text");
const icoSun=$("ico-sun"), icoMoon=$("ico-moon");
const searchInput=$("search-input"), tabResults=$("tab-results");
const groupStats=$("group-stats"), statsSection=$("stats-section");
const dupesSection=$("dupes-section"), dupesList=$("dupes-list");
const sessionsList=$("sessions-list"), fileImport=$("file-import");
const tabWhitelist=$("tab-whitelist"), tabBlacklist=$("tab-blacklist");
const filterList=$("filter-list"), btnSaveFilter=$("btn-save-filter");

let cats = {}, theme = "auto", currentFilter = "whitelist";

// === UI ===
function setStatus(type, text) {
  statusEl.className = "toast" + ({ok:" toast--ok",err:" toast--err",load:" toast--load"}[type]||"");
  sIcon.className = "toast__icon" + ({ok:" toast__icon--ok",err:" toast__icon--err",load:" toast__icon--spin"}[type]||"");
  sIcon.textContent = type==="ok"?"✓":type==="err"?"✗":"";
  sText.textContent = text;
}

function showWarning(msg) { if(msg){warningText.textContent=msg;warningEl.hidden=false}else warningEl.hidden=true; }

// === Theme ===
function applyTheme(t) {
  theme = t;
  document.body.classList.remove("theme-light","theme-dark");
  const d = t==="dark"||(t==="auto"&&matchMedia("(prefers-color-scheme:dark)").matches);
  document.body.classList.add(d?"theme-dark":"theme-light");
  icoSun.hidden=d; icoMoon.hidden=!d;
}

async function loadTheme() { const{theme:s}=await browser.storage.local.get(["theme"]); applyTheme(s||"auto"); }
async function cycleTheme() { const n=THEME_ORDER[(THEME_ORDER.indexOf(theme)+1)%3]; applyTheme(n); await browser.storage.local.set({theme:n}); }
btnTheme.addEventListener("click", cycleTheme);

// === Actions ===
async function doAction(action, loadingText) {
  btnGroup.disabled=btnUngroup.disabled=true;
  setStatus("load",loadingText); showWarning(null);
  try{const r=await send({action});setStatus(r?.success?"ok":"err",r?.message||"Unknown error")}
  catch{setStatus("err","Background connection failed")}
  finally{btnGroup.disabled=btnUngroup.disabled=false}
}

btnGroup.addEventListener("click",()=>doAction("group","Grouping..."));
btnUngroup.addEventListener("click",()=>doAction("ungroup","Ungrouping..."));
btnUndo.addEventListener("click",()=>doAction("undo","Undoing..."));
btnCollapse.addEventListener("click",()=>doAction("collapse","Collapsing..."));
btnExpand.addEventListener("click",()=>doAction("expand","Expanding..."));
toggleAuto.addEventListener("change",()=>send({action:"setAutoGroup",enabled:toggleAuto.checked}));

// === Search ===
searchInput.addEventListener("input", async () => {
  const q = searchInput.value.trim().toLowerCase();
  if (!q) { tabResults.hidden = true; return; }
  const tabs = await browser.tabs.query({ currentWindow: true });
  const matches = tabs.filter((t) => {
    const text = `${t.title||""} ${t.url||""}`.toLowerCase();
    return text.includes(q);
  });
  tabResults.hidden = false;
  tabResults.innerHTML = "";
  matches.forEach((t) => {
    const div = document.createElement("div");
    div.className = "tab-item";
    div.innerHTML = `<span class="tab-item__title">${t.title||t.url}</span><button class="tab-item__close" data-id="${t.id}" title="Close">×</button>`;
    div.addEventListener("click", (e) => {
      if (e.target.classList.contains("tab-item__close")) return;
      browser.tabs.update(t.id, { active: true });
      browser.windows.update(t.windowId, { focused: true });
    });
    div.querySelector(".tab-item__close").addEventListener("click", async (e) => {
      e.stopPropagation();
      await browser.tabs.remove(t.id);
      div.remove();
    });
    tabResults.appendChild(div);
  });
});

// === Categories ===
function createCard(name, data) {
  const card = document.createElement("div");
  card.className="cat"; card.dataset.name=name;

  const row=document.createElement("div"); row.className="cat__row";
  const nameIn=Object.assign(document.createElement("input"),{type:"text",className:"cat__name",value:name,placeholder:"Name"});
  const del=Object.assign(document.createElement("button"),{type:"button",className:"cat__del",textContent:"×",title:"Delete"});
  const count=document.createElement("span"); count.className="cat__count"; count.textContent="0";
  row.append(nameIn,del,count);

  const row2=document.createElement("div"); row2.className="cat__row";
  const colorIn=Object.assign(document.createElement("input"),{type:"color",className:"cat__color",value:COLOR_HEX[data.color]||COLOR_HEX.grey});
  const kwIn=Object.assign(document.createElement("textarea"),{className:"cat__kw",rows:1,placeholder:"Keywords, comma separated"});
  kwIn.value=(data.keywords||[]).join(", ");
  row2.append(colorIn,kwIn);

  card.append(row,row2);

  del.addEventListener("click",()=>{card.remove();delete cats[name]});
  nameIn.addEventListener("change",()=>{const o=card.dataset.name,n=nameIn.value.trim();if(n&&n!==o){cats[n]=cats[o];delete cats[o];card.dataset.name=n}});
  colorIn.addEventListener("input",()=>{const c=Object.keys(COLOR_HEX).find(k=>COLOR_HEX[k]===colorIn.value);if(c&&cats[card.dataset.name])cats[card.dataset.name].color=c});
  kwIn.addEventListener("change",()=>{const cn=card.dataset.name;if(cats[cn])cats[cn].keywords=kwIn.value.split(",").map(k=>k.trim()).filter(Boolean)});

  return card;
}

async function updateCategoryCounts() {
  const tabs = await browser.tabs.query({ currentWindow: true });
  const cards = catList.querySelectorAll(".cat");
  cards.forEach((card) => {
    const name = card.dataset.name;
    const catData = cats[name];
    const countEl = card.querySelector(".cat__count");
    if (!catData || !countEl) return;
    let count = 0;
    for (const tab of tabs) {
      const text = `${tab.title||""} ${tab.url||""}`.toLowerCase();
      if (catData.keywords.some((kw) => text.includes(kw.toLowerCase()))) count++;
    }
    countEl.textContent = count;
  });
}

function render() { catList.innerHTML=""; Object.entries(cats).forEach(([n,d])=>catList.appendChild(createCard(n,d))); updateCategoryCounts(); }

async function loadCats() { const r=await send({action:"getCategories"}); if(r?.categories){cats=r.categories;render()} }

function collectFromUI() {
  const out={};
  catList.querySelectorAll(".cat").forEach(c=>{
    const name=c.querySelector(".cat__name").value.trim(); if(!name)return;
    const cv=c.querySelector(".cat__color").value;
    const kw=c.querySelector(".cat__kw").value.split(",").map(k=>k.trim()).filter(Boolean);
    out[name]={keywords:kw,color:Object.keys(COLOR_HEX).find(k=>COLOR_HEX[k]===cv)||"grey"};
  });
  return out;
}

btnAdd.addEventListener("click",()=>{let n="New category",i=1;while(cats[n])n=`New category ${i++}`;cats[n]={keywords:[],color:"grey"};const c=createCard(n,cats[n]);catList.appendChild(c);const inp=c.querySelector(".cat__name");inp.focus();inp.select()});
btnSave.addEventListener("click",async()=>{const d=collectFromUI();await send({action:"saveCategories",categories:d});cats=d;setStatus("ok","Saved")});
btnReset.addEventListener("click",async()=>{const r=await send({action:"resetCategories"});if(r?.categories){cats=r.categories;render();setStatus("ok","Reset")}});

// === Group Stats ===
async function loadStats() {
  const r = await send({ action: "getGroupStats" });
  if (!r?.success || !r.stats.length) { statsSection.hidden = true; return; }
  statsSection.hidden = false;
  groupStats.innerHTML = "";
  for (const g of r.stats) {
    const div = document.createElement("div");
    div.className = "stat-item";
    div.innerHTML = `<span class="stat-item__dot" style="background:var(--${g.color==="grey"?"muted":g.color})"></span><span class="stat-item__name">${g.title||"Unnamed"}</span><span class="stat-item__count">${g.count}</span>`;
    groupStats.appendChild(div);
  }
}

// === Duplicates ===
btnDupes.addEventListener("click", async () => {
  const r = await send({ action: "findDuplicates" });
  if (!r?.success) return;
  if (!r.duplicates.length) { setStatus("ok","No duplicates found"); dupesSection.hidden=true; return; }
  dupesSection.hidden = false;
  dupesList.innerHTML = "";
  for (const d of r.duplicates) {
    const div = document.createElement("div");
    div.className = "dupe-item";
    const tabsHtml = d.tabs.map((t) => `<span class="dupe-tab" data-id="${t.id}" title="${t.url}">${t.title||t.url}</span>`).join("");
    div.innerHTML = `<div class="dupe-item__url">${d.url}</div><div class="dupe-item__tabs">${tabsHtml}</div>`;
    div.querySelectorAll(".dupe-tab").forEach((el) => {
      el.addEventListener("click", () => {
        const id = parseInt(el.dataset.id);
        browser.tabs.update(id, { active: true });
      });
    });
    dupesList.appendChild(div);
  }
  setStatus("ok",`Found ${r.duplicates.length} duplicate URLs`);
});

btnCloseDupes.addEventListener("click", async () => {
  const r = await send({ action: "findDuplicates" });
  if (!r?.success || !r.duplicates.length) return;
  const idsToClose = [];
  for (const d of r.duplicates) {
    for (let i = 1; i < d.tabs.length; i++) idsToClose.push(d.tabs[i].id);
  }
  if (idsToClose.length) await send({ action: "closeTabs", tabIds: idsToClose });
  dupesSection.hidden = true;
  setStatus("ok",`Closed ${idsToClose.length} duplicate tabs`);
});

// === Sessions ===
btnSaveSession.addEventListener("click", async () => {
  const name = prompt("Session name:");
  if (!name) return;
  const r = await send({ action: "saveSession", name });
  if (r?.success) setStatus("ok","Session saved");
});

btnShowSessions.addEventListener("click", async () => {
  const r = await send({ action: "getSessions" });
  if (!r?.success) return;
  sessionsList.hidden = !sessionsList.hidden;
  sessionsList.innerHTML = "";
  if (!r.sessions.length) { sessionsList.innerHTML = '<div style="font-size:11px;color:var(--muted);padding:4px">No saved sessions</div>'; return; }
  r.sessions.forEach((s, i) => {
    const div = document.createElement("div");
    div.className = "session-item";
    const date = new Date(s.timestamp).toLocaleString();
    div.innerHTML = `<span class="session-item__name">${s.name}</span><span class="session-item__date">${date}</span><button class="session-item__del" data-i="${i}" title="Delete">×</button>`;
    div.addEventListener("click", async (e) => {
      if (e.target.classList.contains("session-item__del")) return;
      // Restore: open tabs from session
      for (const t of s.tabs) {
        if (t.url) browser.tabs.create({ url: t.url, active: false });
      }
      setStatus("ok","Session restored");
    });
    div.querySelector(".session-item__del").addEventListener("click", async (e) => {
      e.stopPropagation();
      await send({ action: "deleteSession", index: i });
      div.remove();
    });
    sessionsList.appendChild(div);
  });
});

// === Export/Import ===
btnExport.addEventListener("click", async () => {
  const r = await send({ action: "exportCategories" });
  if (!r?.success) return;
  const blob = new Blob([JSON.stringify(r.data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "tabtopic-categories.json"; a.click();
  URL.revokeObjectURL(url);
  setStatus("ok","Exported");
});

btnImport.addEventListener("click", () => fileImport.click());
fileImport.addEventListener("change", async () => {
  const file = fileImport.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    const r = await send({ action: "importCategories", data });
    if (r?.success) { await loadCats(); setStatus("ok","Imported") }
    else setStatus("err",r?.message||"Import failed");
  } catch { setStatus("err","Invalid JSON file") }
  fileImport.value = "";
});

// === Filters ===
async function loadFilter() {
  const action = currentFilter === "whitelist" ? "getWhitelist" : "getBlacklist";
  const r = await send({ action });
  filterList.value = (r?.[currentFilter] || []).join("\n");
}

tabWhitelist.addEventListener("click", () => { currentFilter="whitelist"; tabWhitelist.classList.add("filter-tab--active"); tabBlacklist.classList.remove("filter-tab--active"); loadFilter(); });
tabBlacklist.addEventListener("click", () => { currentFilter="blacklist"; tabBlacklist.classList.add("filter-tab--active"); tabWhitelist.classList.remove("filter-tab--active"); loadFilter(); });

btnSaveFilter.addEventListener("click", async () => {
  const list = filterList.value.split("\n").map((s) => s.trim()).filter(Boolean);
  const action = currentFilter === "whitelist" ? "saveWhitelist" : "saveBlacklist";
  await send({ action, list });
  setStatus("ok", `${currentFilter} saved`);
});

// === Init ===
(async () => {
  await loadTheme();

  try {
    const r = await send({ action: "checkAPI" });
    if (r && !r.supported) {
      showWarning("API grouping unavailable. Firefox 128+.");
      btnGroup.disabled=btnUngroup.disabled=toggleAuto.disabled=true;
      setStatus("err","API not supported");
    } else if (r) { toggleAuto.checked=!!r.autoGroup; }
  } catch { showWarning("Extension init failed."); setStatus("err","Init error"); }

  await loadCats();
  await loadStats();
  await loadFilter();

  try {
    const r = await send({ action: "getTabCount" });
    if (r?.success) counterText.innerHTML = `Tabs: <span class="counter__num">${r.eligible}</span> / ${r.total}`;
  } catch { counterText.textContent = "Tabs: —"; }

  // Update counts every time popup opens
  updateCategoryCounts();
})();
