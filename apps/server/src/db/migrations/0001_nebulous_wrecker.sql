CREATE TABLE "client" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"information" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "client" ADD CONSTRAINT "client_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;