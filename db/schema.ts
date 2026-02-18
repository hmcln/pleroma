import {
  pgTable,
  uuid,
  text,
  integer,
  jsonb,
  timestamp,
  uniqueIndex,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";

export const users = pgTable("user", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  email: text("email").unique().notNull(),
  emailVerified: timestamp("emailVerified"),
  image: text("image"),
});

export const accounts = pgTable(
  "account",
  {
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })]
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires").notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires").notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })]
);

export const syllabus = pgTable(
  "syllabus",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    brief: text("brief").notNull(),
    level: text("level").notNull(),
    constraints: text("constraints"),
    outlineJson: jsonb("outline_json"),
    status: text("status").notNull().default("draft"),
    userId: uuid("user_id").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [index("syllabus_user_id_idx").on(t.userId)]
);

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
