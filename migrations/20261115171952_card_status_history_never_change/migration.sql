CREATE TRIGGER `card_status_history_never_deleted` BEFORE DELETE ON `card_status_history`
BEGIN
	SELECT RAISE(ABORT, 'card status changes are never deleted');
END;
--> statement-breakpoint
CREATE TRIGGER `card_status_history_never_changed` BEFORE UPDATE ON `card_status_history`
BEGIN
	SELECT RAISE(ABORT, 'card status changes are never changed');
END;
