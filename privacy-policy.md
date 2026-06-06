# Privacy Policy

**Extension:** TabTopic Organizer
**Version:** Beta 0.4
**Last update:** June 5, 2026

---

##1. Data collection

The extension ** does not collect, store, or transfer ** any data to third parties.

## 2. How the extension works

TabTopic Organizer works **exclusively locally** in your browser. Expansion:

- Reads the titles and URLs of open tabs **only of the current window**.
- Analyzes them for keywords to determine the topic.
- Uses the native browser API to create visual tab groups.

All operations are performed on your device. No data leaves the browser.

##3. Data Warehouse

The extension uses `browser.storage.local` for storage:

- Custom categories (names, keywords, colors)
- Auto-grouping settings (on/off)
- Selected interface theme (light/dark/auto)

This data is stored **only locally** on your device and is not transmitted to the network.

## 4. Network requests

The extension **does not send** any network requests. Internet access is not required.

##5. Access to tabs

The extension requests the `tabs` permission for:

- Getting a list of tabs in the current window ('browser.tabs.query').
- Tab groupings ('browser.tabs.group').

The tab data is used **only during the operation** and is not saved.

##6. Third-party Suppliers

The extension **does not integrate** with any third-party services, API or SDK.

## 7. Details for children

The extension is not intended for children under the age of 13 and does not collect data on minors.

##8. Contacts

For privacy issues, create an issue in the project repository.
