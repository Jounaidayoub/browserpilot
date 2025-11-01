import { crx ,type CrxApplication} from "playwright-crx";
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

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    //the closing is handled in the sidepanel main.tsx

    if (message?.action === "open-sidepanel") {
      chrome.tabs.create({ active: false });
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
      // const tabID=message.tabId;

      (async () => {
        try {
          // await newtab(url);
          console.log("New tab/page ");
          
          // const page = await crxApp?.attach(236435725);
          const page = await crxApp!.newPage({ url: url ,pinned:true});
          console.log("we are going back ");
          await page?.goBack();
          // page/
          sendResponse({ success: true, tabId: null });
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
