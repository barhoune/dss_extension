## Description

This browser extension allows developers working with DSS to save and restore assigned panel settings on any page. It acts as a lightweight backup mechanism , particularly useful when dealing with pages that contain a high number of panels (10+).

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
        Drag and drop the `.crx` file found under the `releases`.
        
4. In the extension settings:
    
    - Pin the extension for quick access.
        
    - Allow it in incognito mode if needed.
        

---

## Usage

1. In DSS, select a project and then a page you'd like to back up or work on.
    
2. After making changes, you can export panel configurations as:
    
    - **JSON** (recommended and most reliable)
        
    - **CSV** (experimental)
        
3. Keep backups organized by project ID or Name for easier imports.
    

---

## What's New

- Panel metadata now includes:
    
    - Page Name
        
    - Server
        
    - Project Name
        
    - Project ID
        
- Switched from cookie-based extraction to metadata parsing
    
    - This paves the way for:
        
        - Environment-based conditions (e.g. prevent saving from `test` to `prod`)
            
        - Page-level checks to avoid overwriting the wrong panel set
            

---

## Proposed Features

These features are being considered. If you're part of the team using this extension, let us know which ones you'd find useful:
    
- [ ] **Import and export to csv**    
- [ ] **Centralized LocalStorage persistence**

---

## Notes

- This tool is intended for internal developer use.
        
- Regular updates and improvements will follow based on team feedback.
