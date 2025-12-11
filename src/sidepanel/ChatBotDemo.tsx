import { UIMessage } from "ai";
// import { get_tabs, get_tab_content } from "@/sidepanel/evaluator";
import { injectInspector } from "@/tools/Page";
import { evaluateToolCall } from "@/sidepanel/evaluator";
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
import { ShimmeringText } from "@/components/ui/shimmering-text";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuItem,
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
  // usePromptInputAttachments
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
  Inspect,
  Menu,
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
import { chatStorage, ChatSession } from "@/lib/storage";
import { ChatSidebar } from "@/components/ChatSidebar";
import { findSourceMap } from "module";
import useInspector from "@/hooks/useInspector";
import { includes } from "zod";

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
  // const [isInspecting, setIsInspecting] = useState(false);
  const { isInspecting, inspect } = useInspector();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const promptInput = useRef<HTMLTextAreaElement>(null);
  const currentChatIdRef = useRef<string | null>(null);
  const onFinishCallback = useCallback(
    async ({ messages: finishedMessages }: { messages: UIMessage[] }) => {
      console.log("On finished triggered !!!!!!!!!");
      console.log(
        "currentChatId ",
        currentChatIdRef.current,
        "Finished messages ",
        finishedMessages
      );
      if (currentChatIdRef.current && finishedMessages.length > 0) {
        console.log("we reached here !!!");
        await chatStorage.updateMessages(
          currentChatIdRef.current,
          finishedMessages
        );
        // Reload chat sessions to update the list
        const chats = await chatStorage.getAllChats();
        setChatSessions(chats);
      }
    },
    []
  );
  // const attachements = usePromptInputAttachments();
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
    setMessages,
  } = useChat({
    transport: new DefaultChatTransport({
      api: "http://localhost:8080/",
    }),

    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    async onToolCall({ toolCall  }) {
      console.log("tool calls (cline side)", toolCall);
      if (toolCall.dynamic) {
        return;
      }
      evaluateToolCall(toolCall, addToolResult);
    },

    onFinish: onFinishCallback,
  });

  useEffect(() => {
    console.log("useeffect is runing now ......");
    if (currentChatId !== null) {
      console.log("currentChatId has been updated to:", currentChatId);
      // You can perform other actions here that depend on the new currentChatId
    } else {
      console.log("the currend id is not defined");
    }
    // Load chat sessions on mount
    const loadChats = async () => {
      const chats = await chatStorage.getAllChats();
      setChatSessions(chats);
    };
    loadChats();

    console.log("focusing input , component mounted");
    if (promptInput.current) {
      promptInput.current.focus();
    }
  }, []);

  const handleSubmit = async (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }

    // Create a new chat if none exists
    if (!currentChatId) {
      const newChat = await chatStorage.createChat(message.text, model);
      console.log("setting current chat id to ", newChat);
      setCurrentChatId(newChat.id);
      currentChatIdRef.current = newChat.id;
      console.log(currentChatId);
      const chats = await chatStorage.getAllChats();
      setChatSessions(chats);
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

  const handleInspect = async () => {
    const elementHTML = await inspect();
    const inspectPrompt = `\n\nInspected element:\n\`\`\`html\n${elementHTML}\n\`\`\``;
    const newInput = input + inspectPrompt;
    // const blob = new Blob([newInput], { type: 'text/plain;charset=utf-8' }) as File;
    // console.log("craet")
    // attachements.add([file]);
    setInput(newInput);

    // Focus back on the textarea
    if (promptInput.current) {
      promptInput.current.focus();
    }
  };

  const handleNewChat = async () => {
    setMessages([]);
    setCurrentChatId(null);
    currentChatIdRef.current = null;
    setInput("");
    setIsSidebarOpen(false);
    if (promptInput.current) {
      promptInput.current.focus();
    }
  };

  const handleSelectChat = async (chatId: string) => {
    setIsLoadingChat(true);
    const chat = await chatStorage.getChat(chatId);
    if (chat) {
      setCurrentChatId(chat.id);
      currentChatIdRef.current = chat.id;
      setMessages(chat.messages as UIMessage[]);
      setModel(chat.model || models[0].value);
    }
    setIsSidebarOpen(false);
    setIsLoadingChat(false);
  };

  const handleDeleteChat = async (chatId: string) => {
    await chatStorage.deleteChat(chatId);
    const chats = await chatStorage.getAllChats();
    setChatSessions(chats);

    // If we deleted the current chat, start a new one
    if (chatId === currentChatId) {
      handleNewChat();
    }
  };

  return (
    <>
      <ChatSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        chats={chatSessions}
        currentChatId={currentChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
      />
      <div className="max-w-4xl mx-auto   relative size-full h-screen">
        <div className="flex flex-col p-4 overflow-hidden overflow-y-auto h-full">
          {/* Header with menu button */}
          <div className="flex items-center justify-between mb-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            {currentChatId && (
              <div className="text-sm text-muted-foreground">
                {chatSessions.find((c) => c.id === currentChatId)?.title ||
                  "Current Chat"}
              </div>
            )}
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
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
                            {/* <Tool defaultOpen={false}>
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
                          </Tool> */}
                            <ShimmeringText
                              text={`${(part.type as string)
                                .split("-")[1]
                                .replace("-", " ")} `}
                              className="text-base font-bold"
                              duration={1.5}
                              repeatDelay={1}
                            />
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

          <PromptInput onSubmit={handleSubmit} className="" globalDrop multiple>
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
                    {/* <PromptInputActionMenuItem onClick={handleInspect} disabled={isInspecting}>
                  </PromptInputActionMenuItem> */}
                  </PromptInputActionMenuContent>
                </PromptInputActionMenu>
                <PromptInputButton
                  onClick={handleInspect}
                  disabled={isInspecting}
                  size={"icon-sm"}
                >
                  <Inspect className=" size-4" />
                  {/* {isInspecting ? "Inspecting..." : "Inspect element"} */}
                </PromptInputButton>
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
    </>
  );
};

export default ChatBotDemo;
