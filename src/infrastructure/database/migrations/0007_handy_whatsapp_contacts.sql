ALTER TABLE `guests` ADD `phone` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `invites` ADD `sent_via` text;
