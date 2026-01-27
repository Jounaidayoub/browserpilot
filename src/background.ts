import { messageHandlers } from "./background/messageHandlers";

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
      chrome.tabs.create({
        index: currentTab.index + 1,
      });
    });
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  // dispatch to appropriate handler based on action
  for (const handler of messageHandlers) {
    const handled = handler(message, sendResponse);
    if (handled) {
      return true;
    }
  }
});
