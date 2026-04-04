/**
 * ChatView — the pure layout component for the chat UI.
 *
 * All state and logic comes from useChatAgent(). This component
 * only handles rendering and wiring props to child UI components.
 */

import { useChatAgent } from "@/features/chat/context/ChatAgentContext";
import {
  Conversation,
  ConversationContent,
} from "@/components/ai-elements/conversation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatSidebar } from "@/components/ChatSidebar";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatPromptInput } from "@/components/ChatPromptInput";
import { Loader } from "@/components/ai-elements/loader";

const ChatView = () => {
  const {
    messages,
    status,
    error,
    submit,
    stop,
    regenerate,
    currentChatId,
    chatSessions,
    newChat,
    selectChat,
    deleteChat,
    model,
    setModel,
    availableModels,
    input,
    setInput,
    webSearch,
    setWebSearch,
    isSidebarOpen,
    setIsSidebarOpen,
  } = useChatAgent();

  return (
    <>
      <ChatSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        chats={chatSessions}
        currentChatId={currentChatId}
        onSelectChat={selectChat}
        onNewChat={newChat}
        onDeleteChat={deleteChat}
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
            handleSubmit={submit}
            status={status}
            stop={stop}
            webSearch={webSearch}
            setWebSearch={setWebSearch}
            model={model}
            setModel={setModel}
            models={availableModels}
          />
        </div>
      </div>
    </>
  );
};

export default ChatView;
