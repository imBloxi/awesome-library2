# Always Visible for Firefox

Requires Firefox 140 or newer. This is a temporary, unsigned development add-on.

## Load it

1. Open `about:debugging#/runtime/this-firefox` in Firefox.
2. Click **Load Temporary Add-on…** and select this folder's `manifest.json` (or the supplied ZIP).
3. Allow access to Datorium if Firefox asks, then reload the Datorium or Signal Lab tab. Existing pages must be reloaded.
4. The add-on runs automatically on Datorium HTTPS pages and `/extension-test/` pages on localhost or 127.0.0.1. It does not run on other websites.

Firefox removes temporary add-ons when it restarts. To disable it, click **Remove** in `about:debugging` and reload affected pages. Removing it alone does not undo changes to already loaded documents.

## Compare in Signal Lab

From the repository directory run:

```powershell
node scripts/serve-extension-test.cjs
```

Open `http://127.0.0.1:3003/extension-test/index.html` in **Firefox**, not the Codex preview browser. Run and export a tab-switch test without the add-on. Load the add-on, reload the test page, label the new session, and repeat.

With the add-on active, the page's `document.hidden` reads `false`, `document.visibilityState` reads `visible`, and `document.hasFocus()` reads `true`. It also suppresses subsequent window/document visibility-change and focus-loss event handlers. Focus changes between inputs are preserved.

## Limits

This changes what page JavaScript sees. It does not change actual browser focus, background timer scheduling, CSS focus selectors, or animation scheduling. It does not generate keyboard/mouse activity or trusted input. Other scripts can detect or overwrite the modified property descriptors. Unmatched frames and other execution contexts are outside its scope.

Datorium's real checks have not been verified. This add-on is not a guarantee against being flagged. No browsing data is collected, stored, or transmitted by the add-on.

References: [Firefox content scripts](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/content_scripts), [temporary installation](https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/).
