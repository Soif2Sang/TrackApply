DROP TABLE "api_keys" CASCADE;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "gmail_refresh_token" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "gmail_access_token" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "gmail_token_expiry" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "gmail_connected" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "last_email_sync" timestamp;--> statement-breakpoint
ALTER TABLE "application_events" DROP COLUMN "snippet";