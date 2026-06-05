/**
 * utils.js — Модуль утилит и словарей для категоризации вкладок.
 *
 * Содержит предопределённый словарь ключевых слов, сопоставленных
 * с тематическими категориями, а также функцию categorizeTab(),
 * которая определяет категорию вкладки по её title и url.
 *
 * Поддерживает пользовательские категории, загружаемые из browser.storage.local.
 */

"use strict";

/**
 * Цвета, допустимые API browser.tabs.group:
 * "blue", "red", "yellow", "green", "pink", "purple", "cyan", "orange", "grey"
 */
const AVAILABLE_COLORS = [
  "blue", "red", "yellow", "green", "pink", "purple", "cyan", "orange", "grey"
];

/**
 * Словарь категорий по умолчанию.
 * Ключ — название категории, значение — { keywords: string[], color: string }.
 */
const DEFAULT_CATEGORIES = {
  "Разработка": {
    keywords: [
      "github", "stackoverflow", "stackexchange", "gitlab", "bitbucket",
      "npm", "yarn", "pypi", "docker", "kubernetes", "codepen", "jsfiddle",
      "developer.mozilla", "mdn", "w3schools", "typescript", "javascript",
      "python", "java ", "rust-lang", "golang", "reactjs", "vuejs", "angular",
      "svelte", "nextjs", "nuxt", "webpack", "vitejs", "vercel", "netlify",
      "code.visualstudio", "jetbrains", "vim", "neovim", "emacs",
      "dev.to", "habr.com", "linux.org", "sourceforge", "crates.io"
    ],
    color: "blue"
  },

  "Новости": {
    keywords: [
      "bbc", "cnn", "reuters", "apnews", "ria.ru", "rbc.ru", "rt.com",
      "lenta.ru", "gazeta.ru", "kommersant", "iz.ru", "tass.ru",
      "interfax", "fontanka.ru", "meduza.io", "theverge", "arstechnica",
      "wired.com", "techcrunch", "engadget", "gizmodo", "cnet.com",
      "bbc.com/news", "cnn.com", "nytimes", "washingtonpost", "theguardian",
      "foreignpolicy", "foreignaffairs", "bloomberg", "forbes.com",
      "businessinsider", "finance.yahoo", "marketwatch", "cnbc.com",
      "espn.com", "sports.ru", "championat", "matchtv"
    ],
    color: "red"
  },

  "Соцсети": {
    keywords: [
      "facebook.com", "twitter.com", "x.com", "instagram.com", "tiktok.com",
      "linkedin.com", "reddit.com", "pinterest.com", "snapchat.com",
      "t.me", "telegram", "discord.com", "twitch.tv", "youtube.com",
      "vk.com", "ok.ru", "tiktok", "threads.net", "mastodon",
      "bluesky", "bsky.app", "whatsapp.com", "messaging"
    ],
    color: "purple"
  },

  "Покупки": {
    keywords: [
      "amazon.", "ozon.", "wildberries.", "aliexpress.", "ebay.",
      "etsy.com", "bestbuy.", "walmart.", "target.com", "craigslist",
      "avito.ru", "youla.ru", "mulberry", "market.yandex", "beru.ru",
      "citilink.", "dns-shop.", "mvideo.", "eldorado.", "lamoda.",
      "220-volt", "leroymerlin", "obi.ru", "petrovich.", "vseinstrumenti"
    ],
    color: "orange"
  },

  "Работа и Офис": {
    keywords: [
      "docs.google", "sheets.google", "slides.google", "drive.google",
      "notion.so", "trello.com", "asana.com", "jira.atlassian",
      "confluence", "slack.com", "teams.microsoft", "zoom.us",
      "meet.google", "calendar.google", "outlook.office", "onedrive",
      "dropbox.com", "box.com", "airtable.com", "monday.com",
      "clickup.com", "todoist.com", "habr.com/ru/companies",
      "linear.app", "figma.com", "miro.com", "canva.com"
    ],
    color: "yellow"
  },

  "Обучение": {
    keywords: [
      "coursera.", "udemy.com", "edx.org", "khan academy", "khanacademy",
      "skillshare", "brilliant.org", "leetcode.com", "codecademy",
      "freecodecamp", "pluralsight", "udacity", "mooc",
      "stepik.org", "academy.yandex", "stepik", "geekbrains",
      "netology.ru", "htmlacademy", "learn.javascript",
      "playground.tensorflow", "colab.research", "kaggle.com",
      "wikipedia.org", "wikihow.com"
    ],
    color: "cyan"
  },

  "Развлечения": {
    keywords: [
      "netflix.com", "primevideo", "disneyplus", "hbomax", "hulu.com",
      "spotify.com", "soundcloud", "music.apple", "deezer",
      "imdb.com", "rottentomatoes", "metacritic",
      "store.steampowered", "epicgames", "gog.com",
      "9gag.com", "imgur.com", "reddit.com/r/funny",
      "twitch.tv", "dailymotion", "vimeo.com",
      "kinopoisk.ru", "ivi.ru", "okko.tv", "premier.ru",
      "wink.rt.ru", "start.ru", "more.tv"
    ],
    color: "pink"
  }
};

