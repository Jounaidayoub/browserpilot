import { ZodError } from "zod";


export const formatZodIssues = (error: ZodError) => error.issues
  .map((issue) => {
    const path = issue.path.join(".");
    return path ? `${path}: ${issue.message}` : issue.message;
  })
  .join("; ");
export const toTimestamp = (value: string | number | Date | undefined) => {
  if (value === undefined) {
    return undefined;
  }

  if (value instanceof Date) {
    const ts = value.getTime();
    return Number.isFinite(ts) ? ts : undefined;
  }

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : undefined;
};export const findActiveTabId = async () => {
  const tabs = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  return tabs?.[0]?.id;
};

