// components/learning/code-section.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Play, Check, X, Loader2 } from "lucide-react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface TestCase {
  input: string;
  expectedOutput: string;
  hidden?: boolean;
}

interface CodeSectionProps {
  pageId: string;
  sectionId: string;
  content: {
    title: string;
    description: string;
    starterCode: string;
    language: string;
    testCases: TestCase[];
  };
  savedSubmission?: {
    code: string;
    language: string;
    allPassed: boolean;
    results: Array<{ passed: boolean; output: string; expected: string }>;
    output?: string;
    submittedAt: string;
  };
}

type ExecResult = { passed: boolean; output: string; expected: string };

type ReviewResponse = {
  verdict?: "pass" | "fail" | "unsure";
  confidence?: number;
  message?: string;
  highlights?: Array<{
    startLine: number;
    startCol: number;
    endLine: number;
    endCol: number;
    reason: string;
  }>;
  // legacy fields
  results?: ExecResult[];
  allPassed?: boolean;
  output?: string;
};

export function CodeSection({ pageId, sectionId, content, savedSubmission }: CodeSectionProps) {
  const [code, setCode] = useState(content.starterCode);
  const [output, setOutput] = useState<string>("");
  const [testResults, setTestResults] = useState<ExecResult[]>([]);
  const [running, setRunning] = useState(false);
  const [allPassed, setAllPassed] = useState(false);

  const [verdict, setVerdict] = useState<"pass" | "fail" | "unsure" | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [message, setMessage] = useState<string>("");

  const editorRef = useRef<any>(null);
  const decorationIdsRef = useRef<string[]>([]);

  useEffect(() => {
    if (!savedSubmission) return;

    if (typeof savedSubmission.code === "string" && savedSubmission.code.length > 0) {
      setCode(savedSubmission.code);
    }
    if (Array.isArray(savedSubmission.results)) {
      setTestResults(savedSubmission.results);
    }
    if (typeof savedSubmission.output === "string") {
      setOutput(savedSubmission.output);
    }
    setAllPassed(!!savedSubmission.allPassed);

    // Older saved submissions won’t have verdict/confidence/message; that's fine [file:1]
  }, [savedSubmission]);

  const visibleTestCases = useMemo(
    () => content.testCases.map((tc, i) => ({ tc, i })).filter(({ tc }) => !tc.hidden),
    [content.testCases],
  );

  const saveSubmission = async (payload: {
    code: string;
    language: string;
    results: Array<{ passed: boolean; output: string; expected: string }>;
    allPassed: boolean;
    output?: string;
  }) => {
    try {
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId,
          action: "code",
          data: {
            sectionId,
            ...payload,
          },
        }),
      });
    } catch (err) {
      console.error("Failed to save code submission:", err);
    }
  };

  const clearHighlights = () => {
    const ref = editorRef.current;
    if (!ref) return;
    const { editor } = ref;
    const model = editor.getModel?.();
    if (!model) return;
    decorationIdsRef.current = model.deltaDecorations(decorationIdsRef.current, []);
  };

  const applyHighlights = (
    ranges: Array<{ startLine: number; startCol: number; endLine: number; endCol: number; reason: string }> = [],
  ) => {
    const ref = editorRef.current;
    if (!ref) return;

    const { editor, monaco } = ref;
    const model = editor.getModel?.();
    if (!model) return;

    const decorations = ranges.slice(0, 3).map((h) => ({
      range: new monaco.Range(h.startLine, h.startCol, h.endLine, h.endCol),
      options: {
        inlineClassName: "aiBugInline",
        hoverMessage: { value: h.reason || "Potential issue" },
        overviewRuler: { color: "rgba(255,0,0,0.6)", position: 2 },
      },
    }));

    decorationIdsRef.current = model.deltaDecorations(decorationIdsRef.current, decorations);

    if (ranges[0]) editor.revealLineInCenter?.(ranges[0].startLine);
  };

  const handleRunCode = async () => {
    setRunning(true);
    setOutput("");
    setTestResults([]);
    setAllPassed(false);
    setVerdict(null);
    setConfidence(null);
    setMessage("");
    clearHighlights();

    try {
      const response = await fetch("/api/code-execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          language: content.language,
          testCases: content.testCases,
        }),
      });

      const data = (await response.json()) as ReviewResponse;

      if (!response.ok) {
        const errorOutput = `Error: ${(data as any).error || "Request failed"}`;
        setOutput(errorOutput);

        await saveSubmission({
          code,
          language: content.language,
          results: [],
          allPassed: false,
          output: errorOutput,
        });
        return;
      }

      setTestResults(data.results ?? []);
      setOutput(data.output ?? "");
      setAllPassed(!!data.allPassed);

      setVerdict(data.verdict ?? null);
      setConfidence(typeof data.confidence === "number" ? data.confidence : null);
      setMessage(typeof data.message === "string" ? data.message : "");

      if (Array.isArray(data.highlights) && data.highlights.length > 0) {
        applyHighlights(data.highlights);
      }

      await saveSubmission({
        code,
        language: content.language,
        results: data.results ?? [],
        allPassed: !!data.allPassed,
        output: data.output ?? "",
      });
    } catch (err) {
      const errorOutput = "Failed to review code. Please try again.";
      setOutput(errorOutput);

      await saveSubmission({
        code,
        language: content.language,
        results: [],
        allPassed: false,
        output: errorOutput,
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border p-6">
        <h3 className="mb-2 text-lg font-semibold">{content.title}</h3>
        <p className="text-sm text-muted-foreground">{content.description}</p>
      </div>

      <div className="p-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left */}
          <div>
            <div className="mb-4 overflow-hidden rounded-md border border-border">
              <MonacoEditor
                height="400px"
                language={content.language}
                value={code}
                onChange={(value) => setCode(value || "")}
                theme="vs-light"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
                onMount={(editor: any, monaco: any) => {
                  editorRef.current = { editor, monaco };
                }}
              />
            </div>

            <Button onClick={handleRunCode} disabled={running} className="mb-4 w-full gap-2">
              {running ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Check Code
                </>
              )}
            </Button>

            {testResults.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Checks</h4>
                  {allPassed ? (
                    <span className="flex items-center gap-1 text-sm text-green-600">
                      <Check className="h-4 w-4" />
                      Likely correct
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-sm text-red-600">
                      <X className="h-4 w-4" />
                      Not verified
                    </span>
                  )}
                </div>

                {visibleTestCases.map(({ tc, i }) => {
                  const result = testResults[i];
                  if (!result) return null;

                  return (
                    <div
                      key={i}
                      className={`rounded-md border p-4 ${
                        result.passed ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                      }`}
                    >
                      <div className="mb-2 flex items-center gap-2">
                        {result.passed ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <X className="h-4 w-4 text-red-600" />
                        )}
                        <span className="text-sm font-medium">Spec Case {i + 1}</span>
                      </div>

                      <div className="space-y-1 text-xs">
                        <div>
                          <span className="font-medium">Input: </span>
                          <code className="rounded bg-black/5 px-1 py-0.5">{tc.input}</code>
                        </div>
                        <div>
                          <span className="font-medium">Expected: </span>
                          <code className="rounded bg-black/5 px-1 py-0.5">{result.expected}</code>
                        </div>
                        <div>
                          <span className="font-medium">Status: </span>
                          <code className="rounded bg-black/5 px-1 py-0.5">{result.output}</code>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {output && testResults.length === 0 && (
              <div className="rounded-md border border-border bg-muted/30 p-4">
                <h4 className="mb-2 text-sm font-medium">Output</h4>
                <pre className="text-xs whitespace-pre-wrap">
                  <code>{output}</code>
                </pre>
              </div>
            )}
          </div>

          {/* Right */}
          <div className="rounded-md border border-border bg-muted/20 p-4">
            <h4 className="mb-2 text-sm font-medium">Feed Back</h4>

            {!verdict && !message && (
              <p className="text-sm text-muted-foreground">
                
              </p>
            )}

            {(verdict || message) && (
              <div className="space-y-3">
                <div className="text-sm">
                  <span className="font-medium">Verdict: </span>
                  <span>{verdict ?? "unknown"}</span>
                  {typeof confidence === "number" && (
                    <span className="text-muted-foreground"> (confidence {confidence.toFixed(2)})</span>
                  )}
                </div>

                {message && <p className="text-sm whitespace-pre-wrap">{message}</p>}

                <Button variant="outline" size="sm" onClick={clearHighlights}>
                  Clear highlights
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
