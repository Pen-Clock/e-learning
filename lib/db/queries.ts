import { db } from "./index";
import {
  courses,
  courseEnrollments,
  coursePages,
  pageSections,
  userProgress,
} from "./schema";
import { eq, and, asc } from "drizzle-orm";
import { generateId } from "../utils";

export async function getCourses() {
  return await db.select().from(courses).where(eq(courses.isPublished, true));
}

export async function getCourseById(courseId: string) {
  const result = await db
    .select()
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);
  return result[0];
}

export async function getUserEnrollments(userId: string) {
  return await db
    .select({
      course: courses,
      enrollment: courseEnrollments,
    })
    .from(courseEnrollments)
    .innerJoin(courses, eq(courseEnrollments.courseId, courses.id))
    .where(eq(courseEnrollments.userId, userId));
}

export async function isUserEnrolled(userId: string, courseId: string) {
  const result = await db
    .select()
    .from(courseEnrollments)
    .where(
      and(
        eq(courseEnrollments.userId, userId),
        eq(courseEnrollments.courseId, courseId)
      )
    )
    .limit(1);
  return result.length > 0;
}

export async function enrollUser(userId: string, courseId: string) {
  const id = generateId();
  await db.insert(courseEnrollments).values({
    id,
    userId,
    courseId,
  });
  return id;
}

export async function getCoursePages(courseId: string) {
  return await db
    .select()
    .from(coursePages)
    .where(eq(coursePages.courseId, courseId))
    .orderBy(asc(coursePages.orderIndex));
}

export async function getPageWithSections(pageId: string) {
  const page = await db
    .select()
    .from(coursePages)
    .where(eq(coursePages.id, pageId))
    .limit(1);

  if (!page[0]) return null;

  const sections = await db
    .select()
    .from(pageSections)
    .where(eq(pageSections.pageId, pageId))
    .orderBy(asc(pageSections.orderIndex));

  return { ...page[0], sections };
}

export async function getUserProgress(userId: string, pageId: string) {
  const result = await db
    .select()
    .from(userProgress)
    .where(
      and(eq(userProgress.userId, userId), eq(userProgress.pageId, pageId))
    )
    .limit(1);
  return result[0];
}

export async function markPageComplete(userId: string, pageId: string) {
  const existing = await getUserProgress(userId, pageId);

  if (existing) {
    await db
      .update(userProgress)
      .set({ completedAt: new Date() })
      .where(eq(userProgress.id, existing.id));
  } else {
    await db.insert(userProgress).values({
      id: generateId(),
      userId,
      pageId,
      completedAt: new Date(),
    });
  }
}

export async function saveMCQAnswer(
  userId: string,
  pageId: string,
  answers: any
) {
  const existing = await getUserProgress(userId, pageId);

  if (existing) {
    await db
      .update(userProgress)
      .set({ mcqAnswers: answers })
      .where(eq(userProgress.id, existing.id));
  } else {
    await db.insert(userProgress).values({
      id: generateId(),
      userId,
      pageId,
      mcqAnswers: answers,
    });
  }
}