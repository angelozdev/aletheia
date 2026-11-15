ALTER TABLE `settings` ADD `leech_failures` integer;--> statement-breakpoint
ALTER TABLE `settings` ADD `keep_months` integer;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_settings` (
	`id` integer PRIMARY KEY,
	`session_size` integer,
	`new_per_day` integer,
	`new_share` integer,
	`leech_failures` integer,
	`keep_months` integer,
	CONSTRAINT "settings_single_row" CHECK("id" = 1),
	CONSTRAINT "settings_session_size" CHECK("session_size" IS NULL OR "session_size" >= 1),
	CONSTRAINT "settings_new_per_day" CHECK("new_per_day" IS NULL OR "new_per_day" >= 0),
	CONSTRAINT "settings_new_share" CHECK("new_share" IS NULL OR "new_share" BETWEEN 0 AND 100),
	CONSTRAINT "settings_leech_failures" CHECK("leech_failures" IS NULL OR "leech_failures" >= 1),
	CONSTRAINT "settings_keep_months" CHECK("keep_months" IS NULL OR "keep_months" >= 1)
);
--> statement-breakpoint
INSERT INTO `__new_settings`(`id`, `session_size`, `new_per_day`, `new_share`) SELECT `id`, `session_size`, `new_per_day`, `new_share` FROM `settings`;--> statement-breakpoint
DROP TABLE `settings`;--> statement-breakpoint
ALTER TABLE `__new_settings` RENAME TO `settings`;--> statement-breakpoint
PRAGMA foreign_keys=ON;