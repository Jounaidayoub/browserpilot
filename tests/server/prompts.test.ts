import { describe, expect, it } from "vitest";
import { systemPrompt } from "@/server/lib/prompts";

describe("systemPrompt", () => {
    it("returns default message when context is missing", () => {
        const result = systemPrompt();
        expect(result).toContain("No browser context available.");
        expect(result).toContain("<currentcontext>");
    });

    it("includes active tab and open tabs when provided", () => {
        const result = systemPrompt({
            activetabContent: "Active content",
            opentabs: [{ id: 1, title: "Tab" }],
        });
        expect(result).toContain("Open Tabs:");
        expect(result).toContain("Active Tab Content:");
        expect(result).toContain("Active content");
        expect(result).toContain("\"title\": \"Tab\"");
    });

    it("falls back to raw context when partial", () => {
        const result = systemPrompt({ activetabContent: "Only active" });
        expect(result).toContain("\"activetabContent\": \"Only active\"");
        expect(result).not.toContain("Open Tabs:");
    });
});
