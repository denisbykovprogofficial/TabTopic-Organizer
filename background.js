"use strict";

let autoGroupEnabled = false;
let lastGroupAction = null;

const isAPISupported = () =>
  typeof browser !== "undefined" && browser.tabs &&
  typeof browser.tabs.group === "function" && typeof browser.tabs.ungroup === "function";

async function groupTabs(tabs) {
  if (!isAPISupported()) return { success: false, message: "API browser.tabs.group unavailable. Firefox 128+ required." };
  if (!tabs?.length) return { success: false, message: "No open tabs to group." };

  const eligible = tabs.filter(isEligibleTab);
  if (!eligible.length) return { success: false, message: "All tabs are system tabs — nothing to group." };

  const categorized = new Map();
  for (const tab of eligible) {
    const { name, color } = categorizeTab(tab);
    if (!categorized.has(name)) categorized.set(name, { color, tabIds: [] });
    categorized.get(name).tabIds.push(tab.id);
  }

  const previousState = [];
  for (const tab of eligible) {
    previousState.push({ id: tab.id, groupId: tab.groupId });
  }

  let groupCount = 0;
  for (const [name, { color, tabIds }] of categorized) {
    try {
      const groupId = await browser.tabs.group({ tabIds });
      await browser.tabGroups.update(groupId, { title: name, color, collapsed: false });
      groupCount++;
    } catch (err) {
      console.error(`[TabTopic] Group "${name}" error:`, err);
    }
  }

  lastGroupAction = { type: "group", previousState, timestamp: Date.now() };

  return { success: true, message: `Created ${groupCount} groups from ${eligible.length} tabs.`, groupCount };
}

async function groupAllTabs() {
  return groupTabs(await browser.tabs.query({ currentWindow: true }));
}

async function ungroupAllTabs() {
  if (!isAPISupported()) return { success: false, message: "API ungroup unavailable." };

  const tabs = await browser.tabs.query({ currentWindow: true });
  const ids = tabs.filter((t) => t.groupId !== -1).map((t) => t.id);
  if (!ids.length) return { success: false, message: "No grouped tabs to ungroup." };

  const previousState = tabs.filter((t) => t.groupId !== -1).map((t) => ({ id: t.id, groupId: t.groupId }));
  await browser.tabs.ungroup(ids);
  lastGroupAction = { type: "ungroup", previousState, timestamp: Date.now() };

  return { success: true, message: `Ungrouped ${ids.length} tabs.` };
}

async function undoLastAction() {
  if (!lastGroupAction) return { success: false, message: "Nothing to undo." };
  if (!isAPISupported()) return { success: false, message: "API unavailable." };

  try {
    if (lastGroupAction.type === "group") {
      const tabs = await browser.tabs.query({ currentWindow: true });
      const groupedIds = tabs.filter((t) => t.groupId !== -1).map((t) => t.id);
      if (groupedIds.length) await browser.tabs.ungroup(groupedIds);
    } else if (lastGroupAction.type === "ungroup") {
      const groups = new Map();
      for (const { id, groupId } of lastGroupAction.previousState) {
        if (groupId === -1) continue;
        if (!groups.has(groupId)) groups.set(groupId, []);
        groups.get(groupId).push(id);
      }
      for (const [, tabIds] of groups) {
        const gId = await browser.tabs.group({ tabIds });
        await browser.tabGroups.update(gId, { collapsed: false });
      }
    }

    const msg = lastGroupAction.type === "group" ? "Undo: groups removed." : "Undo: groups restored.";
    lastGroupAction = null;
    return { success: true, message: msg };
  } catch (err) {
    return { success: false, message: `Undo failed: ${err.message}` };
  }
}

async function collapseAllGroups() {
  const groups = await browser.tabGroups.query({ windowId: browser.windows.WINDOW_ID_CURRENT });
  for (const g of groups) {
    try { await browser.tabGroups.update(g.id, { collapsed: true }); } catch {}
  }
  return { success: true, message: `Collapsed ${groups.length} groups.` };
}

async function expandAllGroups() {
  const groups = await browser.tabGroups.query({ windowId: browser.windows.WINDOW_ID_CURRENT });
  for (const g of groups) {
    try { await browser.tabGroups.update(g.id, { collapsed: false }); } catch {}
  }
  return { success: true, message: `Expanded ${groups.length} groups.` };
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
    console.warn("[TabTopic] Auto-group:", err.message);
  }
}

// Context menu
browser.runtime.onInstalled.addListener(() => {
  browser.contextMenus.create({
    id: "tabtopic-add-to-category",
    title: "Add to TabTopic category",
    contexts: ["tab"]
  });
});

