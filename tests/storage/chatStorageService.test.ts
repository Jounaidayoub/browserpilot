import { beforeEach, describe, expect, it } from "vitest";
import { ChatStorageService } from "@/lib/storage/chatStorageService";
import type { ChatSession, StorageAdapter } from "@/lib/storage/types";

class MemoryAdapter implements StorageAdapter {
    chats: ChatSession[] = [];

    async saveChat(chat: ChatSession): Promise<void> {
        const existingIndex = this.chats.findIndex((item) => item.id === chat.id);
        if (existingIndex >= 0) {
            this.chats[existingIndex] = chat;
        } else {
            this.chats.push(chat);
        }
    }

    async getChat(chatId: string): Promise<ChatSession | null> {
        return this.chats.find((chat) => chat.id === chatId) ?? null;
    }

    async getAllChats(): Promise<ChatSession[]> {
        return [...this.chats];
    }

    async deleteChat(chatId: string): Promise<void> {
        this.chats = this.chats.filter((chat) => chat.id !== chatId);
    }

    async updateChat(chatId: string, updates: Partial<ChatSession>): Promise<void> {
        const chatIndex = this.chats.findIndex((chat) => chat.id === chatId);
        if (chatIndex < 0) {
            throw new Error(`Chat with id ${chatId} not found`);
        }
        this.chats[chatIndex] = {
            ...this.chats[chatIndex],
            ...updates,
            updatedAt: Date.now(),
        };
    }
}

describe("ChatStorageService", () => {
    let adapter: MemoryAdapter;
    let service: ChatStorageService;

    beforeEach(() => {
        adapter = new MemoryAdapter();
        service = new ChatStorageService(adapter);
    });

    it("generates titles with defaults and truncation", () => {
        expect(service.generateChatTitle()).toBe("New Chat");
        const longMessage = "a".repeat(60);
        expect(service.generateChatTitle(longMessage)).toBe(`${"a".repeat(50)}...`);
    });

    it("creates a chat and persists it", async () => {
        const chat = await service.createChat("Hello there", "demo-model");
        expect(chat.title).toBe("Hello there");
        expect(chat.model).toBe("demo-model");
        expect(chat.id.startsWith("chat_")).toBe(true);
        const stored = await adapter.getChat(chat.id);
        expect(stored).toEqual(chat);
    });

    it("adds first user message and updates title", async () => {
        const chat = await service.createChat();
        await service.addMessage(chat.id, {
            id: "message-1",
            role: "user",
            parts: [{ type: "text", text: "First message" }],
        });
        const stored = await adapter.getChat(chat.id);
        expect(stored?.messages).toHaveLength(1);
        expect(stored?.messages[0].role).toBe("user");
        expect(stored?.title).toBe("First message");
    });

    it("updates messages and derives title from first user message", async () => {
        const chat = await service.createChat();
        await service.updateMessages(chat.id, [
            { id: "assistant-1", role: "assistant", parts: [], timestamp: 1 },
            {
                id: "user-1",
                role: "user",
                parts: [{ type: "text", text: "Updated title" }],
                timestamp: 2,
            },
        ]);
        const stored = await adapter.getChat(chat.id);
        expect(stored?.messages).toHaveLength(2);
        expect(stored?.title).toBe("Updated title");
    });

    it("sorts chats by most recent update", async () => {
        adapter.chats = [
            {
                id: "chat-1",
                title: "Old",
                messages: [],
                createdAt: 1,
                updatedAt: 10,
            },
            {
                id: "chat-2",
                title: "New",
                messages: [],
                createdAt: 2,
                updatedAt: 20,
            },
        ];
        const chats = await service.getAllChats();
        expect(chats[0].id).toBe("chat-2");
        expect(chats[1].id).toBe("chat-1");
    });
});
