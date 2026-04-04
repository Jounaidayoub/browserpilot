import { ZodError } from "zod";
import type { ChatAddToolOutputFunction, UIMessage } from "ai";
import { services as defaultServices, type IServices } from "@/services";

export const formatZodIssues = (error: ZodError) =>
  error.issues
    .map((issue) => {
      const path = issue.path.join(".");
      return path ? `${path}: ${issue.message}` : issue.message;
    })
    .join("; ");

export const toTimestamp = (value: string | number | Date | undefined) => {
  if (value === undefined) return undefined;
  if (value instanceof Date) {
    const ts = value.getTime();
    return Number.isFinite(ts) ? ts : undefined;
  }
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : undefined;
};

export const findActiveTabId = async (svc: IServices) => {
  const tabs = await svc.tabs.query({ active: true, currentWindow: true });
  return tabs?.[0]?.id;
};

export type AddToolResultFn = ChatAddToolOutputFunction<UIMessage>;

// Inline tab fetching to avoid circular dependency with Tabs.ts
const fetchTabsMetaInternal = async (svc: IServices) => {
  const tabs = await svc.tabs.query({ lastFocusedWindow: true });
  return tabs.map((tab) => ({
    active: tab.active,
    id: tab.id,
    title: tab.title,
    url: tab.url,
    groupid: tab.groupId,
    index: tab.index,
    windowid: tab.windowId,
  }));
};

export const currentcontext = async (svc: IServices = defaultServices) => {
  console.log("fetching current context...");
  const opentabs = await fetchTabsMetaInternal(svc);

  const activetabID = opentabs.find((tab) => tab.active)?.id;

  if (!activetabID) {
    return { activeTabcontent: "", opentabs };
  }

  return { opentabs };
};
