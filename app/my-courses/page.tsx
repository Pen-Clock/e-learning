import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { CourseCard } from "@/components/course/course-card";
import { getUserEnrollments } from "@/lib/db/queries";
import { Button } from "@/components/ui/button";

export default async function MyCoursesPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const enrollments = await getUserEnrollments(user.id);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="mb-3 text-4xl font-bold tracking-tight">
            My Learning
          </h1>
          <p className="text-lg text-muted-foreground">
            Continue where you left off
          </p>
        </div>

        {enrollments.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-12 text-center">
            <p className="mb-4 text-muted-foreground">
              You haven't enrolled in any courses yet
            </p>
            <Button >
              <a href="/">Browse Courses</a>
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {enrollments.map(({ course }) => (
              <CourseCard
                key={course.id}
                id={course.id}
                title={course.title}
                description={course.description}
                price={course.price}
                thumbnailUrl={course.thumbnailUrl}
                isEnrolled={true}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}