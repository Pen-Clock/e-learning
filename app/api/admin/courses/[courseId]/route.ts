// app/api/admin/courses/[courseId]/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { courses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, description, price, accessCode, isPublished } =
      await request.json();

    await db
      .update(courses)
      .set({
        title,
        description,
        price,
        accessCode: price > 0 ? accessCode : null,
        isPublished,
        updatedAt: new Date(),
      })
      .where(eq(courses.id, params.courseId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update course error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}