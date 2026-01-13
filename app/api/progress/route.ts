import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { markPageComplete, saveCodeSubmission, saveMCQAnswer } from "@/lib/db/queries";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pageId, action, data } = await request.json();

    if (!pageId || !action) {
      return NextResponse.json({ error: "Missing pageId/action" }, { status: 400 });
    }

    if (action === "complete") {
      await markPageComplete(userId, pageId);
      return NextResponse.json({ success: true });
    }

    if (action === "mcq") {
      const { sectionId, selectedOption, isCorrect } = data || {};
      if (!sectionId || !selectedOption || typeof isCorrect !== "boolean") {
        return NextResponse.json(
          { error: "Missing MCQ data" },
          { status: 400 }
        );
      }

      await saveMCQAnswer(userId, pageId, sectionId, {
        selectedOption,
        isCorrect,
      });

      return NextResponse.json({ success: true });
    }

    if (action === "code") {
      const { sectionId, code, language, results, allPassed, output } = data || {};
      if (
        !sectionId ||
        typeof code !== "string" ||
        typeof language !== "string" ||
        !Array.isArray(results) ||
        typeof allPassed !== "boolean"
      ) {
        return NextResponse.json(
          { error: "Missing code submission data" },
          { status: 400 }
        );
      }

      await saveCodeSubmission(userId, pageId, sectionId, {
        code,
        language,
        allPassed,
        results,
        output: typeof output === "string" ? output : undefined,
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Progress error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}