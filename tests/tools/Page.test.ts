import { describe, it, expect, vi, afterEach } from "vitest";
import {
    createMockServices,
    createMockTabsService,
    createMockScriptingService,
    createMockMessagingService,
    testData,
} from "../mocks/services.mock";
import { fetchTabContent, get_tab_content, injectInspector } from "@/tools/Page";

// Mock dom-to-semantic-markdown
vi.mock("dom-to-semantic-markdown", () => ({
    convertHtmlToMarkdown: vi.fn((html: string) => `Markdown content for: ${html}`),
}));

describe("fetchTabContent", () => {
    it("returns markdown content and metadata", async () => {
        const mockServices = createMockServices({
            scripting: createMockScriptingService({
                executeScript: vi.fn().mockResolvedValue([{ result: "<html><body><h1>Title</h1></body></html>" }]),
            }),
            tabs: createMockTabsService({
                get: vi.fn().mockResolvedValue(testData.tab({ title: "Page Title", url: "https://example.com" })),
            }),
        });

        const result = await fetchTabContent(1, mockServices);

        expect(mockServices.scripting.executeScript).toHaveBeenCalledWith({
            target: { tabId: 1 },
            func: expect.any(Function),
        });
        expect(mockServices.tabs.get).toHaveBeenCalledWith(1);
        expect(result).toEqual({
            markdown: "Markdown content for: <html><body><h1>Title</h1></body></html>",
            meta: {
                title: "Page Title",
                url: "https://example.com",
                text: "Markdown content for: <html><body><h1>Title</h1></body></html>",
            },
        });
    });

    it("handles script execution failure", async () => {
        const mockServices = createMockServices({
            scripting: createMockScriptingService({
                executeScript: vi.fn().mockResolvedValue([]), // No result
            }),
        });

        const result = await fetchTabContent(1, mockServices);
        expect(result).toBeNull();
    });

    it("handles unexpected errors", async () => {
        const mockServices = createMockServices({
            scripting: createMockScriptingService({
                executeScript: vi.fn().mockRejectedValue(new Error("Script error")),
            }),
        });

        const result = await fetchTabContent(1, mockServices);
        expect(result).toBeNull();
    });
});

describe("get_tab_content tool", () => {
    it("returns JSON stringified content", async () => {
        const mockServices = createMockServices({
            scripting: createMockScriptingService({
                executeScript: vi.fn().mockResolvedValue([{ result: "<html></html>" }]),
            }),
            tabs: createMockTabsService({
                get: vi.fn().mockResolvedValue(testData.tab()),
            }),
        });

        const result = await get_tab_content.execute({ tabId: 1 }, mockServices);
        const parsed = JSON.parse(result);

        expect(parsed.textContent).toContain("Markdown content");
        expect(parsed.title).toBe("Test Tab");
        expect(parsed.url).toBe("https://example.com");
    });
});

describe("injectInspector", () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it("injects inspector and waits for selection", async () => {
        const mockServices = createMockServices({
            tabs: createMockTabsService({
                query: vi.fn().mockResolvedValue([testData.tab({ id: 123 })]),
            }),
            messaging: createMockMessagingService(),
        });

        const inspectorPromise = injectInspector(mockServices);

        // Wait a tick for the listener to be registered
        await new Promise(resolve => setTimeout(resolve, 0));

        const listeners = (mockServices.messaging.onMessage as any)._listeners;
        expect(listeners.length).toBeGreaterThan(0);

        // Trigger the listener
        listeners[0]({ type: "ELEMENT_INSPECTOR_RESULT", elementHTML: "<div>Selected</div>" });

        const result = await inspectorPromise;
        expect(result).toBe("<div>Selected</div>");

        expect(mockServices.scripting.executeScript).toHaveBeenCalledWith({
            target: { tabId: 123 },
            func: expect.any(Function),
        });
    });

    it("rejects if no active tab", async () => {
        const mockServices = createMockServices({
            tabs: createMockTabsService({
                query: vi.fn().mockResolvedValue([]),
            }),
        });

        await expect(injectInspector(mockServices)).rejects.toThrow("No active tab found");
    });

    it("rejects on timeout", async () => {
         vi.useFakeTimers();
         const mockServices = createMockServices({
            tabs: createMockTabsService({
                query: vi.fn().mockResolvedValue([testData.tab({ id: 123 })]),
            }),
        });

        const inspectorPromise = injectInspector(mockServices);

        // Wait for async operations (tabs.query, executeScript) to complete
        // and allow the setTimeout to be scheduled
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();

        vi.advanceTimersByTime(30000);

        await expect(inspectorPromise).rejects.toThrow("Inspector timeout");
    });
});
