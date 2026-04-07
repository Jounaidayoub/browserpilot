import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { Response } from "@/components/ai-elements/response";
import { ShimmeringText } from "@/components/ui/shimmering-text";
import { UIMessage, type ToolUIPart } from "ai";
import {
  Camera,
  Clock,
  Code2,
  CornerDownRight,
  ExternalLink,
  FileText,
  FileUp,
  Globe,
  History,
  Keyboard,
  Layers,
  LayoutGrid,
  List,
  Maximize2,
  MousePointer2,
  Navigation,
  PlusSquare,
  Sparkles,
  Terminal,
  TimerIcon,
  Type,
  UnfoldVertical,
  XCircle,
} from "lucide-react";
import { Fragment, memo } from "react";

const normalizeToolName = (toolName: string) =>
  toolName
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim();

const getToolIcon = (toolName: string) => {
  switch (toolName) {
    case "get_groups":
      return LayoutGrid;
    case "get_tabs":
      return Globe;
    case "close_tabs":
    case "close_page":
      return XCircle;
    case "group_tabs_by_ids":
      return Layers;
    case "open_new_tab":
    case "new_page":
      return PlusSquare;
    case "get_tab_content":
    case "take_snapshot":
      return FileText;
    case "search_history":
      return History;
    case "get_current_time":
      return Clock;
    case "click":
      return MousePointer2;
    case "hover":
      return Navigation;
    case "type_text":
      return Type;
    case "press_key":
      return Keyboard;
    case "fill":
    case "fill_form":
      return CornerDownRight;
    case "navigate_page":
      return ExternalLink;
    case "list_pages":
      return List;
    case "select_page":
      return Maximize2;
    case "wait_for":
      return TimerIcon;
    case "take_screenshot":
      return Camera;
    case "upload_file":
      return FileUp;
    case "evaluate_script":
      return Code2;
    case "list_console_messages":
    case "get_console_message":
      return Terminal;
    case "drag":
      return UnfoldVertical;
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
              const rawToolName = (part.type as string).split("-")[1] ?? "";
              const toolName = normalizeToolName(rawToolName);
              const Icon = getToolIcon(toolName);
              const formattedName = toolName
                .replace(/_/g, " ")
                .replace(/^\w/, (c) => c.toUpperCase());
              const isProcessing = (part as ToolUIPart).state !== "output-available";

              return (
                <div key={`${message.id}-${i}`} className="py-3">
                  <div className="flex w-full items-center gap-3">
                      <Icon className="size-4 opacity-70" />
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
              const toolName = normalizeToolName(part.toolName);
              const Icon = getToolIcon(toolName);
              const formattedName = toolName
                .replace(/_/g, " ")
                .replace(/^\w/, (c) => c.toUpperCase());
              const isProcessing = part.state !== "output-available";

              return (
                <div key={`${message.id}-${i}`} className="py-3">
                  <div className="flex w-full items-center gap-3">
                    <Icon className="size-4 opacity-70" />
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
          <Message from="assistant" className="my-2">
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
