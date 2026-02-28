CREATE TABLE `email_campaign_events` (
	`id` text PRIMARY KEY NOT NULL,
	`event_type` text NOT NULL,
	`status` text NOT NULL,
	`template_id` text,
	`invite_id` text,
	`recipient_email` text NOT NULL,
	`subject` text,
	`error_message` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`template_id`) REFERENCES `email_templates`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`invite_id`) REFERENCES `invites`(`id`) ON UPDATE no action ON DELETE set null
);
