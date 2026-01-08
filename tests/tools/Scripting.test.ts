/**
 * Tests for Scripting tool using mock services
 */

import { describe, it, expect, vi } from "vitest";
import {
    createMockServices,
    createMockTabsService,
    createMockScriptingService,
    createMockMessagingService,
    testData,
} from "../mocks/services.mock";
import { run_script } from "@/tools/Scripting";

describe("run_script tool", () => {
    it("injects script into specified tab", async () => {
        const mockServices = createMockServices();

        const result = await run_script.execute(
            { code: "console.log('test')", tabId: 123 },
            mockServices
        );

        expect(mockServices.scripting.executeScript).toHaveBeenCalledWith(
            expect.objectContaining({
                target: { tabId: 123 },
            })
        );
        expect(result).toContain("123");
    });

    it("finds active tab when tabId not provided", async () => {
        const tabs = [testData.tab({ id: 456, active: true })];
        const mockServices = createMockServices({
            tabs: createMockTabsService({
                query: vi.fn().mockResolvedValue(tabs),
            }),
        });

        const result = await run_script.execute(
            { code: "console.log('test')" },
            mockServices
        );

        expect(mockServices.tabs.query).toHaveBeenCalledWith({
            active: true,
            currentWindow: true,
        });
        expect(mockServices.scripting.executeScript).toHaveBeenCalledWith(
            expect.objectContaining({
                target: { tabId: 456 },
            })
        );
        expect(result).toContain("456");
    });

    it("throws error when no active tab found", async () => {
        const mockServices = createMockServices({
            tabs: createMockTabsService({
                query: vi.fn().mockResolvedValue([]),
            }),
        });

        await expect(
            run_script.execute({ code: "console.log('test')" }, mockServices)
        ).rejects.toThrow("No active tab found");
    });

    it("uses messaging service to get runner URL", async () => {
        const mockServices = createMockServices();

        await run_script.execute(
            { code: "console.log('test')", tabId: 123 },
            mockServices
        );

        expect(mockServices.messaging.getURL).toHaveBeenCalledWith(
            "injector/runner.js"
        );
    });
});
