chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "switchLIVE",
        title: "FWM: Switch to LIVE",
        contexts: ["all"]
    });

    chrome.contextMenus.create({
        id: "switchTEST",
        title: "FWM: Switch to TEST",
        contexts: ["all"]
    });

    chrome.contextMenus.create({
        id: "switchFEDEV",
        title: "FWM: Switch to FEDEV",
        contexts: ["all"]
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (!tab || !tab.url) { return; }

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

    let targetHost;

    switch (info.menuItemId) {
        case "switchLIVE":
            targetHost = `${base}.com`;
            break;
        case "switchTEST":
            targetHost = `${base}.fosterwebmarketing.com`;
            break;
        case "switchFEDEV":
            targetHost = `${base}-fedev.fosterwebmarketing.com`;
            break;
    }

    const newUrl = `${url.protocol}//${targetHost}${url.pathname}${url.search}${url.hash}`;
    chrome.tabs.update(tab.id, { url: newUrl });
});