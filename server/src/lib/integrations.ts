import { randomUUID } from "node:crypto";
import type { Database as DatabaseType } from "better-sqlite3";
import { getDb } from "./db.ts";

export type ProviderId = "default" | "openrouter";
export type OAuthFlowStatus = "pending" | "completed" | "error";

export interface OAuthFlowRow {
    state: string;
    userId: string;
    provider: ProviderId;
    status: OAuthFlowStatus;
    error: string | null;
    createdAt: number;
    expiresAt: number;
}

export interface UserProviderKeyRow {
    id: string;
    userId: string;
    provider: ProviderId;
    apiKey: string;
    createdAt: number;
    updatedAt: number;
}

const FLOW_TTL_MS = 10 * 60 * 1000;

function ensureTables(db: DatabaseType): void {
    db.exec(`
        CREATE TABLE IF NOT EXISTS user_provider_keys (
            id TEXT PRIMARY KEY,
            userId TEXT NOT NULL,
            provider TEXT NOT NULL,
            apiKey TEXT NOT NULL,
            createdAt INTEGER NOT NULL,
            updatedAt INTEGER NOT NULL,
            UNIQUE (userId, provider)
        );
        CREATE TABLE IF NOT EXISTS oauth_flows (
            state TEXT PRIMARY KEY,
            userId TEXT NOT NULL,
            provider TEXT NOT NULL,
            status TEXT NOT NULL,
            error TEXT NULL,
            createdAt INTEGER NOT NULL,
            expiresAt INTEGER NOT NULL
        );
    `);
}

function dbNow(): number {
    return Date.now();
}

function getDbWithSchema(): DatabaseType {
    const db = getDb();
    ensureTables(db);
    return db;
}

export function createOAuthFlow(userId: string, provider: ProviderId): OAuthFlowRow {
    const db = getDbWithSchema();
    const now = dbNow();
    const flow: OAuthFlowRow = {
        state: randomUUID(),
        userId,
        provider,
        status: "pending",
        error: null,
        createdAt: now,
        expiresAt: now + FLOW_TTL_MS,
    };

    const stmt = db.prepare(
        `INSERT INTO oauth_flows (state, userId, provider, status, error, createdAt, expiresAt)
         VALUES (@state, @userId, @provider, @status, @error, @createdAt, @expiresAt)`
    );
    stmt.run(flow);

    return flow;
}

export function getOAuthFlow(state: string): OAuthFlowRow | null {
    const db = getDbWithSchema();
    const stmt = db.prepare(
        `SELECT state, userId, provider, status, error, createdAt, expiresAt
         FROM oauth_flows WHERE state = ?`
    );
    const row = stmt.get(state) as OAuthFlowRow | undefined;
    return row ?? null;
}

export function updateOAuthFlowStatus(
    state: string,
    status: OAuthFlowStatus,
    error: string | null
): void {
    const db = getDbWithSchema();
    const stmt = db.prepare(
        `UPDATE oauth_flows SET status = ?, error = ? WHERE state = ?`
    );
    stmt.run(status, error, state);
}

export function upsertUserProviderKey(
    userId: string,
    provider: ProviderId,
    apiKey: string
): void {
    const db = getDbWithSchema();
    const now = dbNow();
    const id = randomUUID();
    const stmt = db.prepare(
        `INSERT INTO user_provider_keys (id, userId, provider, apiKey, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(userId, provider)
         DO UPDATE SET apiKey = excluded.apiKey, updatedAt = excluded.updatedAt`
    );
    stmt.run(id, userId, provider, apiKey, now, now);
}

export function getUserProviderKey(
    userId: string,
    provider: ProviderId
): UserProviderKeyRow | null {
    const db = getDbWithSchema();
    const stmt = db.prepare(
        `SELECT id, userId, provider, apiKey, createdAt, updatedAt
         FROM user_provider_keys WHERE userId = ? AND provider = ?`
    );
    const row = stmt.get(userId, provider) as UserProviderKeyRow | undefined;
    return row ?? null;
}

export function getLatestOAuthFlowForUser(
    userId: string,
    provider: ProviderId
): OAuthFlowRow | null {
    const db = getDbWithSchema();
    const stmt = db.prepare(
        `SELECT state, userId, provider, status, error, createdAt, expiresAt
         FROM oauth_flows WHERE userId = ? AND provider = ?
         ORDER BY createdAt DESC LIMIT 1`
    );
    const row = stmt.get(userId, provider) as OAuthFlowRow | undefined;
    return row ?? null;
}
