chrome.runtime.onInstalled.addListener(() => {
  if (chrome.sidePanel?.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    //the closing is handled in the sidepanel main.tsx


  if (message?.action === 'open-sidepanel') {
    chrome.tabs.create({active:false});
    chrome.windows.getCurrent({ populate: true }, (win) => {
      if (win.id) {
        chrome.sidePanel.open({ windowId: win.id  });
        
      }
    });
    return true;
}
});



chrome.scripting.registerContentScripts([
  
    { id: "policy-script",
      js: ["src/policy.js"],
      runAt: "document_end",
      matches: ["https://*/*"],
      world: "MAIN",
    }
  ,
]);