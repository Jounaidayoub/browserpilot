import { sqliteTable, AnySQLiteColumn, text, integer, numeric, index, foreignKey, unique } from "drizzle-orm/sqlite-core"
  import { sql } from "drizzle-orm"

export const user = sqliteTable("user", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: integer().notNull(),
	image: text(),
	createdAt: numeric().notNull(),
	updatedAt: numeric().notNull(),
});

export const session = sqliteTable("session", {
	id: text().primaryKey().notNull(),
	expiresAt: numeric().notNull(),
	token: text().notNull(),
	createdAt: numeric().notNull(),
	updatedAt: numeric().notNull(),
	ipAddress: text(),
	userAgent: text(),
	userId: text().notNull().references(() => user.id, { onDelete: "cascade" } ),
},
(table) => [
	index("session_userId_idx").on(table.userId),
]);

export const account = sqliteTable("account", {
	id: text().primaryKey().notNull(),
	accountId: text().notNull(),
	providerId: text().notNull(),
	userId: text().notNull().references(() => user.id, { onDelete: "cascade" } ),
	accessToken: text(),
	refreshToken: text(),
	idToken: text(),
	accessTokenExpiresAt: numeric(),
	refreshTokenExpiresAt: numeric(),
	scope: text(),
	password: text(),
	createdAt: numeric().notNull(),
	updatedAt: numeric().notNull(),
},
(table) => [
	index("account_userId_idx").on(table.userId),
]);

export const verification = sqliteTable("verification", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: numeric().notNull(),
	createdAt: numeric().notNull(),
	updatedAt: numeric().notNull(),
},
(table) => [
	index("verification_identifier_idx").on(table.identifier),
]);

export const userProviderKeys = sqliteTable("user_provider_keys", {
	id: text().primaryKey(),
	userId: text().notNull().references(() => user.id, { onDelete: "cascade" }),
	provider: text().notNull(),
	apiKey: text().notNull(),
	createdAt: integer().notNull(),
	updatedAt: integer().notNull(),
},
(table) => [
	index("user_provider_keys_userId_provider_idx").on(table.userId, table.provider),
	unique("user_provider_keys_userId_provider_unique").on(table.userId, table.provider),
]);

export const oauthFlows = sqliteTable("oauth_flows", {
	state: text().primaryKey(),
	userId: text().notNull().references(() => user.id, { onDelete: "cascade" }),
	provider: text().notNull(),
	status: text().notNull(),
	error: text(),
	createdAt: integer().notNull(),
	expiresAt: integer().notNull(),
},
(table) => [
	index("oauth_flows_userId_provider_idx").on(table.userId, table.provider),
]);

