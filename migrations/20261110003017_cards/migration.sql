CREATE TABLE `card_tags` (
	`card_id` text NOT NULL,
	`tag` text NOT NULL,
	CONSTRAINT `card_tags_pk` PRIMARY KEY(`card_id`, `tag`),
	CONSTRAINT `fk_card_tags_card_id_cards_id_fk` FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`),
	CONSTRAINT "card_tags_tag" CHECK(length("tag") > 0 AND "tag" NOT GLOB '*[^a-z0-9:-]*')
);
--> statement-breakpoint
CREATE TABLE `cards` (
	`id` text PRIMARY KEY,
	`type` text NOT NULL,
	`question` text NOT NULL,
	`answer` text NOT NULL,
	`situation` text NOT NULL,
	`source` text NOT NULL,
	`key_points` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`due` text NOT NULL,
	`state` text DEFAULT 'new' NOT NULL,
	`stability` real DEFAULT 0 NOT NULL,
	`difficulty` real DEFAULT 0 NOT NULL,
	`scheduled_days` integer DEFAULT 0 NOT NULL,
	`learning_steps` integer DEFAULT 0 NOT NULL,
	`reps` integer DEFAULT 0 NOT NULL,
	`lapses` integer DEFAULT 0 NOT NULL,
	`last_review` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT "cards_id" CHECK(length("id") = 4 AND "id" NOT GLOB '*[^0-9a-hjkmnp-tv-z]*'),
	CONSTRAINT "cards_type" CHECK("type" IN ('concept','comparison','command','scenario','code')),
	CONSTRAINT "cards_question" CHECK(length(trim("question")) > 0),
	CONSTRAINT "cards_answer" CHECK(length(trim("answer")) > 0),
	CONSTRAINT "cards_situation" CHECK(length(trim("situation")) > 0),
	CONSTRAINT "cards_source" CHECK(length(trim("source")) > 0),
	CONSTRAINT "cards_key_points" CHECK(json_valid("key_points") AND json_array_length("key_points") BETWEEN 1 AND 3),
	CONSTRAINT "cards_status" CHECK("status" IN ('active','archived')),
	CONSTRAINT "cards_state" CHECK("state" IN ('new','learning','review','relearning'))
);
