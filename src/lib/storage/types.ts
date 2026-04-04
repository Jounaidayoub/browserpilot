// Storage types for chat persistence
export interface ChatMessage {//usez the ai-skd UIMessage type
  id: string;
  role: "user" | "assistant";
  parts: MessagePart[];
  timestamp: number;
}

export interface MessagePart {
  type: string;
  text?: string;
  url?: string;
  [key: string]: any;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  model?: string;
  providerId?: string;
}

export interface StorageAdapter {
  saveChat(chat: ChatSession): Promise<void>;
  getChat(chatId: string): Promise<ChatSession | null>;
  getAllChats(): Promise<ChatSession[]>;
  deleteChat(chatId: string): Promise<void>;
  updateChat(chatId: string, updates: Partial<ChatSession>): Promise<void>;
}
