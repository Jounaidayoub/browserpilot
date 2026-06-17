import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import { defineTool } from "@/tools/defineTool";
import { createMockTabsService } from "../mocks/services.mock";

describe("defineTool", () => {
    it("creates a tool with execute method", async () => {
        const inputSchema = z.object({ value: z.string() });
        const definition = {
            name: "test_tool",
            description: "A test tool",
            inputSchema,
        };

        const executeMock = vi.fn().mockResolvedValue("success");

        const tool = defineTool(definition, executeMock);

        expect(tool.name).toBe("test_tool");
        expect(tool.execute).toBeDefined();

        const result = await tool.execute({ value: "test" });
        expect(result).toBe("success");
        expect(executeMock).toHaveBeenCalledWith(
            { value: "test" },
            expect.anything() // services
        );
    });

    it("injects services", async () => {
        const inputSchema = z.object({});
        const definition = {
            name: "service_tool",
            description: "Tool utilizing services",
            inputSchema,
        };

        const executeMock = vi.fn().mockImplementation(async (_input, services) => {
             return services.tabs ? "has tabs" : "no tabs";
        });

        const tool = defineTool(definition, executeMock);

        // Note: Default services use chrome.* APIs which are not available in node environment
        // unless mocked globally or if createServices handles it safely.
        // However, defineTool uses createServices which imports chrome-services which uses global 'chrome'.
        // In the test environment, 'globals: true' in vitest config might not expose 'chrome'.
        // We should check if 'chrome' is defined.

        // If chrome is undefined, accessing services.tabs might throw if it tries to access chrome.tabs immediately.
        // But the service objects are defined as object literals: { query: ... }.
        // The implementation access chrome.tabs inside the methods.
        // So services.tabs exists.

        const result = await tool.execute({});
        expect(result).toBe("has tabs");
    });

    it("allows service overrides", async () => {
        const inputSchema = z.object({});
        const definition = {
            name: "override_tool",
            description: "Tool with overridden services",
            inputSchema,
        };

        const executeMock = vi.fn().mockImplementation(async (_input, services) => {
             const tabs = await services.tabs.query();
             return `tabs: ${tabs.length}`;
        });

        const tool = defineTool(definition, executeMock);

        // Override tabs service to return 5 tabs
        const mockTabs = createMockTabsService({
            query: vi.fn().mockResolvedValue(new Array(5).fill({})),
        });

        const result = await tool.execute({}, { tabs: mockTabs });
        expect(result).toBe("tabs: 5");
    });
});
