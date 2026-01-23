import { Fragment, memo } from "react";
import { ToolUIPart, UIMessage, UITool } from "ai";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/sources";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { Actions, Action } from "@/components/ai-elements/actions";
import { RefreshCcwIcon, CopyIcon, Wrench } from "lucide-react";
import { ShimmeringText } from "@/components/ui/shimmering-text";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolOutput,
  ToolInput,
} from "@/components/ai-elements/tool";

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

            case part.type.startsWith("tool-") ? part.type : null:
              // console.log("we got a toolcall (rendering !!)", part.type);
              return (
                <>
                  <div className="flex flex-row items-center gap-2">
                  <Wrench className="size-4.5 opacity-60 translate-y-[2px]" />
                  <ShimmeringText
                    key={`${message.id}-${i}`}
                    text={`${(part.type as string)
                      .split("-")[1]
                      .replace(/_/g, " ")
                      .replace(/^\w/, (c) => c.toUpperCase())} `}
                    className="text-base font-bold"
                    repeat={
                      (part as ToolUIPart).state == "output-available"
                        ? false
                        : true
                    }
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
                </>
              );

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
  },
  (prevProps, nextProps) => {
    // Only re-render if this is the most recent message that's streaming
    // or if the message content has actually changed
    const isStreamingMessage = nextProps.isMostRecentMessage && nextProps.status === "streaming";
    const wasStreamingMessage = prevProps.isMostRecentMessage && prevProps.status === "streaming";
    
    // Always re-render if streaming status changed for this message
    if (isStreamingMessage || wasStreamingMessage) {
      return false; // Allow re-render
    }
    
    // Check if isMostRecentMessage status changed (affects reasoning isStreaming prop)
    if (prevProps.isMostRecentMessage !== nextProps.isMostRecentMessage) {
      return false; // Allow re-render
    }
    
    // If this is not a streaming message and the message parts haven't changed, skip re-render
    if (prevProps.message.id === nextProps.message.id) {
      // Compare the actual parts content
      if (prevProps.message.parts.length === nextProps.message.parts.length) {
        const partsEqual = prevProps.message.parts.every((part, i) => {
          const nextPart = nextProps.message.parts[i];
          if (part.type !== nextPart.type) return false;
          
          // Handle different part types
          if (part.type === "text" && nextPart.type === "text") {
            return part.text === nextPart.text;
          } else if (part.type === "reasoning" && nextPart.type === "reasoning") {
            return part.text === nextPart.text;
          } else if (part.type.startsWith("tool-") && nextPart.type.startsWith("tool-")) {
            // For tool parts, compare the state and content
            const toolPart = part as ToolUIPart;
            const nextToolPart = nextPart as ToolUIPart;
            return (
              toolPart.state === nextToolPart.state &&
              JSON.stringify(toolPart.input) === JSON.stringify(nextToolPart.input) &&
              toolPart.output === nextToolPart.output
            );
          }
          
          // For any other part type, assume equal if type matches
          return true;
        });
        
        if (partsEqual && prevProps.error === nextProps.error) {
          return true; // Skip re-render
        }
      }
    }
    
    // Allow re-render for any other case
    return false;
  }
);

ChatMessage.displayName = "ChatMessage";
