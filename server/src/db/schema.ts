import { sqliteTable, text, integer, index, unique } from "drizzle-orm/sqlite-core"

export const providerKeys = sqliteTable("provider_keys", {
	id: text().primaryKey(),
	provider: text().notNull(),
	apiKey: text().notNull(),
	createdAt: integer().notNull(),
	updatedAt: integer().notNull(),
},
(table) => [
	index("provider_keys_provider_idx").on(table.provider),
	unique("provider_keys_provider_unique").on(table.provider),
]);

export const oauthFlows = sqliteTable("oauth_flows", {
	state: text().primaryKey(),
	provider: text().notNull(),
	status: text().notNull(),
	error: text(),
	createdAt: integer().notNull(),
	expiresAt: integer().notNull(),
},
(table) => [
	index("oauth_flows_provider_idx").on(table.provider),
]);

