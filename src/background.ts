import { crx, type CrxApplication } from "playwright-crx";
import { messageHandlers } from "./background/messageHandlers";

(async () => {
  let crxApp: CrxApplication | null = null;
  try {
    crxApp = await crx.start({ slowMo: 50 });
  } catch (e) {
    console.log("encounter an erro while instanting ", e);
  }

  // try {
  //   const ctx = await crx.get();
  //   console.log("got context ", ctx);

  //   await ctx?.attachAll();

  //   const pages= await ctx?.pages();
  //   console.log("got pages ", pages);

  //   for (const page of pages ?? []) {
  //     console.log("page url ",  page.url());
  //   }

  //   console.log("background script started ");
  // } catch (e) {
  //   console.log("encounter an error while getting context ", e);
  // }
  // const crxApp = _crxApp;
  // if (!crxApp) {
  //   throw new Error("Failed to get crx application");
  // }
  // const
  // const BrowserContext = crxApp?.context();
  // (await BrowserContext.newPage()).locator("body

  chrome.runtime.onStartup.addListener(async () => {
    console.log(`onStartup()`);
  });

  chrome.runtime.onInstalled.addListener(() => {
    if (chrome.sidePanel?.setPanelBehavior) {
      chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
    }
  });

  console.log("Registered commands are :");
  chrome.commands.getAll((commands) => {
    console.log("Registered commands:", commands);
  });

  chrome.commands.onCommand.addListener((command) => {
    console.log(`Command: ${command}`);
    if (command === "open-side-panel") {
      chrome.windows.getCurrent({ populate: true }, (win) => {
        if (win.id) {
          chrome.sidePanel.open({ windowId: win.id });
        }
      });
    } else if (command === "open-tab-next-to-current") {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTab = tabs[0];
        // if (currentTab && currentTab.id && currentTab.index !== undefined) {
        chrome.tabs.create({
          index: currentTab.index + 1,
        });
        // }
      });
    }
  });

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    // dispatch to appropriate handler based on action
    for (const handler of messageHandlers) {
      const handled = handler(message, sendResponse, crxApp);
      if (handled) {
        return true;
      }
    }
  });

  chrome.scripting.registerContentScripts([
    {
      id: "policy-script",
      js: ["src/policy.js"],
      runAt: "document_end",
      matches: ["https://*/*"],
      world: "MAIN",
    },
  ]);
})();
