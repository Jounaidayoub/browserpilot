/**
 * Tests for History tool using mock services
 */

import { describe, it, expect, vi } from "vitest";
import {
    createMockServices,
    createMockHistoryService,
    testData,
} from "../mocks/services.mock";
import { search_history } from "@/tools/History";

describe("search_history tool", () => {
    it("searches with default parameters", async () => {
        const mockServices = createMockServices();

        const result = await search_history.execute({}, mockServices);
        expect(JSON.parse(result)).toEqual([]);
        expect(mockServices.history.search).toHaveBeenCalledWith({
            text: "",
            startTime: undefined,
            endTime: undefined,
            maxResults: undefined,
        });
    });

    it("searches with query text", async () => {
        const historyItems = [
            testData.historyItem({ title: "Example", url: "https://example.com" }),
        ];
        const mockServices = createMockServices({
            history: createMockHistoryService({
                search: vi.fn().mockResolvedValue(historyItems),
            }),
        });

        const result = await search_history.execute(
            { query: "example" },
            mockServices
        );
        expect(JSON.parse(result)).toEqual(historyItems);
        expect(mockServices.history.search).toHaveBeenCalledWith(
            expect.objectContaining({ text: "example" })
        );
    });

    it("applies maxResults limit", async () => {
        const mockServices = createMockServices();

        await search_history.execute({ maxResults: 10 }, mockServices);
        expect(mockServices.history.search).toHaveBeenCalledWith(
            expect.objectContaining({ maxResults: 10 })
        );
    });

    it("converts date strings to timestamps", async () => {
        const mockServices = createMockServices();

        await search_history.execute(
            { startTime: "2024-01-01", endTime: "2024-01-31" },
            mockServices
        );

        const callArgs = (mockServices.history.search as ReturnType<typeof vi.fn>)
            .mock.calls[0][0];
        expect(typeof callArgs.startTime).toBe("number");
        expect(typeof callArgs.endTime).toBe("number");
    });
});
