function collectAllPanels() {
    const container = document.querySelector(
        '#options > div.control-group.mod-content-panels.mod-sort.session-no-cache > div.assigned.span6 > div.sortable > ol'
    );

    if (!container) return [];

    return Array.from(container.querySelectorAll('li[data-panel-id]')).map(item => {
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
        const jsonField = item.querySelector('textarea.page-json-setting');
        if (jsonField && jsonField.value.trim()) {
            try {
                const jsonData = JSON.parse(jsonField.value);
                jsonData.forEach(field => {
                    if (field.type === 'ckeditor' && field.name) {
                        inputs[field.name] = field.value;
                    }
                });
            } catch (e) {
                console.warn(`Invalid JSON in panel ${panelId}`, e);
            }
        }

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
            const tag = el.tagName;
            const type = el.type;
            if (tag === 'TEXTAREA' && el.classList.contains('mceEditor')) {
                const editorInstance = tinymce.get(el.id);
                if (editorInstance) {
                    editorInstance.setContent(val || '');
                } else {
                    el.value = val;
                }
            }
            else if (
                tag === 'SELECT' ||
                tag === 'TEXTAREA' ||
                (tag === 'INPUT' && type !== 'checkbox' && type !== 'radio')
            ) {
                el.value = val;
                el.dispatchEvent(new Event('change', { bubbles: true }));
            }
            else if (type === 'checkbox' || type === 'radio') {
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

function convertPanelsToCSV(header, panels) {
    const rows = [];
    const headerKeys = Object.keys(header);
    const headerValues = headerKeys.map(k => `"${(header[k] ?? '').toString().replace(/"/g, '""')}"`);
    rows.push(headerKeys.join(';'));
    rows.push(headerValues.join(';'));
    rows.push('');

    const flattened = panels.map(panel => {
        const base = {};
        Object.entries(panel.inputs).forEach(([key, value]) => {
            base[`inputs.${key}`] = value;
        });
        return {
            panelId: panel.panelId,
            ...base
        };
    });

    const allKeys = new Set(['panelId']);
    flattened.forEach(obj => Object.keys(obj).forEach(k => allKeys.add(k)));
    const dataHeaders = Array.from(allKeys);
    rows.push(dataHeaders.join(';'));

    flattened.forEach(obj => {
        const row = dataHeaders.map(h => {
            const val = obj[h];
            if (typeof val === 'string') {
                return `"${val.replace(/"/g, '""')}"`;
            }
            if (val === null || val === undefined) return '';
            return val.toString();
        });
        rows.push(row.join(';'));
    });

    return rows.join('\r\n');
}

function parsePageMeta() {
    const iter = document.createNodeIterator(document, NodeFilter.SHOW_COMMENT);
    let node;
    while ((node = iter.nextNode())) {
        const text = node.nodeValue.trim();
        if (text.includes('User Name:')) {
            const meta = {};
            text.split(/\r?\n/).forEach(line => {
                const idx = line.indexOf(':');
                if (idx > -1) {
                    const k = line.slice(0, idx).trim();
                    const v = line.slice(idx + 1).trim();
                    if (k && v) meta[k] = v;
                }
            });
            return meta;
        }
    }
    return null;
}

function downloadFile(data, projectId = '', meta = null, isJson) {
    const pid = meta?.['Project ID'] ?? projectId ?? 'NOPROJECT';
    const rawProjectName = meta?.Project ?? 'NOPROJECTNAME';
    const safeProjectName = rawProjectName.replace(/[^\w\d-]/g, '_');
    const page = meta?.Page ?? 'NOPAGE';
    const server = meta?.Server ?? 'NOSERVER';
    const now = new Date().toISOString().replace(/[:]/g, '-').split('.')[0];

    const filenameBase = `SERVER_${server}--PROJECT_${safeProjectName}--PID_${pid}--PAGE_${page}--DATE_${now}`;

    const payload = {
        header: { pid, projectName: rawProjectName, page, server },
        panels: data
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json'
    });

    const csvContent = convertPanelsToCSV(payload.header, data);
    const csvBlob = new Blob([csvContent], { type: 'text/csv' });

    if (isJson) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filenameBase}--settings.json`;
        a.click();
        URL.revokeObjectURL(url);
    } else {
        const csvUrl = URL.createObjectURL(csvBlob);
        const csvLink = document.createElement('a');
        csvLink.href = csvUrl;
        csvLink.download = `${filenameBase}--settings.csv`;
        csvLink.click();
        URL.revokeObjectURL(csvUrl);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const saveBtn = document.getElementById('save-json');
    const loadBtn = document.getElementById('load-json');
    const infoText = document.querySelector('.info-text');
    const saveBtnCsv = document.getElementById('save-csv');

    function setInfo(msg) {
        infoText.textContent = msg;
    }

    async function handleSaveClick(isJson) {
        setInfo('');
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        chrome.scripting.executeScript(
            { target: { tabId: tab.id }, func: getProjectIdFromPage },
            projectRes => {
                const projectId = projectRes?.[0]?.result || '';
                chrome.scripting.executeScript(
                    { target: { tabId: tab.id }, func: parsePageMeta },
                    metaRes => {
                        const meta = metaRes?.[0]?.result || null;
                        chrome.scripting.executeScript(
                            { target: { tabId: tab.id }, func: collectAllPanels },
                            panelsRes => {
                                const panels = panelsRes?.[0]?.result || [];
                                downloadFile(panels, projectId, meta, isJson);
                                setInfo('Export complete.');
                            }
                        );
                    }
                );
            }
        );
    }

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'application/json';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    loadBtn.addEventListener('click', () => {
        setInfo('');
        fileInput.value = null;
        fileInput.click();
    });
    
    saveBtn.addEventListener('click', async () => {
        handleSaveClick(true);
    });

    saveBtnCsv.addEventListener('click', async () => {
        handleSaveClick(false);
    });
    
    fileInput.addEventListener('change', async () => {
        setInfo('');
        const file = fileInput.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async e => {
            let data;
            try {
                data = JSON.parse(e.target.result);
            } catch {
                setInfo('Invalid JSON file.');
                infoText.classList.add('error');
                return;
            }

            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const [{ result: pidRes } = {}, { result: metaRes } = {}] = await Promise.all([
                new Promise(res => chrome.scripting.executeScript(
                    { target: { tabId: tab.id }, func: getProjectIdFromPage },
                    ([r]) => res(r)
                )),
                new Promise(res => chrome.scripting.executeScript(
                    { target: { tabId: tab.id }, func: parsePageMeta },
                    ([r]) => res(r)
                ))
            ]);

            const errorMsg = validateImportData(data, metaRes || {}, pidRes || '');
            if (errorMsg) {
                setInfo(errorMsg);
                infoText.classList.add('error');
                return;
            }

            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: loadAllPanels,
                args: [data.panels]
            });
            setInfo('Panels imported successfully.');
            infoText.classList.add('success');
        };

        reader.readAsText(file);
    });

    function validateImportData(data, currentMeta, currentPid) {
        const mismatches = [];
        const pidCheck = currentMeta['Project ID'] ?? currentPid;

        if (!data.header || !Array.isArray(data.panels)) {
            return 'JSON missing required header or panels.';
        }
        if (data.header.pid !== pidCheck) {
            mismatches.push(
                `+ Project ID "${data.header.pid}" is not Current "${pidCheck}"`
            );
        }
        if (data.header.page !== currentMeta.Page) {
            mismatches.push(`+ Page "${data.header.page}" is not Current "${currentMeta.Page}"`);
        }
        if (data.header.projectName !== currentMeta.Project) {
            mismatches.push(
                `+ Project Name "${data.header.projectName}" is not Current "${currentMeta.Project}"`
            );
        }
        if (data.header.server !== currentMeta.Server) {
            mismatches.push(
                `+ Server "${data.header.server}" is not Current "${currentMeta.Server}"`
            );
        }

        if (mismatches.length) {
            return (
                'Import aborted due to header mismatch.\n\n' +
                "Please check if you're in the right Project/Page/Host Env:\n\n" +
                mismatches.join('\n')
            );
        }

        return null;
    }
});


document.addEventListener("DOMContentLoaded", () => {
    const tabButtons = document.querySelectorAll(".tab-btn");
    const tabContents = document.querySelectorAll(".tab-content");

    tabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            tabButtons.forEach(b => b.classList.remove("active"));
            tabContents.forEach(c => c.classList.remove("active"));

            btn.classList.add("active");
            document.getElementById(btn.dataset.tab).classList.add("active");
        });
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const liveBtn = document.getElementById("switch-live");
    const testBtn = document.getElementById("switch-test");
    const fedevBtn = document.getElementById("switch-fedev");

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (!tab || !tab.url) return;

        const url = new URL(tab.url);
        const host = url.hostname;

        function getBase(hostname) {
            let base = hostname.replace(/^www\./, "");

            if (base.endsWith(".fosterwebmarketing.com")) {
                base = base.replace(/\.fosterwebmarketing\.com$/, "");
                if (base.endsWith("-fedev")) {
                    base = base.replace(/-fedev$/, "");
                }
                return base;
            }

            return base.split(".")[0];
        }

        const base = getBase(host);

        const targets = {
            live: `${base}.com`,
            staging: `${base}.fosterwebmarketing.com`,
            fedev: `${base}-fedev.fosterwebmarketing.com`
        };

        function redirectWithFeedback(targetHost, btn, originalText) {
            btn.textContent = "Redirecting...";
            btn.disabled = true;
            chrome.tabs.update(tab.id, { url: `${url.protocol}//${targetHost}${url.pathname}${url.search}${url.hash}`});
            
            const listener = (updatedTabId, changeInfo) => {
                if (updatedTabId === tab.id && changeInfo.status === "complete") {
                    btn.textContent = originalText;
                    btn.disabled = false;
                    chrome.tabs.onUpdated.removeListener(listener);
                }
            };
            chrome.tabs.onUpdated.addListener(listener);
        }

        liveBtn.addEventListener("click", () => redirectWithFeedback(targets.live, liveBtn, "Switch to LIVE"));
        testBtn.addEventListener("click", () => redirectWithFeedback(targets.staging, testBtn, "Switch to TEST"));
        fedevBtn.addEventListener("click", () => redirectWithFeedback(targets.fedev, fedevBtn, "Switch to FEDEV"));
    });
});


