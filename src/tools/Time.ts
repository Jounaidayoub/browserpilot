import { defineTool } from "./defineTool";
import { getCurrentTimeDef } from "./definitions/time.def";

export const get_current_time = defineTool(getCurrentTimeDef, async () => {
  return new Date().toISOString();
});
