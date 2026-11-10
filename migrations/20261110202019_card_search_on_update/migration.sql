CREATE TRIGGER `card_search_on_update` AFTER UPDATE OF question, answer, key_points, situation ON `cards`
BEGIN
	UPDATE card_search SET question = new.question, answer = new.answer, key_points = new.key_points, situation = new.situation WHERE card_id = new.id;
END;
