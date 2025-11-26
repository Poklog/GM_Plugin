(function () {
    console.log("[Meet Caption Grabber] Content script active");

    // 存储逐字稿数据
    let captions = [];
    let lastCaptionTime = 0;
    const DEBOUNCE_MS = 500;

    /**
     * 获取所有字幕元素（支持 Shadow DOM）
     */
    function getAllCaptions() {
        const captionTexts = new Set();

        // 查找 Google Meet 中的字幕容器
        // 典型位置：data-is-caption, aria-live 元素
        const selectors = [
            '[data-is-caption="true"]',
            '[role="status"][aria-live]',
            ".jiNu6c", // Meet 字幕 class
            'span[aria-live="polite"]',
        ];

        selectors.forEach((selector) => {
            try {
                document.querySelectorAll(selector).forEach((el) => {
                    const text = el.textContent?.trim();
                    if (text && text.length > 0 && !isChinese(text)) {
                        // 非中文，先记录
                        captionTexts.add({ text, timestamp: Date.now() });
                    } else if (text && isChinese(text)) {
                        captionTexts.add({ text, timestamp: Date.now() });
                    }
                });
            } catch (e) {
                console.debug(
                    "[Meet Caption Grabber] Error querying selector:",
                    selector,
                    e
                );
            }
        });

        // 遍历 Shadow DOM
        try {
            traverseShadowDOM(document.documentElement, captionTexts);
        } catch (e) {
            console.debug(
                "[Meet Caption Grabber] Shadow DOM traversal error:",
                e
            );
        }

        return Array.from(captionTexts);
    }

    /**
     * 遍历 Shadow DOM
     */
    function traverseShadowDOM(node, captionTexts) {
        if (!node) return;

        if (node.shadowRoot) {
            node.shadowRoot
                .querySelectorAll('[data-is-caption], [role="status"]')
                .forEach((el) => {
                    const text = el.textContent?.trim();
                    if (text && text.length > 0) {
                        captionTexts.add({ text, timestamp: Date.now() });
                    }
                });

            node.shadowRoot.childNodes.forEach((child) => {
                traverseShadowDOM(child, captionTexts);
            });
        }

        node.childNodes.forEach((child) => {
            traverseShadowDOM(child, captionTexts);
        });
    }

    /**
     * 检测是否为中文（包括繁体/简体）
     */
    function isChinese(text) {
        // Unicode 范围：中日韓統一漢字
        return /[\u4E00-\u9FFF]/.test(text);
    }

    /**
     * 使用 MutationObserver 监听字幕变化
     */
    const observer = new MutationObserver(() => {
        const now = Date.now();
        if (now - lastCaptionTime < DEBOUNCE_MS) {
            return;
        }
        lastCaptionTime = now;

        const newCaptions = getAllCaptions();
        newCaptions.forEach((cap) => {
            // 去重
            if (
                !captions.some(
                    (c) =>
                        c.text === cap.text &&
                        Math.abs(c.timestamp - cap.timestamp) < 1000
                )
            ) {
                captions.push(cap);
            }
        });

        // 发送到 background script 保存
        if (captions.length > 0) {
            chrome.runtime
                .sendMessage({
                    type: "caption-update",
                    data: captions,
                })
                .catch((e) => {
                    console.debug("[Meet Caption Grabber] Message error:", e);
                });
        }
    });

    // 监听整个文档
    observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ["data-is-caption", "aria-live"],
        attributeOldValue: false,
        characterDataOldValue: false,
    });

    console.log("[Meet Caption Grabber] MutationObserver started");
})();
