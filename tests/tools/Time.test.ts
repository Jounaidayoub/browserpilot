import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { get_current_time } from "@/tools/Time";

describe("get_current_time tool", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("returns current time in ISO format", async () => {
        const date = new Date("2024-02-14T12:00:00Z");
        vi.setSystemTime(date);

        const result = await get_current_time.execute({});
        expect(result).toBe("2024-02-14T12:00:00.000Z");
    });
});
