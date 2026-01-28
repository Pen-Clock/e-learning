import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createCourseAccessToken, getCourseById } from "@/lib/db/queries";

type RouteContext = { params: Promise<{ courseId: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { courseId } = await context.params;
    if (!courseId) return NextResponse.json({ error: "Missing courseId" }, { status: 400 });

    const course = await getCourseById(courseId);
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

    // Optional: only for premium courses
    if ((course.price ?? 0) === 0) {
      return NextResponse.json({ error: "Tokens are only needed for premium courses" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({} as any));
    const expiryMinutes =
      typeof body?.expiryMinutes === "number" && Number.isFinite(body.expiryMinutes)
        ? body.expiryMinutes
        : null;

    const expiresAt = expiryMinutes ? new Date(Date.now() + expiryMinutes * 60_000) : null;

    const token = await createCourseAccessToken(courseId, expiresAt);

    // IMPORTANT: return raw token only once
    return NextResponse.json(token);
  } catch (err) {
    console.error("Create token error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
