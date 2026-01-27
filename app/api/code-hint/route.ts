// app/api/code-hint/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenAI } from "@google/genai";

type HighlightRange = {
  startLine: number;
  startCol: number;
  endLine: number;
  endCol: number;
  reason: string;
};

type CodeHintRequest = {
  code: string;
  language: string;
  failingTests: Array<{
    input: string;
    expectedOutput: string;
    actualOutput: string;
  }>;
};

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
  }

  let body: CodeHintRequest;
  try {
    body = (await req.json()) as CodeHintRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (
    !body ||
    typeof body.code !== "string" ||
    typeof body.language !== "string" ||
    !Array.isArray(body.failingTests)
  ) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Keep it aligned with your current executor: JS only [file:1]
  if (body.language !== "javascript") {
    return NextResponse.json(
      { error: "Only JavaScript is currently supported" },
      { status: 400 },
    );
  }

  const ai = new GoogleGenAI({ apiKey });

  const responseSchema = {
    type: "object",
    properties: {
      message: { type: "string" },
      highlights: {
        type: "array",
        items: {
          type: "object",
          properties: {
            startLine: { type: "number" },
            startCol: { type: "number" },
            endLine: { type: "number" },
            endCol: { type: "number" },
            reason: { type: "string" },
          },
          required: ["startLine", "startCol", "endLine", "endCol", "reason"],
        },
      },
    },
    required: ["message", "highlights"],
  } as const;

  const failingTests = body.failingTests.slice(0, 3);

  const prompt = [
    "You are a code tutor helping debug a student's JavaScript function submission.",
    "Return ONLY JSON matching the schema. No markdown.",
    "",
    "The platform expects code to define: function solution(input) { ... }",
    "",
    "Student code:",
    body.code,
    "",
    "Failing tests (input/expected/actual):",
    ...failingTests.flatMap((t, i) => [
      `#${i + 1}`,
      `Input: ${t.input}`,
      `Expected: ${t.expectedOutput}`,
      `Actual: ${t.actualOutput}`,
      "",
    ]),
    "Tasks:",
    "- Write a short explanation in 'message' (2-6 sentences) describing the most likely bug.",
    "- Provide 1-3 highlight ranges in 'highlights' pointing to likely wrong code.",
    "- If you cannot infer columns, highlight full lines with startCol=1 and endCol=200.",
    "- Line/column numbers are 1-based.",
  ].join("\n");

  try {
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema,
      },
    });

    const jsonText = result.text; // when responseMimeType is JSON, this is JSON text [page:1]
    const parsed = JSON.parse(jsonText) as { message: string; highlights: HighlightRange[] };

    // Basic server-side sanitization
    const safeHighlights = Array.isArray(parsed.highlights)
      ? parsed.highlights
          .slice(0, 3)
          .map((h) => ({
            startLine: clampInt(h.startLine, 1, 100000),
            startCol: clampInt(h.startCol, 1, 1000),
            endLine: clampInt(h.endLine, 1, 100000),
            endCol: clampInt(h.endCol, 1, 1000),
            reason: typeof h.reason === "string" ? h.reason.slice(0, 200) : "",
          }))
      : [];

    return NextResponse.json({
      message: typeof parsed.message === "string" ? parsed.message : "No hint available.",
      highlights: safeHighlights,
    });
  } catch (err: any) {
    console.error("Gemini hint error:", err);
    return NextResponse.json({ error: "Hint generation failed" }, { status: 500 });
  }
}

function clampInt(value: any, min: number, max: number) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}
