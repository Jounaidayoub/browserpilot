// Tool definitions index - Re-export all definitions
// NO browser dependencies - safe for server imports

export * from "./tabs.def";
export * from "./page.def";
export * from "./scripting.def";
export * from "./history.def";
export * from "./time.def";

import { getGroupsDef, getTabsDef, closeTabsDef, groupTabsByIdsDef, openNewTabDef } from "./tabs.def";
import { getTabContentDef, getPageContentDef, getPageDomSnapshotDef } from "./page.def";
import { runScriptDef } from "./scripting.def";
import { searchHistoryDef } from "./history.def";
import { getCurrentTimeDef } from "./time.def";

import type { ToolDefinition } from "../types";

// All tool definitions array - server uses this
export const toolDefinitions: ToolDefinition[] = [
    getGroupsDef,
    getTabsDef,
    closeTabsDef,
    groupTabsByIdsDef,
    openNewTabDef,
    getTabContentDef,
    getPageContentDef,
    getPageDomSnapshotDef,
    runScriptDef,
    searchHistoryDef,
    getCurrentTimeDef,
] as ToolDefinition[];
