import { randomUUID } from "node:crypto";
import { db } from "../db/index.ts";
import { userProviderKeys, oauthFlows } from "../db/schema.ts";
import { eq, and, desc, type InferSelectModel, type InferInsertModel } from "drizzle-orm";

export type ProviderId = "default" | "openrouter";
export type OAuthFlowStatus = "pending" | "completed" | "error";

// Infer types from Drizzle schema
export type OAuthFlow = InferSelectModel<typeof oauthFlows>;
export type InsertOAuthFlow = InferInsertModel<typeof oauthFlows>;

export type UserProviderKey = InferSelectModel<typeof userProviderKeys>;
export type InsertUserProviderKey = InferInsertModel<typeof userProviderKeys>;

const FLOW_TTL_MS = 10 * 60 * 1000;

export function dbNow(): number {
    return Date.now();
}

export async function createOAuthFlow(userId: string, provider: ProviderId): Promise<OAuthFlow> {
    const now = dbNow();
    const flow: InsertOAuthFlow = {
        state: randomUUID(),
        userId,
        provider,
        status: "pending",
        error: null,
        createdAt: now,
        expiresAt: now + FLOW_TTL_MS,
    };

    await db.insert(oauthFlows).values(flow);

    // Fetch and return the actual row from the database
    const inserted = await db
        .select()
        .from(oauthFlows)
        .where(eq(oauthFlows.state, flow.state))
        .get();

    if (!inserted) {
        throw new Error("Failed to create OAuth flow");
    }

    return inserted;
}

export async function getOAuthFlow(state: string): Promise<OAuthFlow | null> {
    const row = await db
        .select()
        .from(oauthFlows)
        .where(eq(oauthFlows.state, state))
        .get();
    
    return row ?? null;
}

export async function updateOAuthFlowStatus(
    state: string,
    status: OAuthFlowStatus,
    error: string | null
): Promise<void> {
    await db.update(oauthFlows)
        .set({ status, error })
        .where(eq(oauthFlows.state, state));
}

export async function upsertUserProviderKey(
    userId: string,
    provider: ProviderId,
    apiKey: string
): Promise<void> {
    const now = dbNow();
    const id = randomUUID();
    
    await db.insert(userProviderKeys)
        .values({
            id,
            userId,
            provider,
            apiKey,
            createdAt: now,
            updatedAt: now,
        })
        .onConflictDoUpdate({
            target: [userProviderKeys.userId, userProviderKeys.provider],
            set: {
                apiKey,
                updatedAt: now,
            },
        });
}

export async function getUserProviderKey(
    userId: string,
    provider: ProviderId
): Promise<UserProviderKey | null> {
    const row = await db
        .select()
        .from(userProviderKeys)
        .where(
            and(
                eq(userProviderKeys.userId, userId),
                eq(userProviderKeys.provider, provider)
            )
        )
        .get();
    
    return row ?? null;
}

export async function getLatestOAuthFlowForUser(
    userId: string,
    provider: ProviderId
): Promise<OAuthFlow | null> {
    const row = await db
        .select()
        .from(oauthFlows)
        .where(
            and(
                eq(oauthFlows.userId, userId),
                eq(oauthFlows.provider, provider)
            )
        )
        .orderBy(desc(oauthFlows.createdAt))
        .limit(1)
        .get();
    
    return row ?? null;
}
