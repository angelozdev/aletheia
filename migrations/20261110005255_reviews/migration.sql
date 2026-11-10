CREATE TABLE `reviews` (
	`id` integer PRIMARY KEY,
	`card_id` text NOT NULL,
	`grade` text NOT NULL,
	`claude_grade` text NOT NULL,
	`state_before` text NOT NULL,
	`reviewed_at` text NOT NULL,
	`answer` text NOT NULL,
	`rationale` text NOT NULL,
	CONSTRAINT `fk_reviews_card_id_cards_id_fk` FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`),
	CONSTRAINT "reviews_grade" CHECK("grade" IN ('again','hard','good','easy')),
	CONSTRAINT "reviews_claude_grade" CHECK("claude_grade" IN ('again','hard','good','easy')),
	CONSTRAINT "reviews_state_before" CHECK("state_before" IN ('new','learning','review','relearning')),
	CONSTRAINT "reviews_answer" CHECK(length(trim("answer")) > 0),
	CONSTRAINT "reviews_rationale" CHECK(length(trim("rationale")) > 0)
);
