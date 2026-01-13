import { currentUser } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import {
  getCourseById,
  isUserEnrolled,
  getCoursePages,
  getPageWithSections,
  getUserProgress,
} from "@/lib/db/queries";
import { LearningLayout } from "../../../../../components/learning/learning-layout";

type MaybePromise<T> = T | Promise<T>;

export default async function LearnPage({
  params,
}: {
  params: MaybePromise<{ courseId: string; pageId: string }>;
}) {
  const { courseId, pageId } = await params;

  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const course = await getCourseById(courseId);
  if (!course) notFound();

  const enrolled = await isUserEnrolled(user.id, courseId);
  if (!enrolled) redirect(`/courses/${courseId}`);

  const pages = await getCoursePages(courseId);
  const currentPage = await getPageWithSections(pageId);

  if (!currentPage) notFound();

  const currentPageIndex = pages.findIndex((p) => p.id === pageId);
  const prevPage = currentPageIndex > 0 ? pages[currentPageIndex - 1] : null;
  const nextPage =
    currentPageIndex < pages.length - 1 ? pages[currentPageIndex + 1] : null;

  const progress = await getUserProgress(user.id, pageId);

  return (
    <LearningLayout
      course={course}
      pages={pages}
      currentPage={currentPage}
      prevPage={prevPage}
      nextPage={nextPage}
      courseId={courseId}
      userId={user.id}
      isCompleted={!!progress?.completedAt}
    />
  );
}