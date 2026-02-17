ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "last_polled_at" timestamp;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "last_poll_status" text;

UPDATE "user" u
SET
  "last_polled_at" = gc."last_polled_at",
  "last_poll_status" = gc."last_poll_status"
FROM "gmail_connection" gc
WHERE u."id" = gc."user_id"
  AND (
    gc."last_polled_at" IS NOT NULL
    OR gc."last_poll_status" IS NOT NULL
  );

ALTER TABLE "gmail_connection" DROP COLUMN IF EXISTS "last_polled_at";
ALTER TABLE "gmail_connection" DROP COLUMN IF EXISTS "last_poll_status";