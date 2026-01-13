// app/api/admin/pages/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { coursePages, pageSections } from "@/lib/db/schema";
import { generateId } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { courseId, title, orderIndex, sections } = await request.json();

    const pageId = generateId();
    await db.insert(coursePages).values({
      id: pageId,
      courseId,
      title,
      orderIndex,
    });

    for (const section of sections) {
      await db.insert(pageSections).values({
        id: generateId(),
        pageId,
        type: section.type,
        orderIndex: section.orderIndex,
        content: section.content,
      });
    }

    return NextResponse.json({ id: pageId });
  } catch (error) {
    console.error("Create page error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}