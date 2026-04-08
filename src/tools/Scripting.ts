import { defineTool } from "./defineTool";
import { runScriptDef } from "./definitions/scripting.def";
import { findActiveTabId } from "./utils";

export const run_script = defineTool(runScriptDef, async ({ code, tabId }, services) => {
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
          window.postMessage({ channel: CHANNEL, type: "run-code", code: snippet }, "*");
        };
      } else {
        window.postMessage({ channel: CHANNEL, type: "run-code", code: snippet }, "*");
      }
    },
    args: [runnerPath, code],
  });

  return `Injected code into tab ${targetTabId}`;
});
