CREATE TRIGGER `cards_never_deleted` BEFORE DELETE ON `cards`
BEGIN
	SELECT RAISE(ABORT, 'cards are never deleted');
END;
