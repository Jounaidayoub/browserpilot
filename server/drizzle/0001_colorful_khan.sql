PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_user_provider_keys` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`provider` text NOT NULL,
	`apiKey` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_user_provider_keys`("id", "userId", "provider", "apiKey", "createdAt", "updatedAt") SELECT "id", "userId", "provider", "apiKey", "createdAt", "updatedAt" FROM `user_provider_keys`;--> statement-breakpoint
DROP TABLE `user_provider_keys`;--> statement-breakpoint
ALTER TABLE `__new_user_provider_keys` RENAME TO `user_provider_keys`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `user_provider_keys_userId_provider_idx` ON `user_provider_keys` (`userId`,`provider`);--> statement-breakpoint
CREATE TABLE `__new_oauth_flows` (
	`state` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`provider` text NOT NULL,
	`status` text NOT NULL,
	`error` text,
	`createdAt` integer NOT NULL,
	`expiresAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_oauth_flows`("state", "userId", "provider", "status", "error", "createdAt", "expiresAt") SELECT "state", "userId", "provider", "status", "error", "createdAt", "expiresAt" FROM `oauth_flows`;--> statement-breakpoint
DROP TABLE `oauth_flows`;--> statement-breakpoint
ALTER TABLE `__new_oauth_flows` RENAME TO `oauth_flows`;--> statement-breakpoint
CREATE INDEX `oauth_flows_userId_provider_idx` ON `oauth_flows` (`userId`,`provider`);