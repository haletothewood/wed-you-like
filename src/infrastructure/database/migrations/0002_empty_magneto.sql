CREATE TABLE `wedding_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`partner1_name` text NOT NULL,
	`partner2_name` text NOT NULL,
	`wedding_date` text NOT NULL,
	`wedding_time` text NOT NULL,
	`venue_name` text NOT NULL,
	`venue_address` text NOT NULL,
	`dress_code` text,
	`rsvp_deadline` text,
	`registry_url` text,
	`additional_info` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
