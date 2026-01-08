import { ZodError } from "zod";
import { fetchTabsMeta } from "./Tabs";
import { services as defaultServices, IServices } from "@/services";

export const formatZodIssues = (error: ZodError) =>
  error.issues
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
};

export const findActiveTabId = async (svc: IServices = defaultServices) => {
  const tabs = await svc.tabs.query({
    active: true,
    currentWindow: true,
  });

  return tabs?.[0]?.id;
};

export type AddToolResultFn = <TOOL extends string>(
  args:
    | {
      state?: "output-available" | undefined;
      tool: TOOL;
      toolCallId: string;
      output: unknown;
      errorText?: undefined;
    }
    | {
      state: "output-error";
      tool: TOOL;
      toolCallId: string;
      output?: undefined;
      errorText: string;
    }
) => Promise<void>;

export const currentcontext = async (svc: IServices = defaultServices) => {
  console.log("fetching current context...");
  const opentabs = await fetchTabsMeta(svc);

  const activetabID = opentabs.find((tab) => tab.active)?.id;

  if (!activetabID) {
    return { activeTabcontent: "", opentabs };
  }
  //TODO : enable fetching active tab content, this disabled temporarily until we figure out a way to reduce token usage  
  // const activetabContent = await svc.tabs
  //   .sendMessage(activetabID, {
  //     action: "get_tab_content_md",
  //     message: `Fetching tab content for tab ID: ${activetabID}`,
  //   })
  //   .then((response) => {
  //     return response.content as string;
  //   });

  return { opentabs };
};