browser.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "tabtopic-add-to-category" && tab) {
    const { name, color } = categorizeTab(tab);
    try {
      const groupId = await browser.tabs.group({ tabIds: [tab.id] });
      await browser.tabGroups.update(groupId, { title: name, color, collapsed: false });
    } catch (err) {
      console.warn("[TabTopic] Context menu error:", err.message);
    }
  }
});

// Keyboard shortcuts
browser.commands.onCommand.addListener(async (command) => {
  if (command === "group-tabs") await groupAllTabs();
  else if (command === "ungroup-tabs") await ungroupAllTabs();
  else if (command === "undo-group") await undoLastAction();
});

// Message handler
const handlers = {
  group: () => groupAllTabs(),
  ungroup: () => ungroupAllTabs(),
  undo: () => undoLastAction(),
  collapse: () => collapseAllGroups(),
  expand: () => expandAllGroups(),
  checkAPI: () => ({ supported: isAPISupported(), autoGroup: autoGroupEnabled }),
  getCategories: async () => ({ categories: await loadCategoriesFromStorage() }),
  saveCategories: async (msg) => { await saveCategoriesToStorage(msg.categories); return { success: true }; },
  resetCategories: async () => { await resetCategoriesToDefault(); return { success: true, categories: getActiveCategories() }; },
  setAutoGroup: async (msg) => {
    autoGroupEnabled = !!msg.enabled;
    await browser.storage.local.set({ autoGroup: autoGroupEnabled });
    return { success: true, autoGroup: autoGroupEnabled };
  },
  exportCategories: async () => {
    const cats = await loadCategoriesFromStorage();
    const settings = await browser.storage.local.get(["autoGroup", "theme", "whitelist", "blacklist"]);
    return { success: true, data: { categories: cats, settings } };
  },
  importCategories: async (msg) => {
    if (!msg.data?.categories) return { success: false, message: "Invalid import data." };
    await saveCategoriesToStorage(msg.data.categories);
    if (msg.data.settings) await browser.storage.local.set(msg.data.settings);
    return { success: true };
  },
  findDuplicates: async () => {
    const tabs = await browser.tabs.query({ currentWindow: true });
    return { success: true, duplicates: findDuplicateTabs(tabs) };
  },
  closeTabs: async (msg) => {
    if (msg.tabIds?.length) await browser.tabs.remove(msg.tabIds);
    return { success: true };
  },
  getTabCount: async () => {
    const tabs = await browser.tabs.query({ currentWindow: true });
    return { success: true, total: tabs.length, eligible: tabs.filter(isEligibleTab).length };
  },
  getGroupStats: async () => {
    const tabs = await browser.tabs.query({ currentWindow: true });
    const groups = await browser.tabGroups.query({ windowId: browser.windows.WINDOW_ID_CURRENT });
    const stats = [];
    for (const g of groups) {
      const tabsInGroup = tabs.filter((t) => t.groupId === g.id);
      stats.push({ id: g.id, title: g.title, color: g.color, count: tabsInGroup.length, collapsed: g.collapsed });
    }
    return { success: true, stats };
  },
  saveSession: async (msg) => {
    const tabs = await browser.tabs.query({ currentWindow: true });
    const groups = await browser.tabGroups.query({ windowId: browser.windows.WINDOW_ID_CURRENT });
    const session = {
      name: msg.name || `Session ${new Date().toLocaleString()}`,
      timestamp: Date.now(),
      tabs: tabs.map((t) => ({ url: t.url, title: t.title, pinned: t.pinned, groupId: t.groupId })),
      groups: groups.map((g) => ({ id: g.id, title: g.title, color: g.color }))
    };
    const { sessions = [] } = await browser.storage.local.get(["sessions"]);
    sessions.push(session);
    await browser.storage.local.set({ sessions });
    return { success: true, sessions };
  },
  getSessions: async () => {
    const { sessions = [] } = await browser.storage.local.get(["sessions"]);
    return { success: true, sessions };
  },
  deleteSession: async (msg) => {
    const { sessions = [] } = await browser.storage.local.get(["sessions"]);
    const filtered = sessions.filter((_, i) => i !== msg.index);
    await browser.storage.local.set({ sessions: filtered });
    return { success: true, sessions: filtered };
  },
  getWhitelist: async () => {
    const { whitelist = [] } = await browser.storage.local.get(["whitelist"]);
    return { success: true, whitelist };
  },
  saveWhitelist: async (msg) => {
    await browser.storage.local.set({ whitelist: msg.list || [] });
    return { success: true };
  },
  getBlacklist: async () => {
    const { blacklist = [] } = await browser.storage.local.get(["blacklist"]);
    return { success: true, blacklist };
  },
  saveBlacklist: async (msg) => {
    await browser.storage.local.set({ blacklist: msg.list || [] });
    return { success: true };
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
