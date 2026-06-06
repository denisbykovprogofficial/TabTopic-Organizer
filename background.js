"use strict";

let autoGroupEnabled = false;

const isAPISupported = () =>
  typeof browser !== "undefined" &&
  browser.tabs &&
  typeof browser.tabs.group === "function" &&
  typeof browser.tabs.ungroup === "function";

const isEligibleTab = (tab) => {
  const url = tab.url || "";
  return !url.startsWith("about:") && !url.startsWith("moz-extension:") && !url.startsWith("https://addons.mozilla.org/");
};

async function groupTabs(tabs) {
  if (!isAPISupported()) {
    return { success: false, message: "API browser.tabs.group недоступен. Требуется Firefox 128+." };
  }

  if (!tabs?.length) {
    return { success: false, message: "Нет открытых вкладок для группировки." };
  }

  const eligible = tabs.filter(isEligibleTab);
  if (!eligible.length) {
    return { success: false, message: "Все вкладки служебные — группировать нечего." };
  }

  const categorized = new Map();
  for (const tab of eligible) {
    const { name, color } = categorizeTab(tab);
    if (!categorized.has(name)) categorized.set(name, { color, tabIds: [] });
    categorized.get(name).tabIds.push(tab.id);
  }

  let groupCount = 0;
  for (const [name, { color, tabIds }] of categorized) {
    try {
      const groupId = await browser.tabs.group({ tabIds });
      await browser.tabGroups.update(groupId, { title: name, color, collapsed: false });
      groupCount++;
    } catch (err) {
      console.error(`[TabTopic] Ошибка группы "${name}":`, err);
    }
  }

  return { success: true, message: `Создано ${groupCount} групп из ${eligible.length} вкладок.`, groupCount };
}

async function groupAllTabs() {
  return groupTabs(await browser.tabs.query({ currentWindow: true }));
}

async function ungroupAllTabs() {
  if (!isAPISupported()) return { success: false, message: "API ungroup недоступен." };

  const tabs = await browser.tabs.query({ currentWindow: true });
  const ids = tabs.filter((t) => t.groupId !== -1).map((t) => t.id);

  if (!ids.length) return { success: false, message: "Нет сгруппированных вкладок." };

  await browser.tabs.ungroup(ids);
  return { success: true, message: `Разгруппировано ${ids.length} вкладок.` };
}

async function handleTabCreated(tab) {
  if (!autoGroupEnabled || !isAPISupported()) return;

  try {
    const updated = await browser.tabs.get(tab.id);
    if (!isEligibleTab(updated)) return;

    const { name, color } = categorizeTab(updated);
    const groupId = await browser.tabs.group({ tabIds: [tab.id] });
    await browser.tabGroups.update(groupId, { title: name, color, collapsed: false });
  } catch (err) {
    console.warn("[TabTopic] Автогруппировка:", err.message);
  }
}

const handlers = {
  group: () => groupAllTabs(),
  ungroup: () => ungroupAllTabs(),
  checkAPI: () => ({ supported: isAPISupported(), autoGroup: autoGroupEnabled }),
  getCategories: async () => ({ categories: await loadCategoriesFromStorage() }),
  saveCategories: async (msg) => { await saveCategoriesToStorage(msg.categories); return { success: true }; },
  resetCategories: async () => { await resetCategoriesToDefault(); return { success: true, categories: getActiveCategories() }; },
  setAutoGroup: async (msg) => {
    autoGroupEnabled = !!msg.enabled;
    await browser.storage.local.set({ autoGroup: autoGroupEnabled });
    return { success: true, autoGroup: autoGroupEnabled };
  }
};

browser.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  const handler = handlers[msg?.action];
  if (!handler) return false;
  handler(msg).then(sendResponse);
  return true;
});

(async () => {
  await loadCategoriesFromStorage();
  const { autoGroup } = await browser.storage.local.get(["autoGroup"]);
  autoGroupEnabled = !!autoGroup;
  browser.tabs.onCreated.addListener(handleTabCreated);
})();
