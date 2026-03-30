# 🗑️ YouTube History Bulk Deleter

A lightweight, Manifest V3 Chrome Extension that injects a clean UI into the YouTube History page, allowing users to select multiple videos and delete them in bulk. 

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Manifest](https://img.shields.io/badge/Manifest-V3-success.svg)

## ✨ Features

* **Seamless UI Injection:** Injects absolute-positioned checkboxes over video thumbnails without breaking YouTube's native Flexbox layout.
* **Universal Support:** Works seamlessly across standard video rows, YouTube Shorts (`ytd-reel-item-renderer`), and YouTube's newest architecture (`yt-lockup-view-model`).
* **Infinite Scroll Ready:** Utilizes a `MutationObserver` to automatically attach checkboxes to new videos as you scroll down the page.
* **Anti-Rate Limiting:** Implements artificial asynchronous delays (`sleep` functions) to navigate dynamic popup menus safely without triggering YouTube's bot-protection/rate-limiting filters.
* **SPA Compatible:** Hooks into YouTube's custom `yt-navigate-finish` events to load and unload perfectly within its Single Page Application environment.

## 🚀 Installation (Developer Mode)

Since this extension is not currently on the Chrome Web Store, you can install it locally:

1. Clone or download this repository to your local machine.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Toggle on **Developer mode** in the top right corner.
4. Click the **Load unpacked** button in the top left.
5. Select the folder containing this extension (`manifest.json` should be in the root of the folder you select).

## 💡 How to Use

1. Navigate to your [YouTube History Page](https://www.youtube.com/feed/history).
2. You will see a new checkbox on the top-left corner of every video thumbnail.
3. Check the boxes for the videos you want to remove.
4. Click the floating red **"🗑️ Delete Selected"** button in the bottom right corner of your screen.
5. Sit back and watch the extension navigate the menus and clean up your history!

## 🛠️ Technical Architecture

This extension relies heavily on DOM manipulation and Web Scraping. 
* **`manifest.json`**: Configured as a Manifest V3 extension, requesting only `activeTab` permissions to keep it secure and privacy-focused.
* **`content.js`**: The core logic. It uses a two-step algorithmic clicker to first open the hidden action menus, wait for YouTube's engine to render the `ytd-popup-container` to the DOM, and then target the removal string.

## ⚠️ Disclaimer & Known Issues

Because this extension interacts directly with YouTube's DOM, it is subject to break if YouTube pushes a major UI update. 
* The extension specifically looks for `ytd-video-renderer`, `ytd-reel-item-renderer`, and `yt-lockup-view-model`.
* If the extension stops working, YouTube has likely changed its internal CSS class names or `aria-label` tags. 

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).