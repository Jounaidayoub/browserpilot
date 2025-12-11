import { ChatSession, StorageAdapter } from "./types";
import { LocalStorageAdapter } from "./localStorageAdapter";

/**
 * Main storage service that provides an abstraction over different storage adapters.
 * This allows easy switching between localStorage, IndexedDB, or remote storage in the future.
 */
export class ChatStorageService {
  private adapter: StorageAdapter;

  constructor(adapter?: StorageAdapter) {
    // TODO : add remote storage for users , fallback to localstorage apply synciying 
    
    this.adapter = adapter || new LocalStorageAdapter();
  }

  /**
   * Generate a unique ID for chat sessions
   */
  generateChatId(): string {
    return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate a title from the first user message
   */
  generateChatTitle(firstMessage?: string): string {
    if (!firstMessage) return "New Chat";

    const maxLength = 50;
    const title = firstMessage.trim();
    return title.length > maxLength
      ? title.substring(0, maxLength) + "..."
      : title;
  }

  /**
   * Create a new chat session
   */
  async createChat(
    firstMessage?: string,
    model?: string
  ): Promise<ChatSession> {
    const chat: ChatSession = {
      id: this.generateChatId(),
      title: this.generateChatTitle(firstMessage),
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model,
    };

    await this.adapter.saveChat(chat);
    return chat;
  }

  /**
   * Save a chat session
   */
  async saveChat(chat: ChatSession): Promise<void> {
    return this.adapter.saveChat(chat);
  }

  /**
   * Get a specific chat session
   */
  async getChat(chatId: string): Promise<ChatSession | null> {
    return this.adapter.getChat(chatId);
  }

  /**
   * Get all chat sessions sorted by most recent
   */
  async getAllChats(): Promise<ChatSession[]> {
    const chats = await this.adapter.getAllChats();
    return chats.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  /**
   * Delete a chat session
   */
  async deleteChat(chatId: string): Promise<void> {
    return this.adapter.deleteChat(chatId);
  }

  /**
   * Update a chat session
   */
  async updateChat(
    chatId: string,
    updates: Partial<ChatSession>
  ): Promise<void> {
    return this.adapter.updateChat(chatId, updates);
  }

  /**
   * Add a message to a chat session
   */
  async addMessage(chatId: string, message: any): Promise<void> {
    const chat = await this.getChat(chatId);
    if (!chat) {
      throw new Error(`Chat with id ${chatId} not found`);
    }

    const chatMessage = {
      id: message.id,
      role: message.role,
      parts: message.parts || [],
      timestamp: Date.now(),
    };

    chat.messages.push(chatMessage);
    chat.updatedAt = Date.now();

    // Update title if this is the first user message
    if (
      chat.messages.length === 1 &&
      message.role === "user" &&
      message.parts?.[0]?.text
    ) {
      chat.title = this.generateChatTitle(message.parts[0].text);
    }

    await this.saveChat(chat);
  }

  /**
   * Update messages in a chat session
   */
  async updateMessages(chatId: string, messages: any[]): Promise<void> {
    const chat = await this.getChat(chatId);
    if (!chat) {
      throw new Error(`Chat with id ${chatId} not found`);
    }

    chat.messages = messages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      parts: msg.parts || [],
      timestamp: msg.timestamp || Date.now(),
    }));
    chat.updatedAt = Date.now();

    // Update title if there's a first user message
    const firstUserMessage = messages.find((m) => m.role === "user");
    if (firstUserMessage?.parts?.[0]?.text) {
      chat.title = this.generateChatTitle(firstUserMessage.parts[0].text);
    }

    await this.saveChat(chat);
  }

  /**
   * Change the storage adapter (for switching storage backends)
   */
  setAdapter(adapter: StorageAdapter): void {
    this.adapter = adapter;
  }
}

// Export a singleton instance
export const chatStorage = new ChatStorageService();
