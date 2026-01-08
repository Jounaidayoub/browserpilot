import Readability from "@mozilla/readability";
import z from "zod";
import type { Tool } from "./types";
import Inspector from "@/sidepanel/Inspector";
import { services as defaultServices, IServices } from "@/services";

export const fetchTabContent = async (
  id: number,
  svc: IServices = defaultServices
) => {
  //we sending a msg to the content script to get the md from there
  //cuz we needed the original tab html , need a better way to do this later
  // well we get the html from the scripting api , so we can recreate the dom using the DOMParser
  //and passing to the readability or convertHtmlToMarkdown()
  //TODO: try to do all in the using the scripting api only , less things to maintain
  const markdown = await svc.tabs
    .sendMessage(id, {
      action: "get_tab_content_md",
      message: `Fetching tab content for tab ID: ${id}`,
    })
    .then((response) => {
      return (response as { content: string }).content;
    });
  console.log("got markdown from content script ", markdown);
  const res = await svc.scripting.executeScript({
    target: { tabId: id },
    world: "MAIN",
    func: () => {
      return {
        title: document.title,
        url: location.href,
        html: document.documentElement?.outerHTML ?? "",
        text: document.body?.innerText ?? "",
      };
    },
  });

  const payload = res?.[0]?.result as
    | {
      title: string;
      url: string;
      html: string;
      text: string;
    }
    | undefined;

  if (!payload?.html) {
    return null;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(payload.html, "text/html");
  const article = new Readability.Readability(doc).parse();

  return {
    article,
    meta: { title: payload.title, url: payload.url, text: payload.text },
    markdown,
  };
};

const get_tab_contentInput = z.object({
  tabId: z.number(),
});

const get_tab_content: Tool<typeof get_tab_contentInput> = {
  name: "get_tab_content",
  description:
    "Get distilled readable content, title, and URL for the specified tab.",
  inputSchema: get_tab_contentInput,
  execute: async ({ tabId }, services = defaultServices) => {
    const tabContent = await fetchTabContent(tabId, services);
    let usePlainText = false;
    if (
      tabContent?.markdown &&
      tabContent.markdown.split(/\s+/).length > 6000
    ) {
      usePlainText = true;
      // i know this not corret token count , but just to save the context window
      // from being overloaded ,
      // Reminder : the library html-to-md has major flaw with tabeles and it blows up the whooe things
      //reference : test teh libray with hackernews which the whole page is a giant table
      console.warn("Markdown conent too large fallback to just textcontent");
    }

    return JSON.stringify({
      textContent: usePlainText
        ? tabContent?.article?.textContent ?? ""
        : tabContent?.markdown ?? "",
      title: tabContent?.meta?.title ?? "",
      url: tabContent?.meta?.url ?? "",
    });
  },
};

const get_page_contentInput = z.object({
  tabId: z.number(),
});

const get_page_content: Tool<typeof get_page_contentInput> = {
  name: "get_page_content",
  description: "Retrieve the serialized DOM snapshot for the given tab.",
  inputSchema: get_page_contentInput,
  execute: async ({ tabId }, services = defaultServices) => {
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
  },
};

const get_page_dom_snapshotInput = z.object({
  tabId: z.number(),
  options: z.record(z.string(), z.unknown()).optional(),
});

const get_page_dom_snapshot: Tool<typeof get_page_dom_snapshotInput> = {
  name: "get_page_dom_snapshot",
  description:
    "Request a DOM snapshot via the background service with optional options.",
  inputSchema: get_page_dom_snapshotInput,
  execute: async ({ tabId, options }, services = defaultServices) => {
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
  },
};

export { get_tab_content, get_page_content, get_page_dom_snapshot };

export const injectInspector = async (
  svc: IServices = defaultServices
): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      const tabs = await svc.tabs.query({
        active: true,
        currentWindow: true,
      });
      const tab = tabs[0];

      if (!tab?.id) {
        reject(new Error("No active tab found"));
        return;
      }

      const tabId = tab.id;

      const messageListener = (message: { type?: string; elementHTML?: string }) => {
        if (message.type === "ELEMENT_INSPECTOR_RESULT") {
          svc.messaging.onMessage.removeListener(messageListener as Parameters<typeof svc.messaging.onMessage.removeListener>[0]);
          resolve(message.elementHTML ?? "");
        }
      };

      svc.messaging.onMessage.addListener(messageListener as Parameters<typeof svc.messaging.onMessage.addListener>[0]);

      await svc.scripting.executeScript({
        target: { tabId },
        func: Inspector,
      });

      setTimeout(() => {
        svc.messaging.onMessage.removeListener(messageListener as Parameters<typeof svc.messaging.onMessage.removeListener>[0]);
        reject(new Error("Inspector timeout - no element selected"));
      }, 30000);
    } catch (error) {
      reject(error);
    }
  });
};
