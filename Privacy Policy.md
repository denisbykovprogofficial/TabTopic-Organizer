# Privacy Policy

**Extension:** TabTopic Organizer
**Version:** Beta 0.6
**Updated:** June 5, 2026

---

## 1. Data Collection

This extension **does not collect, store, or transmit** any data to third parties.

## 2. Local Operation

All operations run locally on your device:

- Analyzing titles and URLs of open tabs
- Grouping tabs via the browser's native API
- Saving sessions and categories in `browser.storage.local`
- Context menu and keyboard shortcut actions

## 3. Network Requests

This extension **makes no network requests**. Internet access is not required.

## 4. Storage

`browser.storage.local` stores only:

- Custom categories (names, keywords, colors)
- Auto-grouping toggle (on/off)
- Selected UI theme (light/dark/auto)
- Whitelist and blacklist URLs
- Saved sessions (tab URLs, titles, group info)

Data never leaves the browser.

## 5. Tab Access

The `tabs` permission is used for:

- Querying tabs in the current window
- Grouping/ungrouping tabs
- Searching and closing tabs
- Detecting duplicate tabs

Tab data is used only during operations and is not persisted externally.

## 6. Context Menu

A context menu item "Add to TabTopic category" is added to tab context menus. This groups the selected tab based on its content — no data is transmitted.

## 7. Keyboard Shortcuts

Shortcuts (`Alt+Shift+G/U/Z`) trigger local grouping actions. No data leaves the browser.

## 8. Contact

For privacy questions, open an issue in the project repository.
