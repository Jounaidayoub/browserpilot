import { defineTool } from "./defineTool";
import { searchHistoryDef } from "./definitions/history.def";
import { toTimestamp } from "./utils";

export const search_history = defineTool(searchHistoryDef, async ({ query = "", maxResults, startTime, endTime }, services) => {
  const [startTimestamp, endTimestamp] = [toTimestamp(startTime), toTimestamp(endTime)];

  const historyItems = await services.history.search({
    text: query,
    startTime: startTimestamp,
    endTime: endTimestamp,
    maxResults,
  });

  return JSON.stringify(historyItems);
});
