# Inti

> **Inti** (Bahasa Indonesia: *core, essence*) — a browser extension that summarizes any article using AI.

Works on Chrome, Firefox, and Firefox Android. Requires a self-hosted API — see [inti-api](https://github.com/your-org/inti-api) to set one up.

---

## Install

Download the latest release for your browser from the [Releases](../../releases) page, then follow the steps for your browser below.

### Chrome

1. Go to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** → select the `chrome/` folder from the release zip

### Firefox Desktop

1. Go to `about:debugging` → **This Firefox**
2. Click **Load Temporary Add-on**
3. Select `manifest.json` from the `firefox-desktop/` folder

### Firefox Android

1. Install [Firefox for Android](https://www.mozilla.org/firefox/android/)
2. Go to **Settings → About Firefox** and tap the version number 5 times to enable debug mode
3. On your desktop, go to `about:debugging` → **Setup** and connect your device via USB
4. Once connected, select your device and click **Load Temporary Add-on**
5. Select `manifest.json` from the `firefox-android/` folder

---

## Setup

### 1. Deploy the API

Set up your own instance of [inti-api](https://github.com/your-org/inti-api) and note the base URL of your server. The extension sends requests to `<base-url>/api/summarize`.

### 2. Configure the extension

After installing Inti, open its settings and enter your API URL.

- On the full Options page, you can set the API URL, optional summarization instruction, and theme.
- In the popup/sidebar settings panel, you can set the API URL, optional `X-API-Key` header value, and theme.
- The popup/sidebar settings panel uses one shared save button for the API URL and API key. The button is disabled until one of those values changes.

Inti stores these settings in extension storage (`chrome.storage.local` / `browser.storage.local`), not in page `localStorage`.

---

## How it works

Click the Inti icon on any article page and hit **Summarize Article**. Inti extracts the article text, sends it to your API, and shows the summary:

- **Chrome** — in the side panel
- **Firefox desktop** — in the sidebar
- **Firefox Android** — as an overlay on the page

The last summary and your settings are saved locally in the browser's extension storage and restored the next time you open the extension.

When `settings.apiKey` is configured, Inti sends it as the `X-API-Key` header on summarization requests.

On Firefox desktop, you can inspect this data in `about:debugging` by opening the extension toolbox and checking the `Storage` tab under `Extension Storage`.

---

## Keyboard Shortcuts

- **Alt + Shift + S** (Mac: **Cmd + Shift + S**): Summarize the current page.
- **Ctrl + Shift + Y** (Mac: **Cmd + Shift + Y**): Toggle the sidebar (Firefox Desktop only).

---

## Contributing

See [docs/contributing.md](docs/contributing.md) for the development setup, build commands, and project architecture.
