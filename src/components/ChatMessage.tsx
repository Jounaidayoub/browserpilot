import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
} from "@/components/ai-elements/chain-of-thought";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { Response } from "@/components/ai-elements/response";
import {
  deriveGroupedToolState,
  formatToolName,
  getToolNameFromPart,
  groupMessageParts,
} from "@/components/chat-message-parts";
import { ShimmeringText } from "@/components/ui/shimmering-text";
import { UIMessage } from "ai";
import {
  Clock,
  FileText,
  Globe,
  History,
  Layers,
  LayoutGrid,
  PlusSquare,
  Sparkles,
  XCircle,
} from "lucide-react";
import { memo, useMemo, useState } from "react";

const getToolIcon = (toolName: string) => {
  switch (toolName) {
    case "get_groups":
      return LayoutGrid;
    case "get_tabs":
      return Globe;
    case "close_tabs":
      return XCircle;
    case "group_tabs_by_ids":
      return Layers;
    case "open_new_tab":
      return PlusSquare;
    case "get_tab_content":
      return FileText;
    case "search_history":
      return History;
    case "get_current_time":
      return Clock;
    default:
      return Sparkles;
  }
};

interface ChatMessageProps {
  message: UIMessage;
  // messages: UIMessage[];
  isMostRecentMessage: boolean;
  status: string;
  regenerate: () => void;
  error: Error | undefined;
}

export const ChatMessage = memo(
  ({
    message,
    isMostRecentMessage,
    status,
    error,
  }: ChatMessageProps) => {
    const [toolGroupOpenState, setToolGroupOpenState] = useState<
      Record<string, boolean>
    >({});
    const isStreamingMostRecent =
      String(status) === "streaming" && isMostRecentMessage;
    const segments = useMemo(() => groupMessageParts(message.parts), [message.parts]);

    const getToolGroupOpen = (groupKey: string) =>
      toolGroupOpenState[groupKey] ?? isStreamingMostRecent;

    const setToolGroupOpen = (groupKey: string, open: boolean) => {
      setToolGroupOpenState((current) => ({ ...current, [groupKey]: open }));
    };

    const getEntryStepStatus = (state: string) => {
      switch (state) {
        case "output-available":
          return "complete" as const;
        case "output-error":
          return "pending" as const;
        default:
          return "active" as const;
      }
    };

    return (
      <div key={message.id}>
        {segments.map((segment) => {
          if (segment.type === "grouped-tools") {
            const groupKey = `${message.id}-tool-group-${segment.startIndex}`;
            const isOpen = getToolGroupOpen(groupKey);
            const groupedState = deriveGroupedToolState(segment.entries);
            const headerStatus =
              groupedState === "complete"
                ? "Completed"
                : groupedState === "error"
                ? "Error"
                : "Running";

            return (
              <ChainOfThought
                key={groupKey}
                className="my-2 rounded-md border p-3"
                open={isOpen}
                onOpenChange={(open) => setToolGroupOpen(groupKey, open)}
              >
                <ChainOfThoughtHeader>
                  {segment.entries.length} tool call
                  {segment.entries.length > 1 ? "s" : ""} - {headerStatus}
                </ChainOfThoughtHeader>
                <ChainOfThoughtContent className="space-y-2">
                  {segment.entries.map((entry, entryIndex) => {
                    const toolName = getToolNameFromPart(entry.part);
                    const Icon = getToolIcon(toolName);
                    const formattedName = formatToolName(toolName);
                    const isProcessing = entry.part.state !== "output-available";
                    const showStepDivider =
                      entryIndex > 0 &&
                      segment.entries[entryIndex - 1].step !== entry.step;

                    return (
                      <div key={`${message.id}-${entry.index}`} className="space-y-2">
                        {showStepDivider && (
                          <div className="border-b pb-1 text-muted-foreground text-xs">
                            Step {entry.step + 1}
                          </div>
                        )}
                        <ChainOfThoughtStep
                          icon={Icon}
                          label={formattedName}
                          status={getEntryStepStatus(entry.part.state)}
                        >
                          <ShimmeringText
                            text={formattedName}
                            className="text-sm font-medium text-foreground/80"
                            repeat={isProcessing}
                          />
                        </ChainOfThoughtStep>
                      </div>
                    );
                  })}
                </ChainOfThoughtContent>
              </ChainOfThought>
            );
          }

          const part = segment.part;

          switch (part.type) {
            case "text":
              return (
                <div key={`${message.id}-${segment.index}`}>
                  <Message from={message.role}>
                    <MessageContent variant={"flat"}>
                      <Response>{part.text}</Response>
                    </MessageContent>
                  </Message>
                  {/* {message.role === "assistant" && i === messages.length - 1 && (
                  <Actions className="mt-2">
                    <Action onClick={() => regenerate()} label="Retry">
                      <RefreshCcwIcon className="size-3" />
                    </Action>
                    <Action
                      onClick={() => navigator.clipboard.writeText(part.text)}
                      label="Copy"
                    >
                      <CopyIcon className="size-3" />
                    </Action>
                  </Actions>
                )} */}
                </div>
              );

            case "reasoning":
              return (
                <Reasoning
                  key={`${message.id}-${segment.index}`}
                  className="w-full"
                  isStreaming={
                    String(status) === "streaming" &&
                    segment.index === message.parts.length - 1 &&
                    isMostRecentMessage
                  }
                >
                  <ReasoningTrigger />
                  <ReasoningContent>{part.text}</ReasoningContent>
                </Reasoning>
              );

            default:
              return null;
          }
        })}
        {error && (
          <Message from="assistant">
            <MessageContent>
              <Response className="text-red-500">
                {error.message ||
                  "An unexpected error occurred. Please try again."}
              </Response>
            </MessageContent>
          </Message>
        )}
      </div>
    );
  }
);
