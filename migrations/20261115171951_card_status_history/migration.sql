CREATE TABLE `card_status_history` (
	`id` integer PRIMARY KEY,
	`card_id` text NOT NULL,
	`status` text NOT NULL,
	`reason` text,
	`changed_at` text NOT NULL,
	CONSTRAINT `fk_card_status_history_card_id_cards_id_fk` FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`),
	CONSTRAINT "card_status_history_status" CHECK("status" IN ('active','archived')),
	CONSTRAINT "card_status_history_reason" CHECK(("status" = 'archived' AND "reason" IS NOT NULL AND length(trim("reason")) > 0) OR ("status" = 'active' AND "reason" IS NULL))
);
