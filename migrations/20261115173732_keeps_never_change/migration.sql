CREATE TRIGGER `keeps_never_deleted` BEFORE DELETE ON `keeps`
BEGIN
	SELECT RAISE(ABORT, 'keeps are never deleted');
END;
--> statement-breakpoint
CREATE TRIGGER `keeps_never_changed` BEFORE UPDATE ON `keeps`
BEGIN
	SELECT RAISE(ABORT, 'keeps are never changed');
END;
