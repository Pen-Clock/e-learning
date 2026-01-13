import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { courses, courseEnrollments } from "@/lib/db/schema";
import { Plus, BookOpen, Users } from "lucide-react";
import { eq, count } from "drizzle-orm";

export default async function AdminDashboard() {
  const allCourses = await db.select().from(courses);

  const coursesWithStats = await Promise.all(
    allCourses.map(async (course) => {
      const enrollmentCount = await db
        .select({ count: count() })
        .from(courseEnrollments)
        .where(eq(courseEnrollments.courseId, course.id));

      return {
        ...course,
        enrollments: enrollmentCount[0]?.count || 0,
      };
    })
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your courses and content
          </p>
        </div>
        <Link href="/admin/courses/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Course
          </Button>
        </Link>
      </div>

      <div className="mb-8 grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Courses
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allCourses.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Published Courses
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allCourses.filter((c) => c.isPublished).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Enrollments
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {coursesWithStats.reduce((acc, c) => acc + c.enrollments, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold">All Courses</h2>
        <div className="space-y-4">
          {coursesWithStats.map((course) => (
            <Card key={course.id}>
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-3">
                    <h3 className="font-semibold">{course.title}</h3>
                    {course.isPublished ? (
                      <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                        Published
                      </span>
                    ) : (
                      <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
                        Draft
                      </span>
                    )}
                    {course.price === 0 ? (
                      <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                        Free
                      </span>
                    ) : (
                      <span className="rounded bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
                        Premium
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {course.enrollments} enrollments
                  </p>
                </div>
                <Link href={`/admin/courses/${course.id}/edit`}>
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}

          {allCourses.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="mb-4 text-muted-foreground">
                  No courses yet. Create your first course to get started.
                </p>
                <Link href="/admin/courses/new">
                  <Button>Create Course</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}