CREATE TABLE "commerce_identities" (
	"creator_id" varchar(128) PRIMARY KEY NOT NULL,
	"display_name" varchar(120) NOT NULL,
	"bio" varchar(2000) NOT NULL,
	"avatar_url" varchar(2048),
	"location" varchar(120),
	"social_links" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"state" varchar(32) DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creator_capabilities" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"creator_id" varchar(128) NOT NULL,
	"name" varchar(120) NOT NULL,
	"description" varchar(1000) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "commerce_identities_creator_id_idx" ON "commerce_identities" USING btree ("creator_id");