ALTER TABLE "subscription" DROP CONSTRAINT "subscription_organization_id_unique";--> statement-breakpoint
ALTER TABLE "subscription" DROP CONSTRAINT "subscription_stripe_customer_id_unique";--> statement-breakpoint
ALTER TABLE "subscription" DROP CONSTRAINT "subscription_stripe_subscription_id_unique";--> statement-breakpoint
ALTER TABLE "subscription" DROP CONSTRAINT "subscription_organization_id_organization_id_fk";
--> statement-breakpoint
ALTER TABLE "subscription" ALTER COLUMN "stripe_customer_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "subscription" ALTER COLUMN "stripe_subscription_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "subscription" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "subscription" ALTER COLUMN "status" SET DEFAULT 'incomplete';--> statement-breakpoint
ALTER TABLE "subscription" ALTER COLUMN "status" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "plan" text NOT NULL;--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "reference_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "period_start" timestamp;--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "period_end" timestamp;--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "cancel_at_period_end" boolean;--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "seats" integer;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "stripe_customer_id" text;--> statement-breakpoint
ALTER TABLE "subscription" DROP COLUMN "organization_id";--> statement-breakpoint
ALTER TABLE "subscription" DROP COLUMN "stripe_price_id";--> statement-breakpoint
ALTER TABLE "subscription" DROP COLUMN "current_period_end";--> statement-breakpoint
ALTER TABLE "subscription" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "subscription" DROP COLUMN "updated_at";