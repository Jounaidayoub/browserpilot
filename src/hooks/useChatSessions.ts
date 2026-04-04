import { useState, useEffect, useCallback, useRef } from "react";
import { chatStorage, ChatSession } from "@/lib/storage";
import { UIMessage } from "ai";

export function useChatSessions() {
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const currentChatIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Load chat sessions on mount
    const loadChats = async () => {
      const chats = await chatStorage.getAllChats();
      setChatSessions(chats);
    };
    loadChats();
  }, []);

  const saveMessagesToStorage = useCallback(
    async ({ messages: finishedMessages }: { messages: UIMessage[] }) => {
      if (currentChatIdRef.current && finishedMessages.length > 0) {
        await chatStorage.updateMessages(
          currentChatIdRef.current,
          finishedMessages
        );
        const chats = await chatStorage.getAllChats();
        setChatSessions(chats);
      }
    },
    []
  );

  const createNewChat = async (initialMessage: string, model: string, providerId: string) => {
    const newChat = await chatStorage.createChat(initialMessage, model, providerId);
    setCurrentChatId(newChat.id);
    currentChatIdRef.current = newChat.id;
    const chats = await chatStorage.getAllChats();
    setChatSessions(chats);
    return newChat;
  };

  const selectChat = async (
    chatId: string,
    setMessages: (messages: UIMessage[]) => void,
    setModel: (option: any) => void,
    availableModels: any[]
  ) => {
    setIsLoadingChat(true);
    const chat = await chatStorage.getChat(chatId);
    if (chat) {
      setCurrentChatId(chat.id);
      currentChatIdRef.current = chat.id;
      setMessages(chat.messages as UIMessage[]);

      // Find the matching model option or fallback
      const found = availableModels.find(
        (m) => m.value === chat.model && m.provider === chat.providerId
      );

      if (found) {
        setModel(found);
      } else if (chat.model) {
        // Fallback for older sessions or partial matches
        const fallback = availableModels.find((m) => m.value === chat.model) || availableModels[0];
        setModel(fallback);
      }
    }
    setIsLoadingChat(false);
  };

  const deleteChat = async (chatId: string, handleNewChat: () => void) => {
    await chatStorage.deleteChat(chatId);
    const chats = await chatStorage.getAllChats();
    setChatSessions(chats);

    if (chatId === currentChatId) {
      handleNewChat();
    }
  };

  const clearCurrentChat = (setMessages: (messages: UIMessage[]) => void) => {
    setMessages([]);
    setCurrentChatId(null);
    currentChatIdRef.current = null;
  };

  return {
    currentChatId,
    chatSessions,
    isLoadingChat,
    saveMessagesToStorage,
    createNewChat,
    selectChat,
    deleteChat,
    clearCurrentChat,
  };
}
