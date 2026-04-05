CREATE TABLE `oauth_flows` (
	`state` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`status` text NOT NULL,
	`error` text,
	`createdAt` integer NOT NULL,
	`expiresAt` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `oauth_flows_provider_idx` ON `oauth_flows` (`provider`);--> statement-breakpoint
CREATE TABLE `provider_keys` (
	`id` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`apiKey` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `provider_keys_provider_idx` ON `provider_keys` (`provider`);--> statement-breakpoint
CREATE UNIQUE INDEX `provider_keys_provider_unique` ON `provider_keys` (`provider`);