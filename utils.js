/**
 * utils.js — Модуль утилит и словарей для категоризации вкладок.
 *
 * Содержит предопределённый словарь ключевых слов, сопоставленных
 * с тематическими категориями, а также функцию categorizeTab(),
 * которая определяет категорию вкладки по её title и url.
 */

"use strict";

/**
 * Объект-словарь: ключ — название категории,
 * значение — объект с полем keywords (массив строк) и color (цвет TabGroup).
 *
 * Цвета соответствуют допустимым значениям API browser.tabs.group:
 * "blue", "red", "yellow", "green", "pink", "purple", "cyan", "orange", "grey"
 */
const CATEGORY_DICT = {
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
 * Категория по умолчанию, если ни одно ключевое слово не совпало.
 */
const DEFAULT_CATEGORY = "Прочее";

/**
 * Определяет тематическую категорию вкладки на основе заголовка и URL.
 *
 * @param {browser.tabs.Tab} tab — объект вкладки из API browser.tabs
 * @returns {{ name: string, color: string }} — название и цвет категории
 */
function categorizeTab(tab) {
  // Объединяем title и url в одну строку для поиска, приводя к нижнему регистру
  const title = (tab.title || "").toLowerCase();
  const url = (tab.url || "").toLowerCase();
  const text = `${title} ${url}`;

  // Перебираем все категории словаря
  for (const [categoryName, categoryData] of Object.entries(CATEGORY_DICT)) {
    for (const keyword of categoryData.keywords) {
      if (text.includes(keyword.toLowerCase())) {
        return { name: categoryName, color: categoryData.color };
      }
    }
  }

  // Если совпадений не найдено — возвращаем категорию по умолчанию
  return { name: DEFAULT_CATEGORY, color: "grey" };
}
