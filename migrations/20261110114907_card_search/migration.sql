CREATE VIRTUAL TABLE `card_search` USING fts5(card_id UNINDEXED, question, answer, key_points, situation, tokenize = 'unicode61 remove_diacritics 2');
--> statement-breakpoint
CREATE TRIGGER `card_search_on_insert` AFTER INSERT ON `cards`
BEGIN
	INSERT INTO card_search (card_id, question, answer, key_points, situation) VALUES (new.id, new.question, new.answer, new.key_points, new.situation);
END;
--> statement-breakpoint
INSERT INTO card_search (card_id, question, answer, key_points, situation) SELECT id, question, answer, key_points, situation FROM cards;
