function collectAllPanels() {
    const container = document.querySelector(
        '#options > div.control-group.mod-content-panels.mod-sort.session-no-cache > div.assigned.span6 > div.sortable > ol'
    );

    if (!container) return [];

    const items = container.querySelectorAll('li[data-panel-id]');
    return Array.from(items).map(item => {
        const panelId = item.getAttribute('data-panel-id') || 'unknown-richText';
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
}

function loadAllPanels(dataArray) {
    const container = document.querySelector(
        '#options > div.control-group.mod-content-panels.mod-sort.session-no-cache > div.assigned.span6 > div.sortable > ol'
    );
    if (!container) return;

    dataArray.forEach(entry => {
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
                el.dispatchEvent(new Event('change', { bubbles: true }));
            } else if (el.type === 'checkbox' || el.type === 'radio') {
                el.checked = !!val;
                el.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
    });
}
function getProjectIdFromPage() {
    const projectId = document.cookie
        .split('; ')
        .find(c => c.startsWith('PROJECTID='))
        ?.split('=')[1] || '';
    return projectId;
}

function parsePageMeta() {
    const iterator = document.createNodeIterator(document, NodeFilter.SHOW_COMMENT, null, false);
    let commentNode;
    while ((commentNode = iterator.nextNode())) {
        const text = commentNode.nodeValue.trim();
        if (text.includes('User Name:')) {
            const meta = {};
            text.split('\n').forEach(line => {
                const [key, ...rest] = line.split(':');
                if (key && rest.length) {
                    meta[key.trim()] = rest.join(':').trim();
                }
            });
            return meta;
        }
    }
    return null;
}

function downloadJSON(data, projectId = '', meta = null) {
    const pid = (meta?.['Project ID'] || projectId) || 'NOPROJECT';
    const projectMetaName = meta.Project ?? 'NOPROJECTNAME';
    const PageID = meta.Page ?? 'NOPAGE';
    const projectName = projectMetaName.replace(/[^\w\d-]/g, '_');
    const serverName = meta.Server ?? 'NOSERVER';
    const now = new Date();
    const timestamp = now
        .toISOString()
        .replace(/[:]/g, '-')
        .split('.')[0];

    const filename = `SERVER_${serverName}--PROJECT_${projectName}--PID_${pid}--PAGE_${PageID}--DATE_${timestamp}--settings.json`;

    const payload = { meta, panels: data };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}



document.addEventListener('DOMContentLoaded', () => {
    const saveBtn = document.getElementById('save-json');
    const loadBtn = document.getElementById('load-json');

    saveBtn.addEventListener('click', async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        chrome.scripting.executeScript({ target: { tabId: tab.id }, func: getProjectIdFromPage },
            (projectRes) => {
                const projectId = projectRes?.[0]?.result || '';
                chrome.scripting.executeScript({ target: { tabId: tab.id }, func: parsePageMeta },
                    (metaRes) => {
                        const meta = metaRes?.[0]?.result || null;
                        chrome.scripting.executeScript({ target: { tabId: tab.id }, func: collectAllPanels },
                            (panelsRes) => {
                                const panels = panelsRes?.[0]?.result || [];
                                downloadJSON(panels, projectId, meta);
                            });
                    });
            });
    });


    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'application/json';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    loadBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', async () => {
        const file = fileInput.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
            let data;
            try {
                data = JSON.parse(e.target.result);
            } catch (err) {
                alert('Invalid JSON');
                return;
            }

            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: loadAllPanels,
                args: [data],
            });
        };

        reader.readAsText(file);
    });
});
