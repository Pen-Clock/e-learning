import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const courses = sqliteTable("courses", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  price: integer("price").notNull().default(0),
  accessCode: text("access_code"),
  isPublished: integer("is_published", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const courseEnrollments = sqliteTable("course_enrollments", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  enrolledAt: integer("enrolled_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const coursePages = sqliteTable("course_pages", {
  id: text("id").primaryKey(),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  orderIndex: integer("order_index").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const pageSections = sqliteTable("page_sections", {
  id: text("id").primaryKey(),
  pageId: text("page_id")
    .notNull()
    .references(() => coursePages.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["text", "mcq", "code", "image"] }).notNull(),
  orderIndex: integer("order_index").notNull(),
  content: text("content", { mode: "json" }).notNull(),
});

export const userProgress = sqliteTable("user_progress", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  pageId: text("page_id")
    .notNull()
    .references(() => coursePages.id, { onDelete: "cascade" }),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  mcqAnswers: text("mcq_answers", { mode: "json" }),
  codeSubmissions: text("code_submissions", { mode: "json" }),
});

export const courseAccessTokens = sqliteTable("course_access_tokens", {
  id: text("id").primaryKey(),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),

  // store token hash (recommended) instead of raw token
  tokenHash: text("token_hash").notNull(),

  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),

  // optional expiry
  expiresAt: integer("expires_at", { mode: "timestamp" }),

  usedAt: integer("used_at", { mode: "timestamp" }),
});