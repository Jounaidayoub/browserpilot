console.log("[CRXJS] Hello world from content script!");

// Sidepanel keyboard shortcut
let panel = false;
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "s") {
    e.preventDefault();
    panel = !panel;
    if (!panel) {
      console.log("Closing side panel...");
      chrome.runtime.sendMessage({ action: "close-sidepanel" });
      return;
    }
    console.log("Opening side panel...");
    chrome.runtime.sendMessage({ action: "open-sidepanel" });
  }
});

// Element inspector message forwarding
window.addEventListener("message", (event) => {
  if (event.source !== window) return;

  if (event.data.type === "ELEMENT_INSPECTOR_SELECTED") {
    console.log("Content script received message from page:", event.data);

    chrome.runtime
      .sendMessage({
        type: "ELEMENT_INSPECTOR_RESULT",
        elementHTML: event.data.elementHTML,
        tagName: event.data.tagName,
        className: event.data.className,
        id: event.data.id,
      })
      .then(() => {
        console.log("Message forwarded to extension");
      })
      .catch((error) => {
        console.error("Error forwarding message:", error);
      });
  }
});
