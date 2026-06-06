# TabTopic Organizer — Beta 0.4

Расширение для Mozilla Firefox, которое автоматически анализирует открытые вкладки и группирует их по тематике.

## Возможности

- Анализ заголовков и URL всех вкладок в текущем окне
- Автоматическая категоризация по 7 темам + «Прочее»
- Визуальная группировка вкладок через нативный API `browser.tabs.group`
- Цветовое кодирование категорий (9 цветов)
- Кнопка «Разгруппировать все» для сброса
- Автогруппировка новых вкладок (опционально)
- Пользовательское редактирование категорий
- Создание собственных категорий
- Сохранение настроек в `browser.storage.local`
- Переключатель темы (светлая / тёмная / авто)
- Встроенные SVG-иконки

## Установка

1. Откройте Firefox 128+.
2. Перейдите по адресу `about:debugging#/runtime/this-firefox`.
3. Нажмите **«Загрузить временный адд-on...»**.
4. Выберите файл `manifest.json` из папки проекта.

## Структура проекта

```
├── manifest.json      — Манифест Manifest V3 (v0.4.0)
├── background.js      — Service Worker: группировка, storage, автогруппировка
├── utils.js           — Словарь категорий и функция categorizeTab()
├── popup.html         — Интерфейс попапа
├── popup.css          — Стили: 3 темы (light/dark/auto)
├── popup.js           — Логика: редактирование, storage, тема
├── icons/             — SVG-иконки (градиент)
│   ├── icon-16.svg
│   ├── icon-32.svg
│   ├── icon-48.svg
│   └── icon-96.svg
├── README.md          — Этот файл
├── Privacy Policy.md  — Политика конфиденциальности
└── Update.md          — История релизов
```

## Требования

- Mozilla Firefox 128 или новее
- API `browser.tabs.group` должен быть доступен

## Категории

| Категория       | Цвет      | Примеры сайтов                                |
|-----------------|-----------|-----------------------------------------------|
| Разработка      | Синий     | GitHub, StackOverflow, MDN, Habr              |
| Новости         | Красный   | BBC, CNN, РБК, The Verge                      |
| Соцсети         | Фиолетовый| YouTube, Twitter/X, Reddit, Telegram, VK      |
| Покупки         | Оранжевый | Amazon, Ozon, Wildberries, eBay               |
| Работа и Офис   | Жёлтый    | Google Docs, Notion, Trello, Figma            |
| Обучение        | Бирюзовый | Coursera, Udemy, LeetCode, Wikipedia          |
| Развлечения     | Розовый   | Netflix, Spotify, Steam, Кинопоиск            |
| Прочее          | Серый     | Все остальные сайты                           |

## Лицензия

MIT License# TabTopic Organizer — Beta 0.3

An extension for Mozilla Firefox that automatically analyzes open tabs and groups them by topic.

## Features

- Analysis of the titles and URLs of all tabs in the current window
- Automatic categorization by 7 topics + "Other"
- Visual grouping of tabs via the native API `browser.tabs.group`
- Color coding of categories (9 colors)
- The "Ungroup all" button to reset
- Auto-grouping of new tabs (optional)
- Custom category editing directly in the popup
- Create your own categories
- Saving settings in `browser.storage.local`
- The "About extension" tab with a dynamic status:
- API grouping status (available/unavailable)
- Auto grouping status (enabled/disabled)
- Number of downloaded categories (updated in real time)
- Checking the availability of `browser.storage.local`
- Support for light and dark themes
- Embedded SVG icons

## Installation (temporary)

1. Open Firefox 128+.
2. Go to `about:debugging#/runtime/this-firefox'.
3. Click **"Download temporary add-on..."**.
4. Select the `manifest' file.json` from the project folder.
5. The extension is ready to work.

## Project structure

```
├── manifest.json Manifest V3
├── background.js — Service Worker: grouping, storage, auto-grouping
├── utils.js Dictionary of Categories and the categorizeTab() function
. popup.html — The pop-up interface
,── popup.css interface styles
├── popup.popup js logic: editing, storage, status
├── icons/             — SVG icons of the extension
│ ├── icon-16.svg
│ ├──icon-32.svg
│ ├── icon-48.svg
│ └── icon-96.svg
├── README.md — This file
,── Description.md — Description for GitHub
├── Update.md — Release history
,── privacy-policy.md — Privacy Policy
``

## Requirements

- Mozilla Firefox 128 or later
- The `browser.tabs.group` API should be available

## Categories

| Category | Color | Site Examples |
|-------------------|-----------|---------------------------------------------------|
| Development | Blue | GitHub, StackOverflow, MDN, Habr |
| News | Krasny | BBC, CNN, RBC, TASS, The Verge |
| Social networks | Purple| YouTube, Twitter/X, Reddit, Telegram, VK |
| Shopping | Orange | Amazon, Ozon, Wildberries, eBay |
| Work and Office | Yellow | Google Docs, Notion, Trello, Figma, Jira |
| Learning | Turquoise | Coursera, Udemy, LeetCode, Wikipedia |
| Entertainment | Pink | Netflix, Spotify, Steam, Kinopoisk, ivi |
| Other | Gray | All other sites |

## Known limitations (Beta 0.3)

- The extension works as a temporary add-on (it is deleted when Firefox is restarted).
- The icons are SVG, some older versions of Firefox may not support them.
- Auto-grouping only works for new tabs, not for already opened ones.

## License

MIT License
