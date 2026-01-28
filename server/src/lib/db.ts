import Database from "better-sqlite3";
import type { Database as DatabaseType } from "better-sqlite3";

let db: DatabaseType | null = null;
let initialized = false;

export function getDb(): DatabaseType {
    if (!db) {
        db = new Database("./sqlite.db");
    }

    if (!initialized) {
        db.pragma("journal_mode = WAL");
        initialized = true;
    }

    return db;
}
