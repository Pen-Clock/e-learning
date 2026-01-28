import { currentUser } from "@clerk/nextjs/server";
import { Navigation } from "@/components/navigation";
import { CourseCard } from "@/components/course/course-card";
import { getCourses, getUserEnrollments } from "@/lib/db/queries";
import { SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

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

      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary shadow-sm ring-1 ring-primary/20">
            <Sparkles className="h-4 w-4" />
            Start Learning Today
          </div>
          <h1 className="mb-4 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-balance text-5xl font-bold tracking-tight text-transparent sm:text-6xl">
            Explore Courses
          </h1>
          <p className="mx-auto max-w-2xl text-pretty text-lg text-muted-foreground">
            Discover new skills and advance your career with our curated
            collection of courses
          </p>
        </div>

        {!user && (
          <div className="mb-12 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-8 shadow-lg shadow-primary/5">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div className="text-center sm:text-left">
                <h3 className="mb-1 text-lg font-semibold">
                  Sign in to get started
                </h3>
                <p className="text-sm text-muted-foreground">
                  Create an account to enroll in courses and track your progress
                </p>
              </div>
              <SignInButton mode="modal">
                <Button size="lg" className="shadow-lg shadow-primary/20">
                  Sign In
                </Button>
              </SignInButton>
            </div>
          </div>
        )}

        {courses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/50 bg-muted/20 p-16 text-center">
            <p className="text-muted-foreground">
              No courses available yet. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
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
