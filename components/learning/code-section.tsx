"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import {
  Play,
  Check,
  X,
  Loader2,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Code,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  results?: ExecResult[];
  allPassed?: boolean;
  output?: string;
  error?: string;
};

const verdictConfig = {
  pass: {
    color: "text-green-500",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    label: "Passed",
  },
  fail: {
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    label: "Failed",
  },
  unsure: {
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
    label: "Needs Review",
  },
} as const;

export function CodeSection({ pageId, sectionId, content, savedSubmission }: CodeSectionProps) {
  const [code, setCode] = useState(content.starterCode);
  const [output, setOutput] = useState<string>("");
  const [testResults, setTestResults] = useState<ExecResult[]>([]);
  const [running, setRunning] = useState(false);
  const [allPassed, setAllPassed] = useState(false);

  const [verdict, setVerdict] = useState<"pass" | "fail" | "unsure" | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [message, setMessage] = useState<string>("");

  const [hasHighlights, setHasHighlights] = useState(false);

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

    // Note: older saved submissions won’t have verdict/message, and that’s OK [file:1]
  }, [savedSubmission]);

  const visibleTestCases = useMemo(
    () => content.testCases.map((tc, i) => ({ tc, i })).filter(({ tc }) => !tc.hidden),
    [content.testCases]
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
    setHasHighlights(false);
  };

  const applyHighlights = (
    ranges: Array<{ startLine: number; startCol: number; endLine: number; endCol: number; reason: string }> = []
  ) => {
    const ref = editorRef.current;
    if (!ref) return;

    const { editor, monaco } = ref;
    const model = editor.getModel?.();
    if (!model) return;

    const safeRanges = ranges.slice(0, 3).filter((r) => r && r.startLine && r.endLine);

    const decorations = safeRanges.map((h) => ({
      range: new monaco.Range(h.startLine, h.startCol, h.endLine, h.endCol),
      options: {
        inlineClassName: "aiBugInline",
        hoverMessage: { value: h.reason || "Potential issue" },
        overviewRuler: { color: "rgba(255,0,0,0.6)", position: 2 },
      },
    }));

    decorationIdsRef.current = model.deltaDecorations(decorationIdsRef.current, decorations);
    setHasHighlights(decorations.length > 0);

    if (safeRanges[0]) editor.revealLineInCenter?.(safeRanges[0].startLine);
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

      if (!response.ok || data.error) {
        const errorOutput = `Error: ${data.error || "Request failed"}`;
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

  const handleReset = () => {
    setCode(content.starterCode);
    setOutput("");
    setTestResults([]);
    setAllPassed(false);
    setVerdict(null);
    setConfidence(null);
    setMessage("");
    clearHighlights();
  };

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border p-6 lg:p-8">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
            <Code className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Coding Challenge
          </span>
        </div>
        <h3 className="mb-2 text-lg font-semibold text-foreground lg:text-xl">{content.title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground lg:text-base">{content.description}</p>
      </div>

      <div className="p-6 lg:p-8">
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <div className="overflow-hidden rounded-xl border border-border bg-muted/30">
              <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-400" />
                    <div className="h-3 w-3 rounded-full bg-yellow-400" />
                    <div className="h-3 w-3 rounded-full bg-green-400" />
                  </div>
                  <span className="ml-2 text-xs font-medium text-muted-foreground">
                    solution.{content.language === "javascript" ? "js" : content.language}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset
                </Button>
              </div>

              <MonacoEditor
                height="320px"
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
                  padding: { top: 16, bottom: 16 },
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                }}
                onMount={(editor: any, monaco: any) => {
                  editorRef.current = { editor, monaco };
                }}
              />

              <div className="border-t border-border bg-muted/30 p-4">
                <Button onClick={handleRunCode} disabled={running} className="w-full gap-2" size="lg">
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

                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <span
                    className={cn(
                      "flex items-center gap-1.5 font-medium",
                      !verdict ? "text-muted-foreground" : verdictConfig[verdict].color
                    )}
                  >
                    {!verdict ? (
                      <>
                        <AlertCircle className="h-4 w-4" />
                        Not verified
                      </>
                    ) : verdict === "pass" ? (
                      <>
                        <Check className="h-4 w-4" />
                        {verdictConfig[verdict].label}
                      </>
                    ) : verdict === "fail" ? (
                      <>
                        <X className="h-4 w-4" />
                        {verdictConfig[verdict].label}
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4" />
                        {verdictConfig[verdict].label}
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Feedback */}
          <div className="lg:col-span-2">
            {verdict ? (
              <div
                className={cn("rounded-xl border p-5", verdictConfig[verdict].bg, verdictConfig[verdict].border)}
              >
                <div className="mb-4 flex items-center gap-2">
                  <Sparkles className={cn("h-4 w-4", verdictConfig[verdict].color)} />
                  <h4 className="text-sm font-semibold text-foreground">AI Feedback</h4>
                </div>

                <div className="mb-3 flex items-center gap-2">
                  <span className={cn("text-sm font-medium", verdictConfig[verdict].color)}>
                    Verdict: {verdict}
                  </span>
                  {confidence !== null && (
                    <span className="text-xs text-muted-foreground">
                      ({(confidence * 100).toFixed(0)}% confidence)
                    </span>
                  )}
                </div>

                <p className="text-sm leading-relaxed text-foreground/80">
                  {message?.trim()
                    ? message
                    : "No detailed feedback returned. Try again, or add more explicit test cases."}
                </p>

                {hasHighlights && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearHighlights}
                    className="mt-4 bg-transparent text-xs"
                  >
                    Clear highlights
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex h-full min-h-[200px] items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 p-6">
                <div className="text-center">
                  <Sparkles className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    AI feedback will appear here after you check your code
                  </p>
                </div>
              </div>
            )}

            {/* Test Results */}
            {testResults.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium text-foreground">Test Cases</h4>
                {visibleTestCases.map(({ tc, i }) => {
                  const result = testResults[i];
                  if (!result) return null;

                  return (
                    <div
                      key={i}
                      className={cn(
                        "rounded-lg border p-3",
                        result.passed ? "border-green-500/30 bg-green-500/10" : "border-red-500/30 bg-red-500/10"
                      )}
                    >
                      <div className="mb-1 flex items-center gap-2">
                        {result.passed ? (
                          <Check className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <X className="h-3.5 w-3.5 text-red-500" />
                        )}
                        <span className="text-xs font-medium">Test {i + 1}</span>
                      </div>
                      <div className="space-y-0.5 text-xs text-muted-foreground">
                        <p>
                          <span className="font-medium">Input:</span> {tc.input}
                        </p>
                        <p>
                          <span className="font-medium">Expected:</span> {result.expected}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Error Output */}
        {output && testResults.length === 0 && !verdict && (
          <div className="mt-4 rounded-xl border border-border bg-muted/30 p-4">
            <h4 className="mb-2 text-sm font-medium text-foreground">Output</h4>
            <pre className="text-xs whitespace-pre-wrap text-muted-foreground">
              <code>{output}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
