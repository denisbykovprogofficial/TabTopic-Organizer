# TabTopic Organizer — Beta 0.5

Firefox extension that automatically analyzes open tabs and groups them by topic.

## Features

- Auto-categorization into 7 themes + "Other"
- Visual grouping via `browser.tabs.group`
- Auto-grouping of new tabs
- Custom category editing and creation
- Settings saved in `browser.storage.local`
- Theme switcher (light / dark / auto)
- Live tab counter

## Installation

1. Firefox 128+
2. `about:debugging#/runtime/this-firefox`
3. "Load Temporary Add-on..." → `manifest.json`

## Structure

```
├── manifest.json    v0.5.0
├── background.js    Service Worker
├── utils.js         Categorization
├── popup.html       Interface
├── popup.css        Styles (light/dark)
├── popup.js         Popup logic
├── icons/           SVG icons
├── README.md
├── Privacy Policy.md
└── Update.md
```

## License

MIT License
