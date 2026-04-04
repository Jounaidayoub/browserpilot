import { Action, Actions } from "@/components/ai-elements/actions";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { Response } from "@/components/ai-elements/response";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import { ShimmeringText } from "@/components/ui/shimmering-text";
import { UIMessage, type ToolUIPart } from "ai";
import {
  Clock,
  CopyIcon,
  FileText,
  Globe,
  History,
  Layers,
  LayoutGrid,
  PlusSquare,
  RefreshCcwIcon,
  Sparkles,
  Wrench,
  XCircle,
} from "lucide-react";
import { Fragment, memo } from "react";

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
    regenerate,
    error,
  }: ChatMessageProps) => {
    return (
      <div key={message.id}>
        {message.parts.map((part, i) => {
          switch (part.type) {
            case "text":
              return (
                <Fragment key={`${message.id}-${i}`}>
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
                </Fragment>
              );

            case part.type.startsWith("tool-") ? part.type : null: {
              const toolName = (part.type as string).split("-")[1];
              const Icon = getToolIcon(toolName);
              const formattedName = toolName
                .replace(/_/g, " ")
                .replace(/^\w/, (c) => c.toUpperCase());
              const isProcessing = (part as ToolUIPart).state !== "output-available";

              return (
                <div key={`${message.id}-${i}`} className="my-2">
                  <div className="flex flex-row items-center gap-3">
                    <div className="flex items-center justify-center size-8 rounded-lg bg-muted/50">
                      <Icon className="size-4 opacity-70" />
                    </div>
                    <ShimmeringText
                      text={formattedName}
                      className="text-sm font-medium text-foreground/80"
                      repeat={isProcessing}
                    />
                  </div>
                  
                  {/* TODO : this needs better types handleling , `as` everywhere */}
                  {/* this an alernameive toolcall rendeirng method , for debguuge but mostly i want use hte simple one above
                with shimmmer text effect */}
                  {/* <Tool defaultOpen={false}>
                  <ToolHeader
                    type={`tool-${(part.type as string).split("-")[1]}`}
                    state={(part as ToolUIPart).state}
                  />
                  <ToolContent>
                    <ToolInput input={(part as ToolUIPart).input} />
                    <ToolOutput
                      output={
                        <>
                          <Response>
                            {(part as ToolUIPart).output as string}
                          </Response>
                        </>
                      }
                      errorText={(part as ToolUIPart).errorText}
                    />
                  </ToolContent>
                </Tool> */}
                </div>
              );
            }
            
            case "dynamic-tool": {
              const toolName = part.toolName;
              const Icon = getToolIcon(toolName);
              const formattedName = toolName
                .replace(/_/g, " ")
                .replace(/^\w/, (c) => c.toUpperCase());
              const isProcessing = part.state !== "output-available";

              return (
                <div key={`${message.id}-${i}`} className="my-2">
                  <div className="flex flex-row items-center gap-3">
                    <div className="flex items-center justify-center size-8 rounded-lg bg-muted/50">
                      <Icon className="size-4 opacity-70" />
                    </div>
                    <ShimmeringText
                      text={formattedName}
                      className="text-sm font-medium text-foreground/80"
                      repeat={isProcessing}
                    />
                  </div>
                  
                  {/* TODO : this needs better types handleling , `as` everywhere */}
                  {/* this an alernameive toolcall rendeirng method , for debguuge but mostly i want use hte simple one above
                with shimmmer text effect */}
                  {/* <Tool defaultOpen={false}>
                  <ToolHeader
                    type={`tool-${(part.type as string).split("-")[1]}`}
                    state={(part as ToolUIPart).state}
                  />
                  <ToolContent>
                    <ToolInput input={(part as ToolUIPart).input} />
                    <ToolOutput
                      output={
                        <>
                          <Response>
                            {(part as ToolUIPart).output as string}
                          </Response>
                        </>
                      }
                      errorText={(part as ToolUIPart).errorText}
                    />
                  </ToolContent>
                </Tool> */}
                </div>
              );
            }

            case "reasoning":
              return (
                <Reasoning
                  key={`${message.id}-${i}`}
                  className="w-full"
                  isStreaming={
                    String(status) === "streaming" &&
                    i === message.parts.length - 1 &&
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
