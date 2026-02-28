ALTER TABLE `guests` ADD `is_child` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `guests` ADD `parent_guest_id` text REFERENCES guests(id);--> statement-breakpoint
ALTER TABLE `guests` ADD `is_invite_lead` integer DEFAULT false NOT NULL;