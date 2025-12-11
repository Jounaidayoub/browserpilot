import z from "zod";
import type { Tool } from "./types";
import { toTimestamp } from "./utils";

const search_historyInput = z.object({
  query: z.string().optional(),
  maxResults: z.number().int().positive().optional(),
  startTime: z.union([z.string(), z.number(), z.date()]).optional(),
  endTime: z.union([z.string(), z.number(), z.date()]).optional(),
});

const search_history: Tool<typeof search_historyInput> = {
  name: "search_history",
  description:
    "Search the browser history within an optional time range and result limit.",
  inputSchema: search_historyInput,
  execute: async ({ query = "", maxResults, startTime, endTime }) => {
    const [startTimestamp, endTimestamp] = [
      toTimestamp(startTime),
      toTimestamp(endTime),
    ];

    const historyItems = await chrome.history.search({
      text: query,
      startTime: startTimestamp,
      endTime: endTimestamp,
      maxResults,
    });

    return JSON.stringify(historyItems);
  },
};

export { search_history };
