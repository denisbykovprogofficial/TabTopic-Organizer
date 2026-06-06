"use strict";

const AVAILABLE_COLORS = ["blue", "red", "yellow", "green", "pink", "purple", "cyan", "orange", "grey"];

const DEFAULT_CATEGORIES = {
  "Разработка": {
    keywords: ["github", "stackoverflow", "stackexchange", "gitlab", "bitbucket", "npm", "yarn", "pypi", "docker", "kubernetes", "codepen", "jsfiddle", "developer.mozilla", "mdn", "w3schools", "typescript", "javascript", "python", "java ", "rust-lang", "golang", "reactjs", "vuejs", "angular", "svelte", "nextjs", "nuxt", "webpack", "vitejs", "vercel", "netlify", "code.visualstudio", "jetbrains", "vim", "neovim", "emacs", "dev.to", "habr.com", "linux.org", "sourceforge", "crates.io"],
    color: "blue"
  },
  "Новости": {
    keywords: ["bbc", "cnn", "reuters", "apnews", "ria.ru", "rbc.ru", "rt.com", "lenta.ru", "gazeta.ru", "kommersant", "iz.ru", "tass.ru", "interfax", "fontanka.ru", "meduza.io", "theverge", "arstechnica", "wired.com", "techcrunch", "engadget", "gizmodo", "cnet.com", "nytimes", "washingtonpost", "theguardian", "bloomberg", "forbes.com", "cnbc.com", "sports.ru", "championat"],
    color: "red"
  },
  "Соцсети": {
    keywords: ["facebook.com", "twitter.com", "x.com", "instagram.com", "tiktok.com", "linkedin.com", "reddit.com", "pinterest.com", "snapchat.com", "t.me", "telegram", "discord.com", "twitch.tv", "youtube.com", "vk.com", "ok.ru", "threads.net", "mastodon", "bluesky", "bsky.app", "whatsapp.com"],
    color: "purple"
  },
  "Покупки": {
    keywords: ["amazon.", "ozon.", "wildberries.", "aliexpress.", "ebay.", "etsy.com", "bestbuy.", "walmart.", "target.com", "avito.ru", "citilink.", "dns-shop.", "mvideo.", "eldorado.", "lamoda.", "leroymerlin", "petrovich."],
    color: "orange"
  },
  "Работа и Офис": {
    keywords: ["docs.google", "sheets.google", "slides.google", "drive.google", "notion.so", "trello.com", "asana.com", "jira.atlassian", "confluence", "slack.com", "teams.microsoft", "zoom.us", "meet.google", "calendar.google", "outlook.office", "onedrive", "dropbox.com", "airtable.com", "monday.com", "clickup.com", "todoist.com", "linear.app", "figma.com", "miro.com", "canva.com"],
    color: "yellow"
  },
  "Обучение": {
    keywords: ["coursera.", "udemy.com", "edx.org", "khanacademy", "skillshare", "leetcode.com", "codecademy", "freecodecamp", "pluralsight", "stepik.org", "geekbrains", "htmlacademy", "learn.javascript", "kaggle.com", "wikipedia.org", "wikihow.com"],
    color: "cyan"
  },
  "Развлечения": {
    keywords: ["netflix.com", "primevideo", "disneyplus", "hbomax", "hulu.com", "spotify.com", "soundcloud", "music.apple", "deezer", "imdb.com", "rottentomatoes", "store.steampowered", "epicgames", "gog.com", "9gag.com", "imgur.com", "twitch.tv", "dailymotion", "vimeo.com", "kinopoisk.ru", "ivi.ru", "okko.tv", "premier.ru", "more.tv"],
    color: "pink"
  }
};

const DEFAULT_CATEGORY_NAME = "Прочее";

let activeCategories = structuredClone(DEFAULT_CATEGORIES);

async function loadCategoriesFromStorage() {
  try {
    const { categories, useCustom } = await browser.storage.local.get(["categories", "useCustom"]);
    activeCategories = (useCustom && categories) ? categories : structuredClone(DEFAULT_CATEGORIES);
  } catch {
    activeCategories = structuredClone(DEFAULT_CATEGORIES);
  }
  return activeCategories;
}

async function saveCategoriesToStorage(categories) {
  await browser.storage.local.set({ categories, useCustom: true });
  activeCategories = categories;
}

async function resetCategoriesToDefault() {
  await browser.storage.local.remove(["categories", "useCustom"]);
  activeCategories = structuredClone(DEFAULT_CATEGORIES);
}

function getActiveCategories() {
  return structuredClone(activeCategories);
}

function categorizeTab(tab) {
  const text = `${tab.title || ""} ${tab.url || ""}`.toLowerCase();

  for (const [name, { keywords, color }] of Object.entries(activeCategories)) {
    if (keywords.some((kw) => text.includes(kw.toLowerCase()))) {
      return { name, color };
    }
  }

  return { name: DEFAULT_CATEGORY_NAME, color: "grey" };
}
