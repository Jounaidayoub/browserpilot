/**
 * Service container - provides access to all services
 * 
 * In production: uses Chrome implementations
 * In tests: can be replaced with mocks
 */

import type { IServices } from "./interfaces";
import {
    chromeTabsService,
    chromeTabGroupsService,
    chromeScriptingService,
    chromeMessagingService,
    chromeHistoryService,
} from "./chrome-services";

// Re-export interfaces for convenience
export type {
    ITabsService,
    ITabGroupsService,
    IScriptingService,
    IMessagingService,
    IHistoryService,
    IServices,
} from "./interfaces";

// Re-export Chrome implementations
export {
    chromeTabsService,
    chromeTabGroupsService,
    chromeScriptingService,
    chromeMessagingService,
    chromeHistoryService,
} from "./chrome-services";

// =============================================================================
// Default Service Container (Chrome implementations)
// =============================================================================

export const services: IServices = {
    tabs: chromeTabsService,
    tabGroups: chromeTabGroupsService,
    scripting: chromeScriptingService,
    messaging: chromeMessagingService,
    history: chromeHistoryService,
};

// =============================================================================
// Service Injection Helper
// =============================================================================

/**
 * Creates a custom service container with overrides
 * Useful for testing - override only the services you need to mock
 */
export function createServices(overrides: Partial<IServices> = {}): IServices {
    return {
        ...services,
        ...overrides,
    };
}
