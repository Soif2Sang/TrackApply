CREATE TABLE IF NOT EXISTS "gmail_connection" (
  "user_id" text PRIMARY KEY NOT NULL,
  "google_project_id" text,
  "google_client_id" text,
  "google_client_secret" text,
  "gmail_refresh_token" text,
  "gmail_access_token" text,
  "gmail_token_expiry" timestamp,
  "connected_at" timestamp,
  "last_polled_at" timestamp,
  "last_poll_status" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "gmail_connection_user_id_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."user"("id")
    ON DELETE cascade
    ON UPDATE no action
);

INSERT INTO "gmail_connection" (
  "user_id",
  "gmail_refresh_token",
  "gmail_access_token",
  "gmail_token_expiry",
  "connected_at",
  "created_at",
  "updated_at"
)
SELECT
  "id",
  "gmail_refresh_token",
  "gmail_access_token",
  "gmail_token_expiry",
  CASE WHEN "gmail_connected" = true THEN now() ELSE NULL END,
  now(),
  now()
FROM "user"
WHERE "gmail_refresh_token" IS NOT NULL
ON CONFLICT ("user_id") DO NOTHING;

ALTER TABLE "user" DROP COLUMN IF EXISTS "gmail_refresh_token";
ALTER TABLE "user" DROP COLUMN IF EXISTS "gmail_access_token";
ALTER TABLE "user" DROP COLUMN IF EXISTS "gmail_token_expiry";
ALTER TABLE "user" DROP COLUMN IF EXISTS "gmail_connected";
ALTER TABLE "user" DROP COLUMN IF EXISTS "gmail_watch_expiration";
ALTER TABLE "user" DROP COLUMN IF EXISTS "gmail_watch_history_id";