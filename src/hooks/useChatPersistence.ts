import { useEffect, useState } from "react";
import { chatStorage, type ChatSession } from "@/lib/storage";

export function useChatPersistence() {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadChats = async () => {
    setIsLoading(true);
    try {
      const c = await chatStorage.getAllChats();
      setChats(c);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadChats();
  }, []);

  const createChat = async (title: string, model?: string) => {
    const newChat = await chatStorage.createChat(title, model);
    await loadChats();
    return newChat;
  };

  const selectChat = async (chatId: string) => {
    const chat = await chatStorage.getChat(chatId);
    return chat;
  };

  const deleteChat = async (chatId: string) => {
    await chatStorage.deleteChat(chatId);
    await loadChats();
  };

  const updateMessages = async (chatId: string, messages: any[]) => {
    await chatStorage.updateMessages(chatId, messages);
    await loadChats();
  };

  return {
    chats,
    isLoading,
    loadChats,
    createChat,
    selectChat,
    deleteChat,
    updateMessages,
  } as const;
}

export default useChatPersistence;
