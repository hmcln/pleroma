CREATE TABLE "generation_job" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"syllabus_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"idx" integer,
	"status" text DEFAULT 'queued' NOT NULL,
	"error" text,
	"started_at" timestamp,
	"finished_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "lesson" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"syllabus_id" uuid NOT NULL,
	"idx" integer NOT NULL,
	"lesson_id" text NOT NULL,
	"title" text NOT NULL,
	"goals_json" jsonb,
	"content_md" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"error" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "syllabus" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"brief" text NOT NULL,
	"level" text NOT NULL,
	"constraints" text,
	"outline_json" jsonb,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "syllabus_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "generation_job" ADD CONSTRAINT "generation_job_syllabus_id_syllabus_id_fk" FOREIGN KEY ("syllabus_id") REFERENCES "public"."syllabus"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson" ADD CONSTRAINT "lesson_syllabus_id_syllabus_id_fk" FOREIGN KEY ("syllabus_id") REFERENCES "public"."syllabus"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "job_syllabus_kind_idx" ON "generation_job" USING btree ("syllabus_id","kind","idx");--> statement-breakpoint
CREATE UNIQUE INDEX "lesson_syllabus_idx" ON "lesson" USING btree ("syllabus_id","idx");--> statement-breakpoint
CREATE UNIQUE INDEX "lesson_syllabus_lesson_id" ON "lesson" USING btree ("syllabus_id","lesson_id");