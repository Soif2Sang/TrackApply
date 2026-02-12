DROP TABLE "placeholder" CASCADE;--> statement-breakpoint
ALTER TABLE "template" ADD COLUMN "placeholders" jsonb DEFAULT '[]'::jsonb;