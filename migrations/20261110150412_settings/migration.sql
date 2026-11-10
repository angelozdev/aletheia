CREATE TABLE `settings` (
	`id` integer PRIMARY KEY,
	`session_size` integer,
	`new_per_day` integer,
	`new_share` integer,
	CONSTRAINT "settings_single_row" CHECK("id" = 1),
	CONSTRAINT "settings_session_size" CHECK("session_size" IS NULL OR "session_size" >= 1),
	CONSTRAINT "settings_new_per_day" CHECK("new_per_day" IS NULL OR "new_per_day" >= 0),
	CONSTRAINT "settings_new_share" CHECK("new_share" IS NULL OR "new_share" BETWEEN 0 AND 100)
);
