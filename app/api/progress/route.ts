import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { markPageComplete, saveMCQAnswer } from "@/lib/db/queries";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pageId, action, data } = await request.json();

    if (action === "complete") {
      await markPageComplete(userId, pageId);
      return NextResponse.json({ success: true });
    }

    if (action === "mcq") {
      await saveMCQAnswer(userId, pageId, data);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Progress error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}