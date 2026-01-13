import { currentUser } from "@clerk/nextjs/server";
import { Navigation } from "@/components/navigation";
import { CourseCard } from "@/components/course/course-card";
import { getCourses, getUserEnrollments } from "@/lib/db/queries";
import { SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const user = await currentUser();
  const courses = await getCourses();

  let enrolledCourseIds: string[] = [];
  if (user) {
    const enrollments = await getUserEnrollments(user.id);
    enrolledCourseIds = enrollments.map((e) => e.course.id);
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="mb-3 text-4xl font-bold tracking-tight">
            Explore Courses
          </h1>
          <p className="text-lg text-muted-foreground">
            Learn new skills 
          </p>
        </div>

        {!user && (
          <div className="mb-8 rounded-lg border border-border bg-muted/30 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Sign in to get started</h3>
                <p className="text-sm text-muted-foreground">
                  Create an account to enroll in courses and track your
                  progress
                </p>
              </div>
              <SignInButton mode="modal">
                <Button>Sign In</Button>
              </SignInButton>
            </div>
          </div>
        )}

        {courses.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-12 text-center">
            <p className="text-muted-foreground">
              No courses available yet. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                id={course.id}
                title={course.title}
                description={course.description}
                price={course.price}
                thumbnailUrl={course.thumbnailUrl}
                isEnrolled={enrolledCourseIds.includes(course.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}