
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Simple JavaScript execution (sandbox with vm2 or similar in production)
function executeJavaScript(code: string, input: string): string {
  try {
    // Create a safe function wrapper
    const func = new Function("input", `
      ${code}
      return typeof solution === 'function' ? solution(input) : 'No solution function found';
    `);

    const result = func(input);
    return String(result);
  } catch (error: any) {
    return `Error: ${error.message}`;
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code, language, testCases } = await request.json();

    if (language !== "javascript") {
      return NextResponse.json(
        { error: "Only JavaScript is currently supported" },
        { status: 400 }
      );
    }

    const results = testCases.map((testCase: any) => {
      const output = executeJavaScript(code, testCase.input);
      const passed = output.trim() === testCase.expectedOutput.trim();

      return {
        passed,
        output: output.trim(),
        expected: testCase.expectedOutput.trim(),
      };
    });

    const allPassed = results.every((r: any) => r.passed);
    const output = results.map((r: any, i: number) => 
      `Test ${i + 1}: ${r.passed ? "✓" : "✗"} ${r.output}`
    ).join("\n");

    return NextResponse.json({ results, allPassed, output });
  } catch (error: any) {
    console.error("Code execution error:", error);
    return NextResponse.json(
      { error: error.message || "Execution failed" },
      { status: 500 }
    );
  }
}