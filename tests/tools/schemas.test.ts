/**
 * Tests for Zod schema validation in tools
 * Validates that input schemas correctly accept/reject data
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";

// We'll import schemas once they're exported, for now define inline
// This pattern shows how to test schema validation

// =============================================================================
// Tabs Schema Tests
// =============================================================================

describe("Tabs Input Schemas", () => {
    const close_tabsType = z.object({
        tabIds: z.array(z.number()),
    });

    describe("close_tabs schema", () => {
        it("accepts valid array of tab IDs", () => {
            const result = close_tabsType.safeParse({ tabIds: [1, 2, 3] });
            expect(result.success).toBe(true);
        });

        it("accepts empty array", () => {
            const result = close_tabsType.safeParse({ tabIds: [] });
            expect(result.success).toBe(true);
        });

        it("rejects non-array tabIds", () => {
            const result = close_tabsType.safeParse({ tabIds: 123 });
            expect(result.success).toBe(false);
        });

        it("rejects string IDs in array", () => {
            const result = close_tabsType.safeParse({ tabIds: ["1", "2"] });
            expect(result.success).toBe(false);
        });

        it("rejects missing tabIds", () => {
            const result = close_tabsType.safeParse({});
            expect(result.success).toBe(false);
        });
    });

    const group_tabs_by_idsInput = z.object({
        groups: z.array(
            z.object({
                tabIds: z.array(z.number()),
                color: z
                    .enum([
                        "blue",
                        "cyan",
                        "green",
                        "grey",
                        "orange",
                        "pink",
                        "purple",
                        "red",
                        "yellow",
                    ])
                    .optional(),
                title: z.string(),
            })
        ),
    });

    describe("group_tabs_by_ids schema", () => {
        it("accepts valid group configuration", () => {
            const result = group_tabs_by_idsInput.safeParse({
                groups: [{ tabIds: [1, 2], color: "blue", title: "Work" }],
            });
            expect(result.success).toBe(true);
        });

        it("accepts group without color (optional)", () => {
            const result = group_tabs_by_idsInput.safeParse({
                groups: [{ tabIds: [1], title: "No Color" }],
            });
            expect(result.success).toBe(true);
        });

        it("rejects invalid color", () => {
            const result = group_tabs_by_idsInput.safeParse({
                groups: [{ tabIds: [1], color: "invalid-color", title: "Test" }],
            });
            expect(result.success).toBe(false);
        });

        it("rejects missing title", () => {
            const result = group_tabs_by_idsInput.safeParse({
                groups: [{ tabIds: [1], color: "blue" }],
            });
            expect(result.success).toBe(false);
        });
    });

    const open_new_tabInput = z.object({
        url: z.string().min(1, "URL is required"),
        Withcontent: z.boolean().optional(),
    });

    describe("open_new_tab schema", () => {
        it("accepts valid URL", () => {
            const result = open_new_tabInput.safeParse({
                url: "https://example.com",
            });
            expect(result.success).toBe(true);
        });

        it("accepts URL with Withcontent flag", () => {
            const result = open_new_tabInput.safeParse({
                url: "https://example.com",
                Withcontent: true,
            });
            expect(result.success).toBe(true);
        });

        it("rejects empty URL", () => {
            const result = open_new_tabInput.safeParse({ url: "" });
            expect(result.success).toBe(false);
        });

        it("rejects missing URL", () => {
            const result = open_new_tabInput.safeParse({});
            expect(result.success).toBe(false);
        });
    });
});

// =============================================================================
// History Schema Tests
// =============================================================================

describe("History Input Schemas", () => {
    const search_historyInput = z.object({
        query: z.string().optional(),
        maxResults: z.number().int().positive().optional(),
        startTime: z.union([z.string(), z.number(), z.date()]).optional(),
        endTime: z.union([z.string(), z.number(), z.date()]).optional(),
    });

    describe("search_history schema", () => {
        it("accepts empty object (all optional)", () => {
            const result = search_historyInput.safeParse({});
            expect(result.success).toBe(true);
        });

        it("accepts full configuration", () => {
            const result = search_historyInput.safeParse({
                query: "example",
                maxResults: 10,
                startTime: "2024-01-01",
                endTime: Date.now(),
            });
            expect(result.success).toBe(true);
        });

        it("rejects negative maxResults", () => {
            const result = search_historyInput.safeParse({ maxResults: -5 });
            expect(result.success).toBe(false);
        });

        it("rejects non-integer maxResults", () => {
            const result = search_historyInput.safeParse({ maxResults: 5.5 });
            expect(result.success).toBe(false);
        });
    });
});

// =============================================================================
// Scripting Schema Tests
// =============================================================================

describe("Scripting Input Schemas", () => {
    const run_scriptInput = z.object({
        code: z.string().min(1, "Code is required"),
        tabId: z.number().optional(),
    });

    describe("run_script schema", () => {
        it("accepts code without tabId", () => {
            const result = run_scriptInput.safeParse({
                code: "console.log('hello')",
            });
            expect(result.success).toBe(true);
        });

        it("accepts code with tabId", () => {
            const result = run_scriptInput.safeParse({
                code: "console.log('hello')",
                tabId: 123,
            });
            expect(result.success).toBe(true);
        });

        it("rejects empty code", () => {
            const result = run_scriptInput.safeParse({ code: "" });
            expect(result.success).toBe(false);
        });

        it("rejects missing code", () => {
            const result = run_scriptInput.safeParse({ tabId: 123 });
            expect(result.success).toBe(false);
        });
    });
});
