import type { Tool } from "./types";
import { run_scriptSchema } from "./definitions";
import { findActiveTabId } from "./utils";
import { services as defaultServices, IServices } from "@/services";

const run_script: Tool<typeof run_scriptSchema> = {
  name: "run_script",
  description:
    "Inject and execute a JavaScript snippet within the specified or active tab.",
  inputSchema: run_scriptSchema,
  execute: async ({ code, tabId }, services = defaultServices) => {
    let targetTabId = tabId;

    if (typeof targetTabId !== "number") {
      targetTabId = await findActiveTabId(services);
      if (typeof targetTabId !== "number") {
        throw new Error("No active tab found");
      }
    }

    const runnerPath = services.messaging.getURL("injector/runner.js");

    await services.scripting.executeScript({
      target: { tabId: targetTabId },
      func: (runnerPathArg: string, snippet: string) => {
        const CHANNEL = "__EXT_RUNNER_V1__";
        if (!document.querySelector(`script[src="${runnerPathArg}"]`)) {
          const s = document.createElement("script");
          s.src = runnerPathArg;
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
      args: [runnerPath, code],
    });

    return `Injected code into tab ${targetTabId}`;
  },
};

export { run_script };
