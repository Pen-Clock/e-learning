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

export default async function LearnPage({
  params,
}: {
  params: { courseId: string; pageId: string };
}) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const course = await getCourseById(params.courseId);
  if (!course) notFound();

  const enrolled = await isUserEnrolled(user.id, params.courseId);
  if (!enrolled) redirect(`/courses/${params.courseId}`);

  const pages = await getCoursePages(params.courseId);
  const currentPage = await getPageWithSections(params.pageId);

  if (!currentPage) notFound();

  const currentPageIndex = pages.findIndex((p) => p.id === params.pageId);
  const prevPage = currentPageIndex > 0 ? pages[currentPageIndex - 1] : null;
  const nextPage =
    currentPageIndex < pages.length - 1 ? pages[currentPageIndex + 1] : null;

  const progress = await getUserProgress(user.id, params.pageId);

  return (
    <LearningLayout
      course={course}
      pages={pages}
      currentPage={currentPage}
      prevPage={prevPage}
      nextPage={nextPage}
      courseId={params.courseId}
      userId={user.id}
      isCompleted={!!progress?.completedAt}
    />
  );
}