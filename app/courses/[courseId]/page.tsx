import { currentUser } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { getCourseById, isUserEnrolled, getCoursePages } from "@/lib/db/queries";
import { EnrollButton } from "../../../components/course/enroll-button";
import { Lock, Unlock } from "lucide-react";
import Link from "next/link";

type MaybePromise<T> = T | Promise<T>;

export default async function CoursePage({
  params,
}: {
  params: MaybePromise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const course = await getCourseById(courseId);
  if (!course) notFound();

  const enrolled = await isUserEnrolled(user.id, courseId);
  const pages = await getCoursePages(courseId);
  const firstPageId = pages[0]?.id;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-md bg-muted px-3 py-1 text-sm">
            {course.price === 0 ? (
              <>
                <Unlock className="h-4 w-4 text-green-600" />
                <span>Free Course</span>
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                <span>Premium Course</span>
              </>
            )}
          </div>

          <h1 className="mb-4 text-4xl font-bold tracking-tight">
            {course.title}
          </h1>
          <p className="text-lg text-muted-foreground">{course.description}</p>
        </div>

        {enrolled ? (
          <div className="space-y-6">
            <div className="rounded-lg border border-border bg-muted/30 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="mb-1 font-semibold">You're enrolled!</h3>
                  <p className="text-sm text-muted-foreground">
                    Continue
                  </p>
                </div>
                {firstPageId && (
                  <Link href={`/courses/${courseId}/learn/${firstPageId}`}>
                    <Button>Continue Learning</Button>
                  </Link>
                )}
              </div>
            </div>

            <div>
              <h2 className="mb-4 text-xl font-semibold">Course Content</h2>
              <div className="space-y-2">
                {pages.map((page, index) => (
                  <Link
                    key={page.id}
                    href={`/courses/${courseId}/learn/${page.id}`}
                  >
                    <div className="flex items-center gap-3 rounded-md border border-border p-4 transition-colors hover:bg-muted/50">
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-muted text-sm font-medium">
                        {index + 1}
                      </div>
                      <span className="font-medium">{page.title}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-border p-8">
            <div className="mb-6">
              <h2 className="mb-2 text-xl font-semibold">
                Enroll in this course
              </h2>
              <p className="text-sm text-muted-foreground">
                {course.price === 0
                  ? "This course is free. Click below to start learning."
                  : "Enter your access code to enroll in this premium course."}
              </p>
            </div>

            <EnrollButton courseId={courseId} isFree={course.price === 0} />
          </div>
        )}
      </main>
    </div>
  );
}