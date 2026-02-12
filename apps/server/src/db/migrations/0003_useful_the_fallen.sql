CREATE TYPE "public"."invitation_status" AS ENUM('pending', 'accepted', 'expired');--> statement-breakpoint
CREATE TABLE "organization_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"status" "invitation_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;