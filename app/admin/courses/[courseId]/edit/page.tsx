import { notFound } from "next/navigation";
import { getCourseById, getCoursePages } from "@/lib/db/queries";
import { CourseEditor } from "@/components/admin/course-editor";

type MaybePromise<T> = T | Promise<T>;

export default async function EditCoursePage({
  params,
}: {
  params: MaybePromise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  if (!courseId) notFound();

  const course = await getCourseById(courseId);
  if (!course) notFound();

  const pages = await getCoursePages(courseId);

  return <CourseEditor course={course} pages={pages} />;
}