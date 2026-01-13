import { notFound } from "next/navigation";
import { getCourseById, getCoursePages } from "@/lib/db/queries";
import { CourseEditor } from "@/components/admin/course-editor";

export default async function EditCoursePage({
  params,
}: {
  params: { courseId: string };
}) {
  const course = await getCourseById(params.courseId);
  if (!course) notFound();

  const pages = await getCoursePages(params.courseId);

  return <CourseEditor course={course} pages={pages} />;
}