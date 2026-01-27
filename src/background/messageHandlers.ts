export type MessageHandler = (
  message: any,
  sendResponse: (response: any) => void
) => boolean | void;

// All handlers that depended on playwright-crx (handleOpenNewTab, handleGetPageContent,
// handleGetDomSnapshot) have been removed as part of MVP cleanup.
// Add new handlers here that use native Chrome APIs.

export const messageHandlers: MessageHandler[] = [];
