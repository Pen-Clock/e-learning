import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  getCourseById,
  isUserEnrolled,
  enrollUser,
} from "@/lib/db/queries";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { courseId, accessCode } = await request.json();

    const course = await getCourseById(courseId);
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const alreadyEnrolled = await isUserEnrolled(userId, courseId);
    if (alreadyEnrolled) {
      return NextResponse.json(
        { error: "Already enrolled" },
        { status: 400 }
      );
    }

    // Check access code for paid courses
    if (course.price > 0) {
      if (!accessCode || accessCode !== course.accessCode) {
        return NextResponse.json(
          { error: "Invalid access code" },
          { status: 403 }
        );
      }
    }

    await enrollUser(userId, courseId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Enrollment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}