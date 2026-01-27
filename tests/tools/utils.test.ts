/**
 * Tests for pure utility functions in src/tools/utils.ts
 * These require no mocking - they're pure functions
 */

import { describe, it, expect } from "vitest";
import { ZodError, z } from "zod";
import { formatZodIssues, toTimestamp } from "@/tools/utils";

// formatZodIssues Tests

describe("formatZodIssues", () => {
    it("formats a single issue without path", () => {
        const schema = z.string();
        const result = schema.safeParse(123);

        if (!result.success) {
            const formatted = formatZodIssues(result.error);
            // Zod 4 uses "Invalid input" prefix
            expect(formatted).toContain("string");
        }
    });

    it("formats a single issue with path", () => {
        const schema = z.object({
            name: z.string(),
        });
        const result = schema.safeParse({ name: 123 });

        if (!result.success) {
            const formatted = formatZodIssues(result.error);
            expect(formatted).toContain("name:");
            expect(formatted).toContain("string");
        }
    });

    it("formats multiple issues joined by semicolon", () => {
        const schema = z.object({
            name: z.string(),
            age: z.number(),
        });
        const result = schema.safeParse({ name: 123, age: "invalid" });

        if (!result.success) {
            const formatted = formatZodIssues(result.error);
            expect(formatted).toContain("name:");
            expect(formatted).toContain("age:");
            expect(formatted).toContain("; ");
        }
    });

    it("formats nested path correctly", () => {
        const schema = z.object({
            user: z.object({
                profile: z.object({
                    email: z.string().email(),
                }),
            }),
        });
        const result = schema.safeParse({
            user: { profile: { email: "invalid" } },
        });

        if (!result.success) {
            const formatted = formatZodIssues(result.error);
            expect(formatted).toContain("user.profile.email:");
        }
    });
});

// toTimestamp Tests

describe("toTimestamp", () => {
    it("returns undefined for undefined input", () => {
        expect(toTimestamp(undefined)).toBeUndefined();
    });

    it("converts Date object to timestamp", () => {
        const date = new Date("2024-01-15T12:00:00Z");
        const result = toTimestamp(date);
        expect(result).toBe(date.getTime());
    });

    it("converts valid date string to timestamp", () => {
        const dateString = "2024-01-15T12:00:00Z";
        const result = toTimestamp(dateString);
        expect(result).toBe(new Date(dateString).getTime());
    });

    it("converts number to timestamp (passthrough)", () => {
        const timestamp = 1705320000000;
        const result = toTimestamp(timestamp);
        expect(result).toBe(timestamp);
    });

    it("returns undefined for invalid date string", () => {
        const result = toTimestamp("not-a-date");
        expect(result).toBeUndefined();
    });

    it("returns undefined for invalid Date object", () => {
        const invalidDate = new Date("invalid");
        const result = toTimestamp(invalidDate);
        expect(result).toBeUndefined();
    });

    it("handles epoch timestamp correctly", () => {
        const result = toTimestamp(0);
        expect(result).toBe(0);
    });
});
