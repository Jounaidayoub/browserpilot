import { ChatSession, StorageAdapter } from "./types";

/**
 * LocalStorage implementation of the StorageAdapter
 * Stores chat sessions in browser's localStorage
 */
export class LocalStorageAdapter implements StorageAdapter {
  private readonly STORAGE_KEY = "chat_sessions";

  private getAllChatsFromStorage(): ChatSession[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      return [];
    }
  }

  private saveAllChatsToStorage(chats: ChatSession[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(chats));
    } catch (error) {
      console.error("Error writing to localStorage:", error);
      throw new Error("Failed to save chats to storage");
    }
  }

  async saveChat(chat: ChatSession): Promise<void> {
    const chats = this.getAllChatsFromStorage();
    const existingIndex = chats.findIndex((c) => c.id === chat.id);

    if (existingIndex >= 0) {
      chats[existingIndex] = chat;
    } else {
      chats.push(chat); // Add new chats to the end
    }

    this.saveAllChatsToStorage(chats);
  }

  async getChat(chatId: string): Promise<ChatSession | null> {
    const chats = this.getAllChatsFromStorage();
    return chats.find((c) => c.id === chatId) || null;
  }

  async getAllChats(): Promise<ChatSession[]> {
    return this.getAllChatsFromStorage();
  }

  async deleteChat(chatId: string): Promise<void> {
    const chats = this.getAllChatsFromStorage();
    const filteredChats = chats.filter((c) => c.id !== chatId);
    this.saveAllChatsToStorage(filteredChats);
  }

  async updateChat(
    chatId: string,
    updates: Partial<ChatSession>
  ): Promise<void> {
    const chats = this.getAllChatsFromStorage();
    const chatIndex = chats.findIndex((c) => c.id === chatId);

    if (chatIndex >= 0) {
      chats[chatIndex] = {
        ...chats[chatIndex],
        ...updates,
        updatedAt: Date.now(),
      };
      this.saveAllChatsToStorage(chats);
    } else {
      throw new Error(`Chat with id ${chatId} not found`);
    }
  }
}
