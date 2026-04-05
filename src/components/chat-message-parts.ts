import {
  isStaticToolUIPart,
  isToolUIPart,
  type UIMessage,
} from "ai";

export type ChatMessagePart = UIMessage["parts"][number];
export type ToolLikePart = Extract<
  ChatMessagePart,
  { type: `tool-${string}` | "dynamic-tool" }
>;

export type GroupedToolEntry = {
  part: ToolLikePart;
  index: number;
  step: number;
};

export type GroupedToolsSegment = {
  type: "grouped-tools";
  startIndex: number;
  endIndex: number;
  entries: GroupedToolEntry[];
};

export type SinglePartSegment = {
  type: "part";
  index: number;
  part: ChatMessagePart;
};

export type ChatMessageSegment = GroupedToolsSegment | SinglePartSegment;

export type GroupedToolState = "active" | "complete" | "error";

export const isStepStartPart = (
  part: ChatMessagePart
): part is Extract<ChatMessagePart, { type: "step-start" }> =>
  part.type === "step-start";

export const isStaticToolPart = (
  part: ChatMessagePart
): part is Extract<ChatMessagePart, { type: `tool-${string}` }> =>
  isStaticToolUIPart(part);

export const isDynamicToolPart = (
  part: ChatMessagePart
): part is Extract<ChatMessagePart, { type: "dynamic-tool" }> =>
  part.type === "dynamic-tool";

export const isToolPart = (part: ChatMessagePart): part is ToolLikePart =>
  isToolUIPart(part);

export const getToolNameFromPart = (part: ToolLikePart) =>
  isDynamicToolPart(part)
    ? part.toolName
    : (part.type as string).split("-").slice(1).join("-");

export const formatToolName = (toolName: string) =>
  toolName.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

export const deriveGroupedToolState = (
  entries: GroupedToolEntry[]
): GroupedToolState => {
  if (entries.some((entry) => entry.part.state === "output-error")) {
    return "error";
  }

  if (entries.every((entry) => entry.part.state === "output-available")) {
    return "complete";
  }

  return "active";
};

export const groupMessageParts = (
  parts: UIMessage["parts"]
): ChatMessageSegment[] => {
  const segments: ChatMessageSegment[] = [];
  let index = 0;

  while (index < parts.length) {
    const currentPart = parts[index];

    if (!isToolPart(currentPart)) {
      segments.push({ type: "part", index, part: currentPart });
      index += 1;
      continue;
    }

    const entries: GroupedToolEntry[] = [];
    const startIndex = index;
    let endIndex = index;
    let step = 0;

    while (index < parts.length) {
      const part = parts[index];

      if (isToolPart(part)) {
        entries.push({ part, index, step });
        endIndex = index;
        index += 1;
        continue;
      }

      if (isStepStartPart(part) && index + 1 < parts.length) {
        const nextPart = parts[index + 1];
        if (isToolPart(nextPart)) {
          step += 1;
          index += 1;
          continue;
        }
      }

      break;
    }

    segments.push({
      type: "grouped-tools",
      startIndex,
      endIndex,
      entries,
    });
  }

  return segments;
};
