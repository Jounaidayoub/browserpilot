-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`emailVerified` integer NOT NULL,
	`image` text,
	`createdAt` numeric NOT NULL,
	`updatedAt` numeric NOT NULL
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expiresAt` numeric NOT NULL,
	`token` text NOT NULL,
	`createdAt` numeric NOT NULL,
	`updatedAt` numeric NOT NULL,
	`ipAddress` text,
	`userAgent` text,
	`userId` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`userId`);--> statement-breakpoint
CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`accountId` text NOT NULL,
	`providerId` text NOT NULL,
	`userId` text NOT NULL,
	`accessToken` text,
	`refreshToken` text,
	`idToken` text,
	`accessTokenExpiresAt` numeric,
	`refreshTokenExpiresAt` numeric,
	`scope` text,
	`password` text,
	`createdAt` numeric NOT NULL,
	`updatedAt` numeric NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`userId`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expiresAt` numeric NOT NULL,
	`createdAt` numeric NOT NULL,
	`updatedAt` numeric NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);--> statement-breakpoint
CREATE TABLE `user_api_key` (
	`id` text PRIMARY KEY,
	`userId` text NOT NULL,
	`provider` text NOT NULL,
	`key` text NOT NULL,
	`createdAt` numeric DEFAULT (CURRENT_TIMESTAMP),
	`updatedAt` numeric DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);

*/