import { relations } from "drizzle-orm/relations";
import { user, session, account, userProviderKeys, oauthFlows } from "./schema";

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	sessions: many(session),
	accounts: many(account),
	userProviderKeys: many(userProviderKeys),
	oauthFlows: many(oauthFlows),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const userProviderKeysRelations = relations(userProviderKeys, ({one}) => ({
	user: one(user, {
		fields: [userProviderKeys.userId],
		references: [user.id]
	}),
}));

export const oauthFlowsRelations = relations(oauthFlows, ({one}) => ({
	user: one(user, {
		fields: [oauthFlows.userId],
		references: [user.id]
	}),
}));