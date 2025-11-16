import { emptyInput, Tool } from "./types";

const get_current_time: Tool<typeof emptyInput> = {
  name: "get_current_time",
  description: "Get the current time in ISO 8601 format.",
  inputSchema: emptyInput,
  execute: async () => {
    return new Date().toISOString();
  },
};

export { get_current_time };
