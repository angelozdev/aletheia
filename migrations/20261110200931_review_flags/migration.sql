ALTER TABLE `reviews` ADD `flag` text;--> statement-breakpoint
ALTER TABLE `reviews` ADD `prerequisite_of` text REFERENCES cards(id);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_reviews` (
	`id` integer PRIMARY KEY,
	`card_id` text NOT NULL,
	`grade` text NOT NULL,
	`claude_grade` text NOT NULL,
	`state_before` text NOT NULL,
	`reviewed_at` text NOT NULL,
	`answer` text NOT NULL,
	`rationale` text NOT NULL,
	`flag` text,
	`prerequisite_of` text,
	CONSTRAINT `fk_reviews_card_id_cards_id_fk` FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`),
	CONSTRAINT `fk_reviews_prerequisite_of_cards_id_fk` FOREIGN KEY (`prerequisite_of`) REFERENCES `cards`(`id`),
	CONSTRAINT "reviews_grade" CHECK("grade" IN ('again','hard','good','easy')),
	CONSTRAINT "reviews_claude_grade" CHECK("claude_grade" IN ('again','hard','good','easy')),
	CONSTRAINT "reviews_state_before" CHECK("state_before" IN ('new','learning','review','relearning')),
	CONSTRAINT "reviews_answer" CHECK(length(trim("answer")) > 0),
	CONSTRAINT "reviews_rationale" CHECK(length(trim("rationale")) > 0),
	CONSTRAINT "reviews_flag" CHECK("flag" IS NULL OR "flag" IN ('missing-prerequisite','badly-written')),
	CONSTRAINT "reviews_gap_is_again" CHECK("flag" IS NOT 'missing-prerequisite' OR "grade" = 'again'),
	CONSTRAINT "reviews_prerequisite_of" CHECK("prerequisite_of" IS NULL OR "prerequisite_of" <> "card_id")
);
--> statement-breakpoint
INSERT INTO `__new_reviews`(`id`, `card_id`, `grade`, `claude_grade`, `state_before`, `reviewed_at`, `answer`, `rationale`) SELECT `id`, `card_id`, `grade`, `claude_grade`, `state_before`, `reviewed_at`, `answer`, `rationale` FROM `reviews`;--> statement-breakpoint
DROP TABLE `reviews`;--> statement-breakpoint
ALTER TABLE `__new_reviews` RENAME TO `reviews`;--> statement-breakpoint
PRAGMA foreign_keys=ON;