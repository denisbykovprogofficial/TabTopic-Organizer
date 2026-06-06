# TabTopic Organizer — Beta version 0.4

An update for Mozilla Firefox that automatically analyzes hidden tabs and groups them by topic.

## Features

- Multiple titles and URLs are nearby all the time
- Automatic categorization by 7 topics + "Other"
- Visual grouping with an interface via the national API browser.tabs.the group`
- Color coding of categories (9 colors)
- The "Ungroup all" button to reset
- Auto-grouping of new tabs (optional)
- Custom category editing
- Create your own categories
- Saving settings in "browser.storage.local`
- Theme switch (light/ dark/ auto)
- Embedded SVG icons

## Installation

1. Open Firefox 128+.
2. Click on the link "about the program:debugging#/runtime/this-firefox".
3. Click **"Download temporary add-on..."**.
4. Select the manifest file.json from the project folder.

## Project structure

```
├── manifest.JSON application Manifest V3 (version 0.4.0)
├── background information.JS — Service specialist: assembly, storage, auto-
preparation.── utilities.js Dictionary of categories in the "Categorization" section()
,── popup.html — Online store
├── popup.css Pages: 3 themes (light/dark/auto)
├── popup.js Logic: editing, storage, theme
├── icons/ — SVG icons (hailstones)
│ ├── icons-16.svg
│ ├──icons-32.svg
│ ├──icons-48.svg
icon-96│ └──.SVG
├── in the README file.MD — This file
, The Privacy Policy.MD — Privacy Policy
,── Update.md — Relationship history
```

## Requirements

- Mozilla Firefox 128 or newer
- API `browser.tabs.The `group' should be unavailable

## Categories

| Category | Color | Site Examples |
|-----------------|-----------|-----------------------------------------------|
| Development | Syn | GitHub, StackOverflow, MDN, Habr |
| News | Red | BBC, CNN, RBK, The Verge |
| Social networks | News| YouTube, Twitter/X, Reddit, Telegram, VKONTAKTE |
| Purchases | Foreign | Amazon, Ozon, Wildberries, eBay |
| Work and Communication | Full | Google Docs, Notion, Trello, Figma |
| Training | Exchange | Coursera, Udemy, LeetCode, Wikipedia |
| Entertainment | New | Netflix, Spotify, Steam, Kinopoisk |
| Other | Gray | All other sites |

## License

MIT License# TabTopic Organizer — Beta version 0.3

An extension for Mozilla Firefox that automatically analyzes open tabs and groups them by topic.

## Functions

- Analysis of the names and URLs of all tabs in the current window
- Automatic categorization by 7 topics + "Others".
- Visual grouping of tabs using the built-in API "browser.tabs.group"
- Color coding of categories (9 colors)
- The "Ungroup all" button to reset the settings.
- Automatic grouping of new tabs (optional)
- Edit custom categories directly in the pop-up window
- Create your own categories
- Saving settings in `browser.storage.local`
- The "About extension" tab with a dynamic status:
- API grouping status (available/unavailable)
- Automatic grouping status (enabled/disabled)
- The number of uploaded categories (updated in real time)
- Checking the availability of `browser.storage.local`
- Support for light and dark themes
- Embedded SVG icons

## Installation (temporary)

1. Open Firefox 128+.
2. Go to the About the program section:debugging#/runtime/this-firefox".
3. Press **"Download a temporary add-on..."**.
4. Select the manifest file.json from the project folder.
5. The extension is ready to work.

## Project structure

``
├── manifesto.json Manifest V3
├── background.js — Service worker: grouping, storage, auto-grouping
,── utils.js The dictionary of categories and the categorizeTab() function
. popup.html — Popup interface
,── popup interface styles.css
├── popup.pop-up logic in js: editing, storage, status
├── icons/ — SVG icons of the extension
│ ├── icon-16.svg
│ ├──icon-32.svg
│ ├── icon-48.svg
│ └──icon-96.svg
├── README.md — This file
,── Description.md — Description for GitHub
├── Update.md — Release history
,--privacy-policy.md — Privacy Policy
`

## Requirements

- Mozilla Firefox 128 or later
- The `browser.tabs.group` API must be available

## Categories

| Category | Color | Site Examples |
|-------------------|-----------|---------------------------------------------------|
| Development | Blue | GitHub, StackOverflow, MDN, Habr |
| News | Krasny | BBC, CNN, RBC, TASS, The Verge |
| Social networks / Purple| YouTube, Twitter/X, Reddit, Telegram, VKONTAKTE |
| Shopping | Orange | Amazon, Ozon, Wildberries, eBay |
| Work and Office | Yellow | Google Docs, Notion, Trello, Figma, Jira |
| Learning / Turquoise | Coursera, Udemy, LeetCode, Wikipedia |
| Entertainment | Pink | Netflix, Spotify, Steam, Kinopoisk, ivi |
| Other | Grey | All other sites |

## Known limitations (beta version 0.3)

- The extension works as a temporary add-on (it is deleted when Firefox is restarted).
- The icons are presented in SVG format, some older versions of Firefox may not support them.
- Automatic grouping only works for new tabs, not for those that are already open.

## License

MIT License
