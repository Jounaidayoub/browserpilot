/**
 * Tests for Tabs tools using mock services
 * Demonstrates that tools can now be tested without Chrome APIs
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    createMockServices,
    createMockTabsService,
    createMockTabGroupsService,
    testData,
} from "../mocks/services.mock";
import {
    fetchTabGroups,
    fetchTabsMeta,
    get_groups,
    get_tabs,
    close_tabs,
    group_tabs_by_ids,
    open_new_tab,
} from "@/tools/Tabs";

// fetchTabGroups Tests

describe("fetchTabGroups", () => {
    it("returns empty array when no groups exist", async () => {
        const mockServices = createMockServices();
        const result = await fetchTabGroups(mockServices);
        expect(result).toEqual([]);
    });

    it("returns groups from service", async () => {
        const groups = [
            testData.tabGroup({ id: 1, title: "Work" }),
            testData.tabGroup({ id: 2, title: "Personal" }),
        ];
        const mockServices = createMockServices({
            tabGroups: createMockTabGroupsService({
                query: vi.fn().mockResolvedValue(groups),
            }),
        });

        const result = await fetchTabGroups(mockServices);
        expect(result).toEqual(groups);
        expect(mockServices.tabGroups.query).toHaveBeenCalledWith({});
    });
});

// fetchTabsMeta Tests

describe("fetchTabsMeta", () => {
    it("returns empty array when no tabs exist", async () => {
        const mockServices = createMockServices();
        const result = await fetchTabsMeta(mockServices);
        expect(result).toEqual([]);
    });

    it("maps tab properties correctly", async () => {
        const tabs = [
            testData.tab({
                id: 1,
                active: true,
                title: "Test Tab",
                url: "https://example.com",
                groupId: 5,
                index: 0,
                windowId: 1,
            }),
        ];
        const mockServices = createMockServices({
            tabs: createMockTabsService({
                query: vi.fn().mockResolvedValue(tabs),
            }),
        });

        const result = await fetchTabsMeta(mockServices);
        expect(result).toEqual([
            {
                active: true,
                id: 1,
                title: "Test Tab",
                url: "https://example.com",
                groupid: 5,
                index: 0,
                windowid: 1,
            },
        ]);
    });

    it("queries lastFocusedWindow", async () => {
        const mockServices = createMockServices();
        await fetchTabsMeta(mockServices);
        expect(mockServices.tabs.query).toHaveBeenCalledWith({
            lastFocusedWindow: true,
        });
    });
});

// get_groups Tool Tests

describe("get_groups tool", () => {
    it("returns JSON stringified groups", async () => {
        const groups = [testData.tabGroup({ id: 1, title: "Work" })];
        const mockServices = createMockServices({
            tabGroups: createMockTabGroupsService({
                query: vi.fn().mockResolvedValue(groups),
            }),
        });

        const result = await get_groups.execute({}, mockServices);
        expect(JSON.parse(result)).toEqual(groups);
    });
});

// get_tabs Tool Tests

describe("get_tabs tool", () => {
    it("returns JSON stringified tab metadata", async () => {
        const tabs = [testData.tab({ id: 1, title: "Test" })];
        const mockServices = createMockServices({
            tabs: createMockTabsService({
                query: vi.fn().mockResolvedValue(tabs),
            }),
        });

        const result = await get_tabs.execute({}, mockServices);
        const parsed = JSON.parse(result);
        expect(parsed).toHaveLength(1);
        expect(parsed[0].id).toBe(1);
    });
});

// close_tabs Tool Tests

describe("close_tabs tool", () => {
    it("closes specified tabs", async () => {
        const mockServices = createMockServices();

        const result = await close_tabs.execute({ tabIds: [1, 2, 3] }, mockServices);
        expect(mockServices.tabs.remove).toHaveBeenCalledWith([1, 2, 3]);
        expect(result).toContain("1, 2, 3");
    });

    it("handles empty array", async () => {
        const mockServices = createMockServices();

        const result = await close_tabs.execute({ tabIds: [] }, mockServices);
        expect(mockServices.tabs.remove).toHaveBeenCalledWith([]);
        expect(result).toContain("Tabs closed");
    });
});

// group_tabs_by_ids Tool Tests

describe("group_tabs_by_ids tool", () => {
    it("creates groups with correct properties", async () => {
        const mockServices = createMockServices({
            tabs: createMockTabsService({
                group: vi.fn().mockResolvedValue(10),
            }),
        });

        const result = await group_tabs_by_ids.execute(
            {
                groups: [
                    { tabIds: [1, 2], color: "blue", title: "Work" },
                    { tabIds: [3], color: "green", title: "Personal" },
                ],
            },
            mockServices
        );

        expect(mockServices.tabs.group).toHaveBeenCalledTimes(2);
        expect(mockServices.tabGroups.update).toHaveBeenCalledWith(10, {
            title: "Work",
            color: "blue",
        });
        expect(result).toContain("2 groups");
    });

    it("handles groups without color", async () => {
        const mockServices = createMockServices({
            tabs: createMockTabsService({
                group: vi.fn().mockResolvedValue(5),
            }),
        });

        await group_tabs_by_ids.execute(
            {
                groups: [{ tabIds: [1], title: "No Color" }],
            },
            mockServices
        );

        expect(mockServices.tabGroups.update).toHaveBeenCalledWith(5, {
            title: "No Color",
            color: undefined,
        });
    });
});
