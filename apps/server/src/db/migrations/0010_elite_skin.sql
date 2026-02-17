ALTER TABLE "ignored_emails" DROP CONSTRAINT "ignored_emails_email_id_application_events_id_fk";
--> statement-breakpoint
ALTER TABLE "ignored_emails" ALTER COLUMN "email_id" SET DATA TYPE text;--> statement-breakpoint
CREATE UNIQUE INDEX "ignored_emails_user_email_idx" ON "ignored_emails" USING btree ("user_id","email_id");