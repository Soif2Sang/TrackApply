CREATE TABLE "client_tag" (
	"client_id" text NOT NULL,
	"tag_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "client_tag_client_id_tag_id_pk" PRIMARY KEY("client_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "tag" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#3b82f6' NOT NULL,
	"organization_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "template_tag" (
	"template_id" text NOT NULL,
	"tag_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "template_tag_template_id_tag_id_pk" PRIMARY KEY("template_id","tag_id")
);
--> statement-breakpoint
ALTER TABLE "report" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "report" CASCADE;--> statement-breakpoint
ALTER TABLE "client" ALTER COLUMN "email" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "client_tag" ADD CONSTRAINT "client_tag_client_id_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_tag" ADD CONSTRAINT "client_tag_tag_id_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tag" ADD CONSTRAINT "tag_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_tag" ADD CONSTRAINT "template_tag_template_id_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."template"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_tag" ADD CONSTRAINT "template_tag_tag_id_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tag"("id") ON DELETE cascade ON UPDATE no action;