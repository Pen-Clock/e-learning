import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { coursePages, pageSections } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateId } from "@/lib/utils";
import { getPageWithSections } from "@/lib/db/queries";

type RouteContext<T> = { params: T | Promise<T> };

export async function GET(
  request: Request,
  context: RouteContext<{ pageId: string }>
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pageId } = await context.params;

    if (!pageId) {
      return NextResponse.json({ error: "Missing pageId" }, { status: 400 });
    }

    const page = await getPageWithSections(pageId);
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
  context: RouteContext<{ pageId: string }>
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pageId } = await context.params;

    if (!pageId) {
      return NextResponse.json({ error: "Missing pageId" }, { status: 400 });
    }

    const { title, sections } = await request.json();

    await db.update(coursePages).set({ title }).where(eq(coursePages.id, pageId));

    await db.delete(pageSections).where(eq(pageSections.pageId, pageId));

    for (const section of sections) {
      await db.insert(pageSections).values({
        id: section.id || generateId(),
        pageId,
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
  context: RouteContext<{ pageId: string }>
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pageId } = await context.params;

    if (!pageId) {
      return NextResponse.json({ error: "Missing pageId" }, { status: 400 });
    }

    await db.delete(coursePages).where(eq(coursePages.id, pageId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete page error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}