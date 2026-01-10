import Readability from "@mozilla/readability";
import { defineTool } from "./defineTool";
import {
  getTabContentDef,
  getPageContentDef,
  getPageDomSnapshotDef,
} from "./definitions/page.def";
import Inspector from "@/sidepanel/Inspector";
import { services, type IServices } from "@/services";

export const fetchTabContent = async (id: number, svc: IServices) => {
  const markdown = await svc.tabs
    .sendMessage(id, {
      action: "get_tab_content_md",
      message: `Fetching tab content for tab ID: ${id}`,
    })
    .then((response) => (response as { content: string }).content);

  const res = await svc.scripting.executeScript({
    target: { tabId: id },
    world: "MAIN",
    func: () => ({
      title: document.title,
      url: location.href,
      html: document.documentElement?.outerHTML ?? "",
      text: document.body?.innerText ?? "",
    }),
  });

  const payload = res?.[0]?.result as
    | { title: string; url: string; html: string; text: string }
    | undefined;

  if (!payload?.html) return null;

  const parser = new DOMParser();
  const doc = parser.parseFromString(payload.html, "text/html");
  const article = new Readability.Readability(doc).parse();

  return {
    article,
    meta: { title: payload.title, url: payload.url, text: payload.text },
    markdown,
  };
};

export const get_tab_content = defineTool(getTabContentDef, async ({ tabId }, services) => {
  const tabContent = await fetchTabContent(tabId, services);
  let usePlainText = false;
  if (tabContent?.markdown && tabContent.markdown.split(/\s+/).length > 6000) {
    usePlainText = true;
    console.warn("Markdown content too large fallback to just textcontent");
  }

  return JSON.stringify({
    textContent: usePlainText
      ? tabContent?.article?.textContent ?? ""
      : tabContent?.markdown ?? "",
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
