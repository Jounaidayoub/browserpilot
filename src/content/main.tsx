import Readability from "@mozilla/readability";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

function htmlToMarkdown(html: string) {
  const turndown = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
  });
  turndown.use(gfm);
  turndown.addRule("removeEmptyLinks", {
    filter: (node) => node.nodeName === "A" && !node.textContent?.trim(),
    replacement: () => "",
  });
  return turndown
    .turndown(html)
    .replace(/\[\\\[?\s*\\?\]\]\([^)]*\)/g, "")
    .replace(/ +/g, " ")
    .replace(/\s+,/g, ",")
    .replace(/\s+\./g, ".")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

console.log("[CRXJS] Hello world from content script!");
console.log("we are setting up message listener");
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log(`[CRXJS LOG]: ${message.message}`, "snder:", _sender);
  if (message?.action === "get_tab_content_md") {
    try {
      // Use DOMParser to create a fresh document from HTML string
      // This avoids issues with custom elements registry when cloning
      const html = document.documentElement.outerHTML;
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      // Set the base URL for relative link resolution
      const base = doc.createElement("base");
      base.href = location.href;
      doc.head.prepend(base);

      const article = new Readability.Readability(doc).parse();

      const markdown = htmlToMarkdown(
        article?.content ?? document.body.innerHTML
      );

      console.debug("Converted Markdown content:", markdown);
      sendResponse({
        content: markdown,
        title: document.title,
        url: location.href,
        textContent: article?.textContent ?? "",
      });
    } catch (error) {
      console.error("Error converting to markdown:", error);
      sendResponse({ content: "", error: String(error) });
    }
    return true; // Keep channel open for async response
  }
  sendResponse({ received: true });
});
console.log("message listener set up complete");

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

// const container = document.createElement('div')
// container.id = 'crxjs-app'
// document.body.appendChild(container)
// createRoot(container).render(
//   <StrictMode>
//     <App />
//   </StrictMode>,
// )
