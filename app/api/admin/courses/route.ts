import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { courses } from "@/lib/db/schema";
import { generateId } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, description, price, accessCode, thumbnailUrl } =
      await request.json();

    if (!title || !description) {
      return NextResponse.json(
        { error: "Title and description are required" },
        { status: 400 }
      );
    }

    if (typeof price !== "number" || !Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: "Invalid price" }, { status: 400 });
    }

    if (price > 0 && (!accessCode || !String(accessCode).trim())) {
      return NextResponse.json(
        { error: "Access code is required for premium courses" },
        { status: 400 }
      );
    }

    const id = generateId();

    await db.insert(courses).values({
      id,
      title,
      description,
      price,
      accessCode: price > 0 ? accessCode : null,
      thumbnailUrl: thumbnailUrl ? String(thumbnailUrl) : null,
      isPublished: false,
    });

    return NextResponse.json({ id });
  } catch (error) {
    console.error("Create course error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}