/**
 * Категория по умолчанию для неопознанных вкладок.
 */
const DEFAULT_CATEGORY_NAME = "Прочее";

/**
 * Текущий активный словарь категорий.
 * При запуске загружается из storage, если пользователь ничего не менял — используется DEFAULT.
 */
let activeCategories = JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));

/**
 * Загружает пользовательские категории из browser.storage.local.
 * Если сохранённых данных нет — использует DEFAULT_CATEGORIES.
 * Если пользователь удалил все категории — создаёт пустой словарь.
 *
 * @returns {Promise<Object>} — текущий словарь категорий
 */
async function loadCategoriesFromStorage() {
  try {
    const result = await browser.storage.local.get(["categories", "useCustom"]);

    if (result.useCustom && result.categories) {
      activeCategories = result.categories;
    } else {
      activeCategories = JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
    }
  } catch (err) {
    console.error("[TabTopic] Ошибка загрузки категорий из storage:", err);
    activeCategories = JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
  }

  return activeCategories;
}

/**
 * Сохраняет пользовательские категории в browser.storage.local.
 *
 * @param {Object} categories — словарь категорий для сохранения
 * @returns {Promise<void>}
 */
async function saveCategoriesToStorage(categories) {
  try {
    await browser.storage.local.set({
      categories: categories,
      useCustom: true
    });
    activeCategories = categories;
  } catch (err) {
    console.error("[TabTopic] Ошибка сохранения категорий в storage:", err);
  }
}

/**
 * Сбрасывает категории на значения по умолчанию.
 *
 * @returns {Promise<void>}
 */
async function resetCategoriesToDefault() {
  try {
    await browser.storage.local.remove(["categories", "useCustom"]);
    activeCategories = JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
  } catch (err) {
    console.error("[TabTopic] Ошибка сброса категорий:", err);
  }
}

/**
 * Возвращает текущий активный словарь категорий.
 *
 * @returns {Object} — копия текущего словаря категорий
 */
function getActiveCategories() {
  return JSON.parse(JSON.stringify(activeCategories));
}

/**
 * Возвращает категории по умолчанию.
 *
 * @returns {Object} — копия словаря по умолчанию
 */
function getDefaultCategories() {
  return JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
}

/**
 * Определяет тематическую категорию вкладки на основе заголовка и URL.
 * Использует текущий активный словарь категорий.
 *
 * @param {browser.tabs.Tab} tab — объект вкладки из API browser.tabs
 * @returns {{ name: string, color: string }} — название и цвет категории
 */
function categorizeTab(tab) {
  const title = (tab.title || "").toLowerCase();
  const url = (tab.url || "").toLowerCase();
  const text = `${title} ${url}`;

  // Перебираем все активные категории
  for (const [categoryName, categoryData] of Object.entries(activeCategories)) {
    for (const keyword of categoryData.keywords) {
      if (text.includes(keyword.toLowerCase())) {
        return { name: categoryName, color: categoryData.color };
      }
    }
  }

  // Если совпадений не найдено — категория по умолчанию
  return { name: DEFAULT_CATEGORY_NAME, color: "grey" };
}
