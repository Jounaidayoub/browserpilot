import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
} from "ai";
import { evaluateToolCall } from "@/sidepanel/evaluator";
import {
  Conversation,
  ConversationContent,
} from "@/components/ai-elements/conversation";
import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatSidebar } from "@/components/ChatSidebar";
import { useChatSessions } from "@/hooks/useChatSessions";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatPromptInput } from "@/components/ChatPromptInput";
import { Loader } from "@/components/ai-elements/loader";
import { currentcontext } from "@/tools/utils";

const models = [
  { name: "GPT-4.1", value: "gpt-4.1-2025-04-14" },
  { name: "Grok Code Fast 1", value: "grok-code-fast-1" },
  { name: "GPT-4o", value: "gpt-4o-2024-11-20" },
  { name: "GPT-5 mini", value: "gpt-5-mini" },
];

const ChatBotDemo = () => {
  const [input, setInput] = useState("");
  const [model, setModel] = useState<string>("gpt-4o-2024-11-20");
  const [webSearch, setWebSearch] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const {
    currentChatId,
    chatSessions,
    isLoadingChat,
    saveMessagesToStorage,
    createNewChat,
    selectChat,
    deleteChat,
    clearCurrentChat,
  } = useChatSessions();

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
    async onToolCall({ toolCall }) {
      if (toolCall.dynamic) {
        return;
      }
      evaluateToolCall(toolCall, addToolResult);
    },
    onFinish: saveMessagesToStorage,
  });

  const handleSubmit = async (message: any) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }

    if (!currentChatId) {
      await createNewChat(message.text, model);
    }

    console.debug("Fetching current context before sending message...");
    const currentcontextData = await currentcontext();
    console.debug("Current context fetched:", currentcontextData);

    sendMessage(
      {
        text: message.text || "Sent with attachments",
        files: message.files,
      },
      {
        body: {
          model: model,
          webSearch: webSearch,
          currentcontext: currentcontextData,
        },
      }
    );
    setInput("");
  };

  const handleNewChat = () => {
    clearCurrentChat(setMessages);
    setInput("");
    setIsSidebarOpen(false);
  };

  const handleSelectChat = async (chatId: string) => {
    await selectChat(chatId, setMessages, setModel);
    setIsSidebarOpen(false);
  };

  const handleDeleteChat = async (chatId: string) => {
    await deleteChat(chatId, handleNewChat);
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
      <div className="max-w-4xl mx-auto relative size-full h-screen">
        <div className="flex flex-col p-3 overflow-hidden h-full">
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
            <div className="w-10" />
          </div>
          <Conversation className="h-full ">
            <ConversationContent>
              {messages.map((message) => {
                const isMostRecentMessage =
                  message.id === messages[messages.length - 1]?.id;

                return (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    isMostRecentMessage={isMostRecentMessage}
                    status={status}
                    regenerate={regenerate}
                    error={error}
                  />
                );
              })}
              {status === "submitted" && <Loader />}
            </ConversationContent>
          </Conversation>
          <ChatPromptInput
            input={input}
            setInput={setInput}
            handleSubmit={handleSubmit}
            status={status}
            stop={stop}
            webSearch={webSearch}
            setWebSearch={setWebSearch}
            model={model}
            setModel={setModel}
            models={models}
          />
        </div>
      </div>
    </>
  );
};

export default ChatBotDemo;
