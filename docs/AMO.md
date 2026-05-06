# AMO Listing Copy

Firefox desktop and Firefox Android are two build artifacts for the same AMO add-on. Keep the same `browser_specific_settings.gecko.id` across both packages unless you intentionally want two separate AMO listings.

## Summary

Summarize article pages with your Inti API in Firefox desktop and Firefox for Android.

## Details

Inti helps you summarize the article you are reading without leaving the page.

The extension extracts the main article content from the current tab, sends it to your configured Inti summarization API, and displays the result in a Firefox-native UI:

- Firefox desktop: sidebar
- Firefox for Android: page overlay

You can start a summary from the toolbar button, the context menu, or the sidebar. Saved settings and the last summary are restored when you open the extension again.

Features:

- Summarize the current article page with one click
- Firefox desktop sidebar workflow
- Firefox Android overlay workflow
- Optional API key support for protected Inti servers
- Local theme and settings saved in extension storage
- Keyboard shortcuts for quick access on desktop

Setup:

1. Run your Inti server or use a hosted Inti endpoint.
2. Open the extension settings.
3. Enter your API URL.
4. If your server requires authentication, enter your API key.
5. Open an article and choose Summarize.

Notes:

- Inti is a companion extension for the Inti server and requires a working Inti summarization endpoint.
- The extension processes the current page's article content to generate summaries.
- Settings and the last summary are stored in browser extension storage, not page localStorage.

## Reviewer Notes

The extension does not call Gemini, Groq, or OpenRouter directly from the browser.

All summarization requests are sent to a user-configured, self-hosted Inti server written in Go. That server handles the upstream AI integration and may use providers such as Gemini, Groq, or OpenRouter to generate the summary.

The extension's role is limited to:

- extracting the current article's readable content
- sending that content to the configured Inti API endpoint
- rendering the returned summary in the Firefox UI

Reviewer context:

- the API endpoint is user-configurable in the extension settings
- an optional API key can be supplied for protected Inti servers
- provider credentials are managed on the server side, not inside the extension
