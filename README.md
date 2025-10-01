## Description

This browser extension allows developers working with DSS to save and restore assigned panel settings on any page. It acts as a lightweight backup mechanism, particularly useful when dealing with pages that contain a high number of panels (10+).

This new version `(1.0.2)` also supports **environment switching**, allowing users to quickly navigate between **LIVE**, **TEST**, and **FEDEV** environments directly from the popup or context menu.

---

## Requirements

- Chrome or any Chromium-based browser with [Manifest V3](https://developer.chrome.com/docs/extensions/mv3/intro/) support.
---

## Installation

1. Navigate to `chrome://extensions/`
2. Enable **Developer mode**
3. Choose one of the following:

   - **Load unpacked**:  
      For development or debugging, load the root folder of the extension.
   - **Install via `.crx`**:  
      Drag and drop the `.crx` file found under [**releases**](https://github.com/barhoune/dss_extension/releases).  
      > **Important:** Keep the accompanying `.pem` file safe. It is used to generate future `.crx` updates with the same extension ID.

4. In the extension settings:

   - Pin the extension for quick access.
   - Allow it in incognito mode if needed.

---

## Usage

#### <u>Panel Management</u>

1. In DSS, select a project and then a page you'd like to back up or work on.
2. After making changes, you can export panel configurations as:

   - **JSON** (recommended and most reliable)
   - **CSV** (experimental)

3. Keep backups organized by project ID or Name for easier imports.
4. To import previously saved configurations, use the **Import** tab.

#### <u>Environment Switching</u>

1. Open the FWM page you are working on.
2. In the extension popup, select the desired environment tab (**LIVE**, **TEST**, or **FEDEV**) and click the corresponding button.
3. Alternatively, right-click on the page to use the **context menu** for quick environment switching.
4. While redirecting, the button will show **“Redirecting…”** and restore the original text once the page has loaded.

---

## What's New

### Version 1.0.2

**Added**

- **Tabbed popup UI**: Export and Import functionality now separated into tabs for cleaner panel management.
- **Environment switching**: Users can now switch between LIVE, TEST, and FEDEV environments directly from the popup.
- **Context menu for environment switching**: Right-click menus added to quickly redirect the current tab to the desired environment.

**Removed**

- **Context menu for CMS management**: Previous CMS management menu items have been removed to reduce clutter and focus on environment switching.

**Updated**

- Minor UI adjustments for the popup to accommodate the new tab layout.
- Button feedback added: popup buttons show **“Redirecting…”** while the tab navigates, restoring original text when complete.

---

- Panel metadata now includes:

  - Page Name
  - Server
  - Project Name
  - Project ID

- Switched from cookie-based extraction to metadata parsing, paving the way for:

  - Environment-based conditions (e.g., prevent saving from `test` to `prod`)
  - Page-level checks to avoid overwriting the wrong panel set

---

## Proposed Features

These features are being considered. If you're part of the team using this extension, let us know which ones you'd find useful:

- [x] **Export to CSV**
- [ ] **Import from CSV**
- [ ] **Centralized LocalStorage persistence (discarded)**

---

## Notes

- This tool is intended for internal FWM developers and PMs use.
- Regular updates and improvements will follow based on team feedback.
