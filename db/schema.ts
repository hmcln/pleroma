import {
  pgTable,
  uuid,
  text,
  integer,
  jsonb,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const syllabus = pgTable("syllabus", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  brief: text("brief").notNull(),
  level: text("level").notNull(),
  constraints: text("constraints"),
  outlineJson: jsonb("outline_json"),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const lesson = pgTable(
  "lesson",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    syllabusId: uuid("syllabus_id")
      .notNull()
      .references(() => syllabus.id),
    idx: integer("idx").notNull(),
    lessonId: text("lesson_id").notNull(),
    title: text("title").notNull(),
    goalsJson: jsonb("goals_json"),
    contentMd: text("content_md"),
    status: text("status").notNull().default("pending"),
    error: text("error"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [
    uniqueIndex("lesson_syllabus_idx").on(t.syllabusId, t.idx),
    uniqueIndex("lesson_syllabus_lesson_id").on(t.syllabusId, t.lessonId),
  ]
);

export const generationJob = pgTable(
  "generation_job",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    syllabusId: uuid("syllabus_id")
      .notNull()
      .references(() => syllabus.id),
    kind: text("kind").notNull(),
    idx: integer("idx"),
    status: text("status").notNull().default("queued"),
    error: text("error"),
    startedAt: timestamp("started_at"),
    finishedAt: timestamp("finished_at"),
  },
  (t) => [index("job_syllabus_kind_idx").on(t.syllabusId, t.kind, t.idx)]
);
