import type { Tool } from "./types";
import { search_historySchema } from "./definitions";
import { toTimestamp } from "./utils";
import { services as defaultServices, IServices } from "@/services";

const search_history: Tool<typeof search_historySchema> = {
  name: "search_history",
  description:
    "Search the browser history within an optional time range and result limit.",
  inputSchema: search_historySchema,
  execute: async (
    { query = "", maxResults, startTime, endTime },
    services = defaultServices
  ) => {
    const [startTimestamp, endTimestamp] = [
      toTimestamp(startTime),
      toTimestamp(endTime),
    ];

    const historyItems = await services.history.search({
      text: query,
      startTime: startTimestamp,
      endTime: endTimestamp,
      maxResults,
    });

    return JSON.stringify(historyItems);
  },
};

export { search_history };
