import type { CrxApplication } from "playwright-crx";

export type MessageHandler = (
  message: any,
  sendResponse: (response: any) => void,
  crxApp: CrxApplication | null
) => boolean | void;

//we open tabs usng the direct chrome tab api now, i keep this for future reaseach wiht the playwright api
//espiecially for the snapshot feature,and waiting for page loading etc
const handleOpenNewTab: MessageHandler = (message, sendResponse, crxApp) => {
  if (message?.action !== "open-new-tab") return;

  const { url, Withcontent } = message;
  (async () => {
    try {
      if (!crxApp) {
        throw new Error("crxApp is not initialized");
      }
      const page = await crxApp.newPage({ url });
      let snapshot = null;
      if (Withcontent) {
        snapshot = await (page as any)?._snapshotForAI({
          track: "response",
        });
      }
      sendResponse({ success: true, tabId: null, content: snapshot });
    } catch (error) {
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  })();

  return true;
};

const handleGetPageContent: MessageHandler = (
  message,
  sendResponse,
  crxApp
) => {
  if (message?.action !== "get-page-content") return;

  const tabID = message.tabId;
  (async () => {
    try {
      if (!crxApp) {
        throw new Error("crxApp is not initialized");
      }
      const page = await crxApp.attach(tabID);
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
};

const handleGetDomSnapshot: MessageHandler = (
  message,
  sendResponse,
  crxApp
) => {
  if (message?.action !== "get_page_dom_snapshot") return;

  const tabID = message.tabId;
  (async () => {
    try {
      if (!crxApp) {
        throw new Error("crxApp is not initialized");
      }
      const page = await crxApp.attach(tabID);
      const snapshot = await (page as any)?._snapshotForAI({
        track: "response",
      });
      sendResponse({ success: true, _snap: snapshot });
    } catch (error) {
      console.error("Error capturing snapshot:", error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  })();

  return true;
};

export const messageHandlers: MessageHandler[] = [
  handleOpenNewTab,
  handleGetPageContent,
  handleGetDomSnapshot,
];
