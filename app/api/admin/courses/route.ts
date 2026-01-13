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

    const { title, description, price, accessCode } = await request.json();

    const id = generateId();
    await db.insert(courses).values({
      id,
      title,
      description,
      price,
      accessCode: price > 0 ? accessCode : null,
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