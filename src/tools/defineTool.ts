import { z } from "zod";
import { createServices, type IServices } from "@/services";
import type { ToolDefinition } from "./types";

// Full tool with execute function - extends definition with execute method
export interface Tool<TInput extends z.ZodType = z.ZodType> extends ToolDefinition<TInput> {
    execute: (input: z.infer<TInput>, overrides?: Partial<IServices>) => Promise<string>;
}

/**
 * Creates a full Tool from a definition and an execute function.
 * Handles services injection with partial override support for testing.
 */
export function defineTool<TInput extends z.ZodType>(
    definition: ToolDefinition<TInput>,
    execute: (input: z.infer<TInput>, services: IServices) => Promise<string>
): Tool<TInput> {
    return {
        ...definition,
        execute: (input, overrides) => execute(input, createServices(overrides)),
    };
}
