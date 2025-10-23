"use client";

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
import { Fragment, useEffect, useRef, useState } from "react";
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
  const { messages, sendMessage, status, regenerate, addToolResult } = useChat({
    transport: new DefaultChatTransport({
      api: "http://localhost:8080/",
    }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    async onToolCall({ toolCall }) {
      console.log("tool calls (cline side)", toolCall);
      if (toolCall.dynamic) {
        return;
      }
      switch (toolCall.toolName) {
        case "get_tabs":
          const tabs = await chrome.tabs.query({});

          const tabs_meta = tabs.map((tab) => ({
            id: tab.id,
            title: tab.title,
            url: tab.url,
            groupid: tab.groupId,
            index: tab.index,
            windowid: tab.windowId,
          }));

          addToolResult({
            tool: "get_tabs",
            toolCallId: toolCall.toolCallId,
            output: JSON.stringify(tabs_meta),
          });

          console.log("tabs", tabs_meta);

          break;

        case "group_tabs_by_ids":
          const args: any = toolCall.input;
          const groups = args.groups;
          console.log("grouping tabs by idees", groups);
          if (!Array.isArray(groups)) {
            console.error("Expected groups to be an array, got:", groups);
            break;
          }

          groups.forEach(async (group) => {
            console.log("grouping", group);
            const { tabIds, title, color } = group;
            const groupid = await chrome.tabs.group({ tabIds: tabIds });
            console.log("created group", groupid);
            await chrome.tabGroups.update(groupid, {
              title: title,
              color: color,
            });
            console.log(
              `Grouped tabs ${tabIds} into group ${groupid} with title "${title}" and color "${color}"`
            );
          });
          addToolResult({
            tool: "group_tabs_by_ids",
            toolCallId: toolCall.toolCallId,
            output: `Grouped ${groups.length} groups successfully.`,
          });
          break;

        case "close_tabs":
          const close_args: any = toolCall.input;
          const tabIdsToClose = close_args.tabIds;
          console.log("closing tabs", tabIdsToClose);
          if (!Array.isArray(tabIdsToClose)) {
            console.error(
              "Expected tabIds to be an array, got:",
              tabIdsToClose
            );
            break;
          }
          // await chrome.tabs.remove(tabIdsToClose);
          chrome.tabs.query({}, () => {
            chrome.tabs.remove(tabIdsToClose);
          });
          addToolResult({
            tool: "close_tabs",
            toolCallId: toolCall.toolCallId,
            output: `Closed tabs with IDs: ${tabIdsToClose.join(", ")}`,
          });
          break;

        default:
          break;
      }
    },
  });
  useEffect(() => {
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
    <div className="max-w-4xl mx-auto p-6 relative size-full h-screen">
      <div className="flex flex-col h-full">
        <Conversation className="h-full">
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
                            <MessageContent>
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
                      return (<>

                      
                        {/* TODO : this needs better types handleling , `as` everywhere */}
                        <Tool defaultOpen={false}>
                          <ToolHeader type={`tool-${(part.type as string).split("-")[1]}`} state={(part as ToolUIPart).state } />
                          <ToolContent>
                            <ToolInput input={(part as ToolUIPart).input} />
                            <ToolOutput
                              output={
                                <>
                                  <Response>{(part as ToolUIPart).output as string}</Response>
                                </>
                              }
                              errorText={(part as ToolUIPart).errorText}
                            />
                          </ToolContent>
                        </Tool>
                      </>);

                    
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
              </div>
            ))}
            {status === "submitted" && <Loader />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <PromptInput
          onSubmit={handleSubmit}
          className="mt-4"
          globalDrop
          multiple
        >
          <PromptInputBody>
            <PromptInputAttachments>
              {(attachment) => <PromptInputAttachment data={attachment} />}
            </PromptInputAttachments>
            <PromptInputTextarea
              onChange={(e) => setInput(e.target.value)}
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
              <PromptInputButton
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
              </PromptInputModelSelect>
            </PromptInputTools>
            <PromptInputSubmit disabled={!input && !status} status={status} />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </div>
  );
};

export default ChatBotDemo;
