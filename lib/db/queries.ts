import { unstable_noStore as noStore } from "next/cache";
import { db } from "./index";
import {
  courses,
  courseEnrollments,
  coursePages,
  pageSections,
  userProgress,
  courseAccessTokens,
} from "./schema";
import { eq, and, asc, isNull } from "drizzle-orm";

import { generateId, generateOneTimeToken, sha256Hex } from "../utils";

export async function getCourses() {
  noStore();
  return await db.select().from(courses).where(eq(courses.isPublished, true));
}

export async function getCourseById(courseId: string) {
  if (!courseId) return null;
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
    .where(and(eq(userProgress.userId, userId), eq(userProgress.pageId, pageId)))
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

export type SavedMcqAnswer = {
  selectedOption: string;
  isCorrect: boolean;
  answeredAt: string;
};

export type SavedCodeSubmission = {
  code: string;
  language: string;
  allPassed: boolean;
  results: Array<{ passed: boolean; output: string; expected: string }>;
  output?: string;
  submittedAt: string;
};

export async function saveMCQAnswer(
  userId: string,
  pageId: string,
  sectionId: string,
  answer: Omit<SavedMcqAnswer, "answeredAt">
) {
  const existing = await getUserProgress(userId, pageId);

  const prev = (existing?.mcqAnswers ?? {}) as Record<string, SavedMcqAnswer>;
  const next: Record<string, SavedMcqAnswer> = {
    ...prev,
    [sectionId]: {
      ...answer,
      answeredAt: new Date().toISOString(),
    },
  };

  if (existing) {
    await db
      .update(userProgress)
      .set({ mcqAnswers: next })
      .where(eq(userProgress.id, existing.id));
  } else {
    await db.insert(userProgress).values({
      id: generateId(),
      userId,
      pageId,
      mcqAnswers: next,
    });
  }
}

export async function saveCodeSubmission(
  userId: string,
  pageId: string,
  sectionId: string,
  submission: Omit<SavedCodeSubmission, "submittedAt">
) {
  const existing = await getUserProgress(userId, pageId);

  const prev = (existing?.codeSubmissions ??
    {}) as Record<string, SavedCodeSubmission>;
  const next: Record<string, SavedCodeSubmission> = {
    ...prev,
    [sectionId]: {
      ...submission,
      submittedAt: new Date().toISOString(),
    },
  };

  if (existing) {
    await db
      .update(userProgress)
      .set({ codeSubmissions: next })
      .where(eq(userProgress.id, existing.id));
  } else {
    await db.insert(userProgress).values({
      id: generateId(),
      userId,
      pageId,
      codeSubmissions: next,
    });
  }
}

export async function createCourseAccessToken(courseId: string, expiresAt?: Date | null) {
  const rawToken = generateOneTimeToken(32);
  const tokenHash = sha256Hex(rawToken);

  const id = generateId();
  await db.insert(courseAccessTokens).values({
    id,
    courseId,
    tokenHash,
    expiresAt: expiresAt ?? null,
    usedAt: null,
  });

  return { id, token: rawToken, expiresAt: expiresAt ?? null };
}

export async function redeemCourseAccessToken(params: {
  courseId: string;
  rawToken: string;
  userId: string;
}) {
  const { courseId, rawToken, userId } = params;
  const tokenHash = sha256Hex(rawToken);

  // Find an unused token for this course
  const rows = await db
    .select()
    .from(courseAccessTokens)
    .where(
      and(
        eq(courseAccessTokens.courseId, courseId),
        eq(courseAccessTokens.tokenHash, tokenHash),
        isNull(courseAccessTokens.usedAt),
      ),
    )
    .limit(1);

  const tokenRow = rows[0];
  if (!tokenRow) return { ok: false as const, reason: "INVALID" as const };

  if (tokenRow.expiresAt && new Date(tokenRow.expiresAt).getTime() < Date.now()) {
    return { ok: false as const, reason: "EXPIRED" as const };
  }

  // Mark used (single-use)
  await db
    .update(courseAccessTokens)
    .set({ usedAt: new Date() })
    .where(eq(courseAccessTokens.id, tokenRow.id));

  // Enroll user
  const already = await isUserEnrolled(userId, courseId);
  if (!already) await enrollUser(userId, courseId);

  return { ok: true as const };
}