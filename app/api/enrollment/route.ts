// app/api/enrollment/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getCourseById, isUserEnrolled, enrollUser, redeemCourseAccessToken } from "@/lib/db/queries";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { courseId, accessCode } = await request.json();

    const course = await getCourseById(courseId);
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

    const alreadyEnrolled = await isUserEnrolled(userId, courseId);
    if (alreadyEnrolled) return NextResponse.json({ error: "Already enrolled" }, { status: 400 });

    // Free course: enroll directly
    if ((course.price ?? 0) === 0) {
      await enrollUser(userId, courseId);
      return NextResponse.json({ success: true });
    }

    // Premium: require one-time token
    if (!accessCode || !String(accessCode).trim()) {
      return NextResponse.json({ error: "Access code is required" }, { status: 400 });
    }

    const redeemed = await redeemCourseAccessToken({
      courseId,
      rawToken: String(accessCode).trim(),
      userId,
    });

    if (!redeemed.ok) {
      const msg = redeemed.reason === "EXPIRED" ? "Access code expired" : "Invalid access code";
      return NextResponse.json({ error: msg }, { status: 403 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Enrollment error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
