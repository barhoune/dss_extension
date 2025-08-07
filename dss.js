chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "savePanelSettings",
        title: "CMS: Save Current Panel Settings",
        contexts: ["all"]
    });

    chrome.contextMenus.create({
        id: "loadPanelSettings",
        title: "CMS: Load Panel Settings from JSON",
        contexts: ["all"]
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "savePanelSettings") {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                const collectAllPanels = () => {
                    const container = document.querySelector(
                        '#options > div.control-group.mod-content-panels.mod-sort.session-no-cache > div.assigned.span6 > div.sortable > ol'
                    );
                    if (!container) return [];

                    const items = container.querySelectorAll('li[data-panel-id]');
                    return Array.from(items).map(item => {
                        const panelId = item.getAttribute('data-panel-id') || 'unknown';
                        const inputs = {};
                        item.querySelectorAll('.panel-input').forEach(el => {
                            const name = el.getAttribute('data-panel-name') || el.name || el.id;
                            if (!name) return;
                            if (
                                el.tagName === 'SELECT' ||
                                el.tagName === 'TEXTAREA' ||
                                (el.tagName === 'INPUT' && el.type !== 'checkbox' && el.type !== 'radio')
                            ) {
                                inputs[name] = el.value;
                            } else if (el.type === 'checkbox' || el.type === 'radio') {
                                inputs[name] = el.checked;
                            }
                        });
                        return { panelId, inputs };
                    });
                };

                const data = collectAllPanels();
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'panel-settings.json';
                a.click();
                URL.revokeObjectURL(url);
            }
        });
    }

    if (info.menuItemId === "loadPanelSettings") {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'application/json';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);
        fileInput.click();

        fileInput.addEventListener('change', async () => {
            const file = fileInput.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (e) => {
                let data;
                try {
                    data = JSON.parse(e.target.result);
                } catch (err) {
                    alert('Invalid JSON file.');
                    return;
                }

                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    args: [data],
                    func: (data) => {
                        const container = document.querySelector(
                            '#options > div.control-group.mod-content-panels.mod-sort.session-no-cache > div.assigned.span6 > div.sortable > ol'
                        );
                        if (!container) return;

                        data.forEach(entry => {
                            const item = container.querySelector(`li[data-panel-id="${entry.panelId}"]`);
                            if (!item) return;

                            Object.entries(entry.inputs).forEach(([name, val]) => {
                                const el = item.querySelector(`[data-panel-name="${name}"]`);
                                if (!el) return;

                                if (
                                    el.tagName === 'SELECT' ||
                                    el.tagName === 'TEXTAREA' ||
                                    (el.tagName === 'INPUT' && el.type !== 'checkbox' && el.type !== 'radio')
                                ) {
                                    el.value = val;
                                } else if (el.type === 'checkbox' || el.type === 'radio') {
                                    el.checked = !!val;
                                }
                            });
                        });
                    }
                });
            };

            reader.readAsText(file);
        });
    }

});
