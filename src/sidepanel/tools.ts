import type { UIMessage, InferUIMessageToolCall } from "ai";
import type { MentionOption } from "mentis";
import Readability from "@mozilla/readability";
import { Archive, DoorClosed } from "lucide-react";
export const get_tabs = async () => {
  const tabs = await chrome.tabs.query({});

  const tabs_meta = tabs.map((tab) => ({
    id: tab.id,
    title: tab.title,
    url: tab.url,
    groupid: tab.groupId,
    index: tab.index,
    windowid: tab.windowId,
  }));
  return tabs_meta;
};
const getTabcontent = (tabid: number) => {};

export const evaluateToolCall = async (
  toolCall: InferUIMessageToolCall<UIMessage>,
  addToolResult: <TOOL extends string>({
    state,
    tool,
    toolCallId,
    output,
    errorText,
  }:
    | {
        state?: "output-available" | undefined;
        tool: TOOL;
        toolCallId: string;
        output: unknown;
        errorText?: undefined;
      }
    | {
        state: "output-error";
        tool: TOOL;
        toolCallId: string;
        output?: undefined;
        errorText: string;
      }) => Promise<void>
) => {
  switch (toolCall.toolName) {
    case "get_groups":
      const Groups = await chrome.tabGroups.query({});
      addToolResult({
        tool: "get_groups",
        toolCallId: toolCall.toolCallId,
        output: JSON.stringify(Groups),
      });
      break;
    case "get_tabs":
      const tabs = await chrome.tabs.query({});

      const tabs_meta = tabs.map((tab) => ({
        active: tab.active,
        id: tab.id,
        title: tab.title,
        url: tab.url,
        groupid: tab.groupId,
        index: tab.index,
        windowid: tab.windowId,
      }));

      addToolResult({
        tool: "get_tabs",
        toolCallId: toolCall.toolCallId,
        output: JSON.stringify(tabs_meta),
      });

      console.log("tabs", tabs_meta);

      break;

    case "group_tabs_by_ids":
      const args: any = toolCall.input;
      const groups = args.groups;
      console.log("grouping tabs by idees", groups);
      if (!Array.isArray(groups)) {
        console.error("Expected groups to be an array, got:", groups);
        break;
      }

      groups.forEach(async (group) => {
        console.log("grouping", group);
        const { tabIds, title, color } = group;
        const groupid = await chrome.tabs.group({ tabIds: tabIds });
        console.log("created group", groupid);
        await chrome.tabGroups.update(groupid, {
          title: title,
          color: color,
        });
        console.log(
          `Grouped tabs ${tabIds} into group ${groupid} with title "${title}" and color "${color}"`
        );
      });
      addToolResult({
        tool: "group_tabs_by_ids",
        toolCallId: toolCall.toolCallId,
        output: `Grouped ${groups.length} groups successfully.`,
      });
      break;

    case "close_tabs":
      const close_args: any = toolCall.input;
      const tabIdsToClose = close_args.tabIds;
      console.log("closing tabs", tabIdsToClose);
      if (!Array.isArray(tabIdsToClose)) {
        console.error("Expected tabIds to be an array, got:", tabIdsToClose);
        break;
      }
      // await chrome.tabs.remove(tabIdsToClose);
      chrome.tabs.query({}, () => {
        chrome.tabs.remove(tabIdsToClose);
      });
      addToolResult({
        tool: "close_tabs",
        toolCallId: toolCall.toolCallId,
        output: `Closed tabs with IDs: ${tabIdsToClose.join(", ")}`,
      });
      break;

    case "search_history":
      const history_args: any = toolCall.input;
      let { query, maxResults, startTime, endTime } = history_args;
      startTime = new Date(startTime).getTime();
      endTime = new Date(endTime).getTime();

      const historyItems = await chrome.history.search({
        text: query, // Return every history item....
        startTime: startTime, // that was accessed less than one week ago.
        
        endTime:  endTime || undefined,
        maxResults: maxResults,
      });

      addToolResult({
        tool: "search_history",
        toolCallId: toolCall.toolCallId,
        output: JSON.stringify(historyItems),
      });
      break;

    case "get_current_time": {
      const now = new Date();
      addToolResult({
        tool: "get_current_time",
        toolCallId: toolCall.toolCallId,
        output: now.toISOString(),
      });
      break;
    }
    case "run_script": {
      console.log("run_script tool called");
      const run_script_args: any = toolCall.input;
      const code: string = run_script_args.code ?? "";
      let tabId: number | undefined = run_script_args.tabId;

      if (!code) {
        addToolResult({
          state: "output-error",
          tool: "run_script",
          toolCallId: toolCall.toolCallId,
          errorText: "No code provided",
        });
        break;
      }

      // pick active tab if not provided
      if (typeof tabId !== "number") {
        const tabs = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        tabId = tabs?.[0]?.id;
        if (!tabId) {
          addToolResult({
            state: "output-error",
            tool: "run_script",
            toolCallId: toolCall.toolCallId,
            errorText: "No active tab found",
          });
          break;
        }
      }

      try {
        await chrome.scripting.executeScript({
          target: { tabId },
          func: (runnerPath, code) => {
            const CHANNEL = "__EXT_RUNNER_V1__";
            if (!document.querySelector(`script[src="${runnerPath}"]`)) {
              const s = document.createElement("script");
              s.src = runnerPath;
              s.async = false;
              (document.head || document.documentElement).appendChild(s);
              s.onload = () => {
                s.remove();
                window.postMessage(
                  { channel: CHANNEL, type: "run-code", code },
                  "*"
                );
              };
            } else {
              window.postMessage(
                { channel: CHANNEL, type: "run-code", code },
                "*"
              );
            }
          },
          args: [chrome.runtime.getURL("injector/runner.js"), code],
        });

        addToolResult({
          tool: "run_script",
          toolCallId: toolCall.toolCallId,
          output: `Injected code into tab ${tabId}`,
        });
      } catch (err) {
        addToolResult({
          state: "output-error",
          tool: "run_script",
          toolCallId: toolCall.toolCallId,
          errorText: String(err),
        });
      }
      break;
    }
    case "get_tab_content":
      const get_tab_content_args: any = toolCall.input;
      const { tabId } = get_tab_content_args;
      const tabContent = await get_tab_content(tabId);

      addToolResult({
        tool: "get_tab_content",
        toolCallId: toolCall.toolCallId,
        output: JSON.stringify({
          textContent: tabContent?.meta?.text,
          title: tabContent?.meta.title,
          url: tabContent?.meta.url,
        }),
      });
      break;

    default:
      console.warn("Unknown tool:", toolCall.toolName);
      break;
  }
};

export const get_tab_content = async (id: number) => {
  //this fucntion is primalry used for getting the distilled content text of a given tab
  //Good for info exctraction and answer question based on the content and general question
  //
  const res = await chrome.scripting.executeScript({
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
  console.log("got tab content", res);
  const payload = res?.[0]?.result;
  if (!payload || !payload.html) return null;

  const parser = new DOMParser();
  const doc = parser.parseFromString(payload.html, "text/html");
  const article = new Readability.Readability(doc).parse();
  console.log("extracted article", article);

  return {
    article,
    meta: { title: payload.title, url: payload.url, text: payload.text },
  };
};
