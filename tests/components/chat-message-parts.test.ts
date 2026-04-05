import { describe, expect, it } from "vitest";
import type { UIMessage } from "ai";
import {
  deriveGroupedToolState,
  groupMessageParts,
} from "@/components/chat-message-parts";

const textPart = (text: string) => ({ type: "text", text });

const reasoningPart = (text: string) => ({ type: "reasoning", text });

const staticToolPart = (
  name: string,
  state: "input-available" | "output-available" | "output-error"
) =>
  ({
    type: `tool-${name}`,
    toolCallId: `${name}-id`,
    state,
    input: { name },
    ...(state === "output-available" ? { output: { ok: true } } : {}),
    ...(state === "output-error" ? { errorText: "failed" } : {}),
  }) as UIMessage["parts"][number];

const dynamicToolPart = (
  toolName: string,
  state: "input-available" | "output-available" | "output-error"
) =>
  ({
    type: "dynamic-tool",
    toolName,
    toolCallId: `${toolName}-id`,
    state,
    input: { toolName },
    ...(state === "output-available" ? { output: { ok: true } } : {}),
    ...(state === "output-error" ? { errorText: "failed" } : {}),
  }) as UIMessage["parts"][number];

const stepStartPart = () => ({ type: "step-start" }) as UIMessage["parts"][number];

describe("groupMessageParts", () => {
  it("groups consecutive tool parts into one block", () => {
    const parts = [
      textPart("hello"),
      staticToolPart("get_tabs", "input-available"),
      dynamicToolPart("search_history", "output-available"),
      reasoningPart("done"),
    ] as UIMessage["parts"];

    const segments = groupMessageParts(parts);
    const toolSegments = segments.filter(
      (segment) => segment.type === "grouped-tools"
    );

    expect(toolSegments).toHaveLength(1);
    expect(toolSegments[0].entries).toHaveLength(2);
    expect(toolSegments[0].entries.map((entry) => entry.index)).toEqual([1, 2]);
  });

  it("creates separate blocks for non-consecutive tool parts", () => {
    const parts = [
      staticToolPart("get_tabs", "input-available"),
      textPart("separator"),
      dynamicToolPart("search_history", "output-available"),
    ] as UIMessage["parts"];

    const segments = groupMessageParts(parts);
    const toolSegments = segments.filter(
      (segment) => segment.type === "grouped-tools"
    );

    expect(toolSegments).toHaveLength(2);
    expect(toolSegments[0].entries).toHaveLength(1);
    expect(toolSegments[1].entries).toHaveLength(1);
  });

  it("uses step-start as subgroup boundaries inside one tool block", () => {
    const parts = [
      staticToolPart("get_tabs", "input-available"),
      stepStartPart(),
      dynamicToolPart("search_history", "input-available"),
      staticToolPart("get_groups", "output-available"),
    ] as UIMessage["parts"];

    const segments = groupMessageParts(parts);
    const toolSegment = segments.find(
      (segment) => segment.type === "grouped-tools"
    );

    expect(toolSegment).toBeDefined();
    if (toolSegment?.type === "grouped-tools") {
      expect(toolSegment.entries.map((entry) => entry.step)).toEqual([0, 1, 1]);
    }
  });

  it("preserves mixed text, reasoning, and grouped tool ordering", () => {
    const parts = [
      textPart("intro"),
      staticToolPart("get_tabs", "input-available"),
      staticToolPart("get_groups", "output-available"),
      reasoningPart("thinking"),
      dynamicToolPart("search_history", "output-available"),
    ] as UIMessage["parts"];

    const segments = groupMessageParts(parts);
    expect(segments.map((segment) => segment.type)).toEqual([
      "part",
      "grouped-tools",
      "part",
      "grouped-tools",
    ]);
  });
});

describe("deriveGroupedToolState", () => {
  it("returns error when any tool has output-error", () => {
    const segments = groupMessageParts([
      staticToolPart("get_tabs", "output-available"),
      dynamicToolPart("search_history", "output-error"),
    ] as UIMessage["parts"]);

    const group = segments.find((segment) => segment.type === "grouped-tools");
    expect(group?.type).toBe("grouped-tools");
    if (group?.type === "grouped-tools") {
      expect(deriveGroupedToolState(group.entries)).toBe("error");
    }
  });

  it("returns complete when all tools are output-available", () => {
    const segments = groupMessageParts([
      staticToolPart("get_tabs", "output-available"),
      dynamicToolPart("search_history", "output-available"),
    ] as UIMessage["parts"]);

    const group = segments.find((segment) => segment.type === "grouped-tools");
    expect(group?.type).toBe("grouped-tools");
    if (group?.type === "grouped-tools") {
      expect(deriveGroupedToolState(group.entries)).toBe("complete");
    }
  });

  it("returns active when tools are still in progress", () => {
    const segments = groupMessageParts([
      staticToolPart("get_tabs", "input-available"),
      dynamicToolPart("search_history", "output-available"),
    ] as UIMessage["parts"]);

    const group = segments.find((segment) => segment.type === "grouped-tools");
    expect(group?.type).toBe("grouped-tools");
    if (group?.type === "grouped-tools") {
      expect(deriveGroupedToolState(group.entries)).toBe("active");
    }
  });
});
