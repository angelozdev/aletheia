CREATE TABLE `keeps` (
	`id` integer PRIMARY KEY,
	`card_id` text NOT NULL,
	`reason` text NOT NULL,
	`overlaps` text,
	`kept_at` text NOT NULL,
	CONSTRAINT `fk_keeps_card_id_cards_id_fk` FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`),
	CONSTRAINT `fk_keeps_overlaps_cards_id_fk` FOREIGN KEY (`overlaps`) REFERENCES `cards`(`id`),
	CONSTRAINT "keeps_reason" CHECK("reason" IN ('leech','not-useful','outdated-situation','overlapping')),
	CONSTRAINT "keeps_overlaps" CHECK(("reason" = 'overlapping') = ("overlaps" IS NOT NULL)),
	CONSTRAINT "keeps_overlaps_other" CHECK("overlaps" IS NULL OR "overlaps" <> "card_id")
);
