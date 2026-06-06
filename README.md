# TabTopic Organizer — Beta 0.6

Расширение для Mozilla Firefox, которое автоматически анализирует открытые вкладки и группирует их по тематике.

## Возможности

- Автоматическая категоризация по 7 темам + «Прочее»
- Визуальная группировка через `browser.tabs.group`
- Автогруппировка новых вкладок
- Пользовательское редактирование и создание категорий
- Сохранение настроек в `browser.storage.local`
- Переключатель темы (светлая / тёмная / авто)
- Счётчик открытых вкладок в реальном времени

## Установка

1. Firefox 128+
2. `about:debugging#/runtime/this-firefox`
3. «Загрузить временный адд-on...» → `manifest.json`

## Структура

```
├── manifest.json    v0.6.0
├── background.js    Service Worker
├── utils.js         Категоризация
├── popup.html       Интерфейс
├── popup.css        Стили (light/dark)
├── popup.js         Логика popup
├── icons/           SVG-иконки
├── README.md
├── Privacy Policy.md
└── Update.md
```

## Лицензия

MIT License
