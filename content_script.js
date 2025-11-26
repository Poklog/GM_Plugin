(function () {
    // Content script: listens for window messages to trigger a temporary outline
    window.addEventListener(
        "message",
        (event) => {
            if (event.data && event.data.type === "gm-highlight") {
                document.body.style.outline = "6px dashed #f39c12";
                setTimeout(() => {
                    document.body.style.outline = "";
                }, 2000);
            }
        },
        false
    );

    console.log("GM Plugin content script active");
})();
