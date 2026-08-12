CREATE TABLE "service_offerings" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"creator_id" varchar(128) NOT NULL,
	"capability_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"title" varchar(160) NOT NULL,
	"description" varchar(2000) NOT NULL,
	"availability_description" varchar(1000),
	"request_instructions" varchar(1000) NOT NULL,
	"state" varchar(32) DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "service_offerings_id_idx" ON "service_offerings" USING btree ("id");
--> statement-breakpoint
CREATE UNIQUE INDEX "service_offerings_creator_id_id_idx" ON "service_offerings" USING btree ("creator_id","id");
