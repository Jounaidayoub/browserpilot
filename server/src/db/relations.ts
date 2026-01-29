import { relations } from "drizzle-orm/relations";
import { user, session, account, userApiKey } from "./schema";

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	sessions: many(session),
	accounts: many(account),
	userApiKeys: many(userApiKey),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const userApiKeyRelations = relations(userApiKey, ({one}) => ({
	user: one(user, {
		fields: [userApiKey.userId],
		references: [user.id]
	}),
}));