"use client";

import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";
import { get_tabs, get_tab_content } from "@/sidepanel/tools";
import { evaluateToolCall } from "@/sidepanel/tools";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolOutput,
  ToolInput,
} from "@/components/ai-elements/tool";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputButton,
  type PromptInputMessage,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { Action, Actions } from "@/components/ai-elements/actions";
import { Fragment, useEffect, useRef, useState, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { Response } from "@/components/ai-elements/response";
import {
  Beaker,
  CopyIcon,
  GlobeIcon,
  RefreshCcwIcon,
  Upload,
} from "lucide-react";
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
import { Loader } from "@/components/ai-elements/loader";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
  // Tool,
  ToolUIPart,
} from "ai";
import { CodeBlock } from "@/components/ai-elements/code-block";
import { Button } from "@/components/ui/button";

const models = [
  {
    name: "GPT 4o",
    value: "openai/gpt-4o",
  },
  {
    name: "Deepseek R1",
    value: "deepseek/deepseek-r1",
  },
];

const ChatBotDemo = () => {
  const [input, setInput] = useState("");
  const [model, setModel] = useState<string>(models[0].value);
  const [webSearch, setWebSearch] = useState(false);
  const promptInput = useRef<HTMLTextAreaElement>(null);
  // const { isAtBottom, scrollToBottom } = useStickToBottomContext();
  // const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  // const handleScrollToBottom = useCallback(() => {
  //   scrollToBottom();
  // }, [scrollToBottom]);

  const {
    messages,
    sendMessage,
    status,
    regenerate,
    addToolResult,
    stop,
    error,
  } = useChat({
    transport: new DefaultChatTransport({
      api: "http://localhost:8080/",
    }),

    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    async onToolCall({ toolCall }) {
      console.log("tool calls (cline side)", toolCall);
      if (toolCall.dynamic) {
        return;
      }
      evaluateToolCall(toolCall, addToolResult);
    },
  });

  useEffect(() => {
    //

    console.log("focusing input , component mounted");
    if (promptInput.current) {
      promptInput.current.focus();
    }
  }, []);

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }
    // handleScrollToBottom();
    sendMessage(
      {
        text: message.text || "Sent with attachments",
        files: message.files,
      },
      {
        body: {
          model: model,
          webSearch: webSearch,
        },
      }
    );
    setInput("");
  };

  return (
    <div className="max-w-4xl mx-auto   relative size-full h-screen">
      <div className="flex flex-col p-4 overflow-hidden overflow-y-auto h-full">
        <Conversation className="h-full ">
          <ConversationContent>
            {messages.map((message) => (
              <div key={message.id}>
                {message.role === "assistant" &&
                  message.parts.filter((part) => part.type === "source-url")
                    .length > 0 && (
                    <Sources>
                      <SourcesTrigger
                        count={
                          message.parts.filter(
                            (part) => part.type === "source-url"
                          ).length
                        }
                      />
                      {message.parts
                        .filter((part) => part.type === "source-url")
                        .map((part, i) => (
                          <SourcesContent key={`${message.id}-${i}`}>
                            <Source
                              key={`${message.id}-${i}`}
                              href={part.url}
                              title={part.url}
                            />
                          </SourcesContent>
                        ))}
                    </Sources>
                  )}
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
                          {message.role === "assistant" &&
                            i === messages.length - 1 && (
                              <Actions className="mt-2">
                                <Action
                                  onClick={() => regenerate()}
                                  label="Retry"
                                >
                                  <RefreshCcwIcon className="size-3" />
                                </Action>
                                <Action
                                  onClick={() =>
                                    navigator.clipboard.writeText(part.text)
                                  }
                                  label="Copy"
                                >
                                  <CopyIcon className="size-3" />
                                </Action>
                              </Actions>
                            )}
                        </Fragment>
                      );
                    case part.type.startsWith("tool-") ? part.type : null:
                      return (
                        <>
                          {/* TODO : this needs better types handleling , `as` everywhere */}
                          <Tool defaultOpen={false}>
                            <ToolHeader
                              type={`tool-${
                                (part.type as string).split("-")[1]
                              }`}
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
                          </Tool>
                        </>
                      );

                    case "reasoning":
                      return (
                        <Reasoning
                          key={`${message.id}-${i}`}
                          className="w-full"
                          isStreaming={
                            status === "streaming" &&
                            i === message.parts.length - 1 &&
                            message.id === messages[messages.length - 1]?.id
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
            ))}
            {status === "submitted" && <Loader />}
          </ConversationContent>

          {/* <ConversationScrollButton  /> */}
        </Conversation>

        <PromptInput
          onSubmit={handleSubmit}
          className=""
          globalDrop
          multiple
        >
          <PromptInputBody>
            <PromptInputAttachments>
              {(attachment) => <PromptInputAttachment data={attachment} />}
            </PromptInputAttachments>

            {/* <Button onClick={() => get_tab_content(236433212)}>get tab content</Button> */}
            <PromptInputTextarea
              onChange={(e) => {
                setInput(e.target.value);
              }}
              value={input}
              autoFocus
              ref={promptInput}
            />
          </PromptInputBody>
          <PromptInputToolbar>
            <PromptInputTools>
              <PromptInputActionMenu>
                <PromptInputActionMenuTrigger />
                <PromptInputActionMenuContent>
                  <PromptInputActionAddAttachments />
                </PromptInputActionMenuContent>
              </PromptInputActionMenu>
              {/*<PromptInputButton
                variant={webSearch ? "default" : "ghost"}
                onClick={() => setWebSearch(!webSearch)}
              >
                <GlobeIcon size={16} />
                <span>Search</span>
              </PromptInputButton>
              <PromptInputModelSelect
                onValueChange={(value) => {
                  setModel(value);
                }}
                value={model}
              >
                <PromptInputModelSelectTrigger>
                  <PromptInputModelSelectValue />
                </PromptInputModelSelectTrigger>
                <PromptInputModelSelectContent>
                  {models.map((model) => (
                    <PromptInputModelSelectItem
                      key={model.value}
                      value={model.value}
                    >
                      {model.name}
                    </PromptInputModelSelectItem>
                  ))}
                </PromptInputModelSelectContent>
              </PromptInputModelSelect>*/}
            </PromptInputTools>
            <PromptInputSubmit
              disabled={!input && !status}
              status={status}
              onClick={stop}
            />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </div>
  );
};

export default ChatBotDemo;
