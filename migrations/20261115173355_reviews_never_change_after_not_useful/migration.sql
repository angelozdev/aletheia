CREATE TRIGGER `reviews_never_deleted` BEFORE DELETE ON `reviews`
BEGIN
	SELECT RAISE(ABORT, 'reviews are never deleted');
END;
--> statement-breakpoint
CREATE TRIGGER `reviews_never_changed` BEFORE UPDATE ON `reviews`
BEGIN
	SELECT RAISE(ABORT, 'reviews are never changed');
END;
