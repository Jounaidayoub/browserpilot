import { defineTool } from "./defineTool";
import {
  getTabContentDef,
  getPageContentDef,
  getPageDomSnapshotDef,
} from "./definitions/page.def";
import Inspector from "@/sidepanel/Inspector";
import { services, type IServices } from "@/services";
import { convertHtmlToMarkdown } from "dom-to-semantic-markdown";

function getPageHTML() {
  return document.documentElement.outerHTML;
}

export const fetchTabContent = async (id: number, svc: IServices) => {
  try {
    const results = await svc.scripting.executeScript({
      target: { tabId: id },
      func: getPageHTML,
    });

    if (!results || !results[0] || !results[0].result) {
      throw new Error("Failed to retrieve page content via script injection");
    }

    const html = results[0].result;

    const markdown = convertHtmlToMarkdown(html, {
      extractMainContent: true,
    });

    const tab = await svc.tabs.get(id);

    return {
      markdown: markdown,
      meta: {
        title: tab.title ?? "",
        url: tab.url ?? "",
        text: markdown 
      },
    };
  } catch (error) {
    console.error("Error fetching tab content:", error);
    return null;
  }
};

export const get_tab_content = defineTool(getTabContentDef, async ({ tabId }, services) => {
  const tabContent = await fetchTabContent(tabId, services);
  console.log("thenew Markdown", tabContent?.markdown);

  if (tabContent?.markdown && tabContent.markdown.split(/\s+/).length > 6000) {
    console.warn("Markdown content too large (over 6000 words)");
  }

  return JSON.stringify({
    textContent: tabContent?.markdown ?? "",
    title: tabContent?.meta?.title ?? "",
    url: tabContent?.meta?.url ?? "",
  });
});

export const get_page_content = defineTool(getPageContentDef, async ({ tabId }, services) => {
  const response = await services.messaging.sendMessage({
    action: "get_page_dom_snapshot",
    tabId,
  });

  const resp = response as { success?: boolean; error?: string; _snap?: unknown };
  if (!resp?.success) {
    throw new Error(resp?.error || "Failed to get page content");
  }

  const snapshot = resp._snap;
  return typeof snapshot === "string" ? snapshot : JSON.stringify(snapshot);
});

export const get_page_dom_snapshot = defineTool(getPageDomSnapshotDef, async ({ tabId, options }, services) => {
  const response = await services.messaging.sendMessage({
    action: "get_page_dom_snapshot",
    toolName: "get_page_dom_snapshot",
    tabId,
    input: options,
  });

  const resp = response as { success?: boolean; error?: string; snapshot?: unknown };
  if (!resp?.success) {
    throw new Error(resp?.error || "Failed to get snapshot");
  }

  const snapshot = resp.snapshot;
  return typeof snapshot === "string" ? snapshot : JSON.stringify(snapshot);
});

export const injectInspector = async (svc: IServices = services): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      const tabs = await svc.tabs.query({ active: true, currentWindow: true });
      const tab = tabs[0];

      if (!tab?.id) {
        reject(new Error("No active tab found"));
        return;
      }

      const tabId = tab.id;

      const messageListener = (message: { type?: string; elementHTML?: string }) => {
        console.log("[Inspector] Received message in sidepanel:", message);
        if (message.type === "ELEMENT_INSPECTOR_RESULT") {
          console.log("[Inspector] Got ELEMENT_INSPECTOR_RESULT, resolving with HTML");
          svc.messaging.onMessage.removeListener(messageListener as Parameters<typeof svc.messaging.onMessage.removeListener>[0]);
          resolve(message.elementHTML ?? "");
        }
      };

      console.log("[Inspector] Setting up message listener");
      svc.messaging.onMessage.addListener(messageListener as Parameters<typeof svc.messaging.onMessage.addListener>[0]);

      console.log("[Inspector] Injecting inspector script into tab:", tabId);
      await svc.scripting.executeScript({
        target: { tabId },
        func: Inspector,
      });
      console.log("[Inspector] Script injected, waiting for element selection...");

      setTimeout(() => {
        svc.messaging.onMessage.removeListener(messageListener as Parameters<typeof svc.messaging.onMessage.removeListener>[0]);
        reject(new Error("Inspector timeout - no element selected"));
      }, 30000);
    } catch (error) {
      reject(error);
    }
  });
};
