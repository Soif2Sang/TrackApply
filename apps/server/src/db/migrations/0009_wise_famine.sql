--> statement-breakpoint
CREATE TABLE "ignored_emails" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"email_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ignored_emails" ADD CONSTRAINT "ignored_emails_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ignored_emails" ADD CONSTRAINT "ignored_emails_email_id_application_events_id_fk" FOREIGN KEY ("email_id") REFERENCES "public"."application_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint