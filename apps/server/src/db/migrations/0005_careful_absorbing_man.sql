ALTER TABLE "user" RENAME COLUMN "last_email_sync" TO "application_sync_last_completed_at";--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "application_sync_history_earliest_date" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "application_sync_last_started_at" timestamp;