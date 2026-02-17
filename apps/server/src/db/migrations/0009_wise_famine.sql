CREATE TABLE "gmail_connection" (
	"user_id" text PRIMARY KEY NOT NULL,
	"google_client_id" text,
	"google_client_secret" text,
	"gmail_refresh_token" text,
	"gmail_access_token" text,
	"gmail_token_expiry" timestamp,
	"connected_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ignored_emails" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"email_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "last_polled_at" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "last_poll_status" text;--> statement-breakpoint
ALTER TABLE "gmail_connection" ADD CONSTRAINT "gmail_connection_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ignored_emails" ADD CONSTRAINT "ignored_emails_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ignored_emails" ADD CONSTRAINT "ignored_emails_email_id_application_events_id_fk" FOREIGN KEY ("email_id") REFERENCES "public"."application_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "gmail_refresh_token";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "gmail_access_token";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "gmail_token_expiry";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "gmail_connected";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "gmail_watch_expiration";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "gmail_watch_history_id";