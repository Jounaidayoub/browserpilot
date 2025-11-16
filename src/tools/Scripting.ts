import z from "zod";
import type { Tool } from "./types";
import { findActiveTabId } from "./utils";

const run_scriptInput = z.object({
  code: z.string().min(1, "Code is required"),
  tabId: z.number().optional(),
});

const run_script: Tool<typeof run_scriptInput> = {
  name: "run_script",
  description:
    "Inject and execute a JavaScript snippet within the specified or active tab.",
  inputSchema: run_scriptInput,
  execute: async ({ code, tabId }) => {
    let targetTabId = tabId;

    if (typeof targetTabId !== "number") {
      targetTabId = await findActiveTabId();
      if (typeof targetTabId !== "number") {
        throw new Error("No active tab found");
      }
    }

    await chrome.scripting.executeScript({
      target: { tabId: targetTabId },
      func: (runnerPath, snippet) => {
        const CHANNEL = "__EXT_RUNNER_V1__";
        if (!document.querySelector(`script[src="${runnerPath}"]`)) {
          const s = document.createElement("script");
          s.src = runnerPath;
          s.async = false;
          (document.head || document.documentElement).appendChild(s);
          s.onload = () => {
            s.remove();
            window.postMessage(
              { channel: CHANNEL, type: "run-code", code: snippet },
              "*"
            );
          };
        } else {
          window.postMessage(
            { channel: CHANNEL, type: "run-code", code: snippet },
            "*"
          );
        }
      },
      args: [chrome.runtime.getURL("injector/runner.js"), code],
    });

    return `Injected code into tab ${targetTabId}`;
  },
};

export { run_script };
