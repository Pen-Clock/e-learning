// app/api/admin/pages/[pageId]/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { coursePages, pageSections } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateId } from "@/lib/utils";
import { getPageWithSections } from "@/lib/db/queries";

export async function GET(
  request: Request,
  { params }: { params: { pageId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const page = await getPageWithSections(params.pageId);
    return NextResponse.json(page);
  } catch (error) {
    console.error("Get page error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { pageId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, sections } = await request.json();

    await db
      .update(coursePages)
      .set({ title })
      .where(eq(coursePages.id, params.pageId));

    // Delete existing sections
    await db
      .delete(pageSections)
      .where(eq(pageSections.pageId, params.pageId));

    // Insert new sections
    for (const section of sections) {
      await db.insert(pageSections).values({
        id: section.id || generateId(),
        pageId: params.pageId,
        type: section.type,
        orderIndex: section.orderIndex,
        content: section.content,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update page error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { pageId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await db.delete(coursePages).where(eq(coursePages.id, params.pageId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete page error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}