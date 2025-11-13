import { crx, type CrxApplication } from "playwright-crx";
import { captureDomSnapshot } from "./agent";
import { parseEnv } from "util";

// import { executeTool } from "./background/playwrightTools";
(async () => {
  let crxApp: CrxApplication | null = null;
  try {
    crxApp = await crx.start({ slowMo: 150 });
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
    }
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    //the closing is handled in the sidepanel main.tsx

    if (message?.action === "open-sidepanel") {

      chrome.windows.getCurrent({ populate: true }, (win) => {
        if (win.id) {
          chrome.sidePanel.open({ windowId: win.id });
        }
      });
      return true;
    }
  });

  const newtab = async (url: string) => {
    console.log("New tab/page ");
    const page = await crxApp?.newPage({ url: url });
    console.log("we are going back ");
    await page?.goBack();
    // page/
  };
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("got ", message, "from", sender);
    if (message?.action === "open-new-tab") {
      const url = message.url;
      const Withcontent = message.Withcontent;
      console.log("opening new tab for url ", url, " withcontent ", Withcontent);
      // const tabID=message.tabId;

      (async () => {
        try {
          // await newtab(url);
          console.log("New tab/page ");

          // const page = await crxApp?.attach(236435725);
  
          const page = await crxApp!.newPage({ url: url });

          console.log("we are going back ");
          let _snap = null;
          if (Withcontent) {
            _snap = await (page as any)?._snapshotForAI({
              track: "response",
            });
          }
          // crxApp?.pages()

          // });
          // crxApp;
          // await page?.goBack();
          // page/
          sendResponse({ success: true, tabId: null, content: _snap });
        } catch (error) {
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      })();

      //we do this want the sender to receive the respinde cuz if the hander does retunr
      // true(literally not promise.resolve(true)) the sender will get Undefined

      return true;
    }
    if (message?.action === "get-page-content") {
      const tabID = message.tabId;
      (async () => {
        try {
          const page = await crxApp?.attach(tabID);
          const content = await page?.content();

          sendResponse({ success: true, content });
        } catch (error) {
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      })();

      return true;
    }

    if (message?.action === "get_page_dom_snapshot") {
      console.log("getting dom snapshot... of ", message);
      const tabID = message.tabId;
      // const input = message.input;
      (async () => {
        try {
          const page = await crxApp?.attach(tabID);
          // const snapshot = await captureDomSnapshot(input, page!);

          // console.log("snapshot captured ",snapshot, "with input ", input," tabID ", tabID);

          // const _snap=await page?.locator("body").ariaSnapshot();

          let _snap = await (page as any)?._snapshotForAI({
            track: "response",
          });
          console.log("full snapshot: ", _snap);

          // wait for 5 seconds
          // console.log("waiting for 5 seconds...");
          // await new Promise((resolve) => setTimeout(resolve, 5000));
          // console.log("done waiting.");

          // _snap=await (page as any)?._snapshotForAI({ track: 'response' });
          // console.log("incremental snapshot: sss ", _snap);

          sendResponse({ success: true, _snap });
        } catch (error) {
          console.log("error capturing snapshot: ", error);
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      })();

      return true;
    }

    //   if (message?.action === "call-playwright-tool") {
    //     const { toolName, arguments: args } = message;
    //     (async () => {
    //       try {
    //         if (!crxApp) {
    //           throw new Error("crxApp is not initialized");
    //         }
    //         const result = await executeTool(toolName, args || {}, crxApp) ;
    //         sendResponse({ success: true, result });
    //       } catch (error) {
    //         sendResponse({
    //           success: false,
    //           error: error instanceof Error ? error.message : String(error),
    //         });
    //       }
    //     })();

    //     return true;
    //   }
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
