"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Play, Check, X, Loader2, RotateCcw, Sparkles, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

type SupportedLang = "javascript" | "typescript" | "python" | "c" | "cpp" | "java";

type TestCase = { input: string; expectedOutput: string; hidden?: boolean };

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

type LegacyContent = {
  title: string;
  description: string;
  starterCode: string;
  language: string;
  testCases: TestCase[];
};

type NewContent = {
  title: string;
  description: string;
  defaultLanguage: SupportedLang;
  starterCodeByLang: Record<string, string>;
  testCasesByLang?: Partial<Record<string, TestCase[]>>;
};

type SavedSubmissionLegacy = {
  code: string;
  language: string;
  allPassed: boolean;
  results: ExecResult[];
  output?: string;
  submittedAt: string;
};

type SavedSubmissionMulti = {
  byLanguage: Partial<
    Record<
      SupportedLang,
      {
        code: string;
        allPassed: boolean;
        results: ExecResult[];
        output?: string;
        submittedAt: string;
      }
    >
  >;
  selectedLanguage?: SupportedLang;
};

type CodeSectionProps = {
  pageId: string;
  sectionId: string;
  content: LegacyContent | NewContent;
  savedSubmission?: SavedSubmissionLegacy | SavedSubmissionMulti;
};

const verdictConfig = {
  pass: { color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20", label: "Passed" },
  fail: { color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20", label: "Failed" },
  unsure: { color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/20", label: "Needs Review" },
} as const;

const LANGS: { id: SupportedLang; label: string; monaco: string }[] = [
  { id: "c", label: "C", monaco: "c" },
  { id: "cpp", label: "C++", monaco: "cpp" },
  { id: "java", label: "Java", monaco: "java" },
  { id: "python", label: "Python", monaco: "python" },
  { id: "javascript", label: "JavaScript", monaco: "javascript" },
  { id: "typescript", label: "TypeScript", monaco: "typescript" },
];

function normalizeContent(raw: LegacyContent | NewContent): NewContent {
  // If already new format
  if ((raw as any).starterCodeByLang) {
    const c = raw as NewContent;
    return {
      title: c.title,
      description: c.description,
      defaultLanguage: c.defaultLanguage ?? "javascript",
      starterCodeByLang: c.starterCodeByLang ?? {},
      testCasesByLang: c.testCasesByLang ?? {},
    };
  }

  // Legacy -> new
  const legacy = raw as LegacyContent;
  return {
    title: legacy.title,
    description: legacy.description,
    defaultLanguage: (legacy.language as SupportedLang) || "javascript",
    starterCodeByLang: { [(legacy.language || "javascript") as SupportedLang]: legacy.starterCode },
    testCasesByLang: { [(legacy.language || "javascript") as SupportedLang]: legacy.testCases ?? [] },
  };
}

function isMultiSaved(s: any): s is SavedSubmissionMulti {
  return !!s && typeof s === "object" && "byLanguage" in s;
}

export function CodeSection({ pageId, sectionId, content, savedSubmission }: CodeSectionProps) {
  const normalized = useMemo(() => normalizeContent(content), [content]);

  const initialSelectedLang: SupportedLang = useMemo(() => {
    // If we stored a selectedLanguage, prefer it
    if (isMultiSaved(savedSubmission) && savedSubmission.selectedLanguage) return savedSubmission.selectedLanguage;

    // Otherwise use section defaultLanguage
    const dl = normalized.defaultLanguage;
    if (dl) return dl;

    return "javascript";
  }, [normalized.defaultLanguage, savedSubmission]);

  const [selectedLang, setSelectedLang] = useState<SupportedLang>(initialSelectedLang);

  const starterForLang = useMemo(() => {
    const fromMap = normalized.starterCodeByLang?.[selectedLang];
    if (typeof fromMap === "string" && fromMap.length) return fromMap;

    // fallback: any available starter code
    const any = Object.values(normalized.starterCodeByLang || {}).find((v) => typeof v === "string" && v.trim());
    return any || "";
  }, [normalized.starterCodeByLang, selectedLang]);

  const testCasesForLang: TestCase[] = useMemo(() => {
    const byLang = normalized.testCasesByLang?.[selectedLang];
    if (Array.isArray(byLang) && byLang.length) return byLang;

    // fallback: if defaultLanguage has tests
    const dl = normalized.defaultLanguage;
    const dlTests = normalized.testCasesByLang?.[dl];
    if (Array.isArray(dlTests) && dlTests.length) return dlTests;

    return [];
  }, [normalized.defaultLanguage, normalized.testCasesByLang, selectedLang]);

  // Current code in editor
  const [code, setCode] = useState<string>(starterForLang);

  // Run output / verdict UI
  const [running, setRunning] = useState(false);
  const [review, setReview] = useState<ReviewResponse | null>(null);
  const [testResults, setTestResults] = useState<ExecResult[]>([]);
  const [allPassed, setAllPassed] = useState(false);

  // When language changes, load existing saved code for that language if present,
  // otherwise load starter code for that language.
  useEffect(() => {
    if (isMultiSaved(savedSubmission)) {
      const saved = savedSubmission.byLanguage?.[selectedLang];
      if (saved?.code != null) {
        setCode(saved.code);
        setTestResults(saved.results || []);
        setAllPassed(!!saved.allPassed);
        setReview(saved.output ? { output: saved.output, allPassed: saved.allPassed, results: saved.results } : null);
        return;
      }
    } else if (savedSubmission && (savedSubmission as SavedSubmissionLegacy).code) {
      const legacy = savedSubmission as SavedSubmissionLegacy;
      // If legacy submission language matches selectedLang, load it
      if ((legacy.language as SupportedLang) === selectedLang) {
        setCode(legacy.code);
        setTestResults(legacy.results || []);
        setAllPassed(!!legacy.allPassed);
        setReview(legacy.output ? { output: legacy.output, allPassed: legacy.allPassed, results: legacy.results } : null);
        return;
      }
    }

    setCode(starterForLang);
    setTestResults([]);
    setAllPassed(false);
    setReview(null);
  }, [selectedLang, savedSubmission, starterForLang]);

  const visibleTestCases = useMemo(() => testCasesForLang.filter((t) => !t.hidden), [testCasesForLang]);

  const monacoLang = useMemo(() => {
    return LANGS.find((l) => l.id === selectedLang)?.monaco ?? "javascript";
  }, [selectedLang]);

  const handleRun = async () => {
    setRunning(true);
    setReview(null);
    setTestResults([]);
    setAllPassed(false);

    try {
      const res = await fetch("/api/code-execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          language: selectedLang,
          testCases: testCasesForLang,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as ReviewResponse;

      if (!res.ok) {
        setReview({ error: data?.error || "Failed to run" });
        return;
      }

      setReview(data);
      setTestResults(Array.isArray(data.results) ? data.results : []);
      setAllPassed(!!data.allPassed);

      // Save progress (same endpoint you use elsewhere)
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId,
          action: "code",
          data: {
            sectionId,
            code,
            language: selectedLang,
            results: Array.isArray(data.results) ? data.results : [],
            allPassed: !!data.allPassed,
            output: typeof data.output === "string" ? data.output : undefined,
          },
        }),
      });
    } catch (e) {
      setReview({ error: "Something went wrong running code" });
    } finally {
      setRunning(false);
    }
  };

  const handleReset = () => {
    setCode(starterForLang);
    setReview(null);
    setTestResults([]);
    setAllPassed(false);
  };

  const verdictBadge = (() => {
    const v = review?.verdict;
    if (!v) return null;
    const cfg = verdictConfig[v];
    return (
      <span className={cn("inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium", cfg.bg, cfg.border, cfg.color)}>
        {cfg.label}
        {typeof review?.confidence === "number" ? ` • ${Math.round(review.confidence * 100)}%` : ""}
      </span>
    );
  })();

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border p-6 lg:p-8">
        <div className="mb-2 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground lg:text-xl">{normalized.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{normalized.description}</p>
          </div>

          <div className="flex items-center gap-2">
            {verdictBadge}
            <Button variant="outline" size="sm" onClick={handleReset} disabled={running} className="bg-transparent gap-2">
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            <Button size="sm" onClick={handleRun} disabled={running} className="gap-2">
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {running ? "Checking..." : "Check Code"}
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-muted-foreground">
            Select language and submit; your progress will save per-language.
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Language</label>
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value as SupportedLang)}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
              disabled={running}
            >
              {LANGS.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="p-6 lg:p-8">
        <div className="overflow-hidden rounded-xl border border-border">
          <MonacoEditor
            height="360px"
            language={monacoLang}
            value={code}
            onChange={(v) => setCode(v ?? "")}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              tabSize: 2,
              automaticLayout: true,
            }}
          />
        </div>

        {/* AI feedback / output */}
        <div className="mt-4 rounded-xl border border-border bg-muted/20 p-4">
          <div className="mb-2 flex items-center gap-2">
            {review?.error ? (
              <>
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium text-foreground">Error</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Feedback</span>
              </>
            )}
          </div>

          {review?.message ? (
            <p className="text-sm text-muted-foreground">{review.message}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Run “Check Code” to see AI feedback and test case results.
            </p>
          )}

          {typeof review?.output === "string" && review.output.trim() && (
            <div className="mt-3">
              <h4 className="mb-2 text-sm font-medium text-foreground">Output</h4>
              <pre className="whitespace-pre-wrap text-xs text-muted-foreground">
                <code>{review.output}</code>
              </pre>
            </div>
          )}
        </div>

        {/* Test results */}
        {visibleTestCases.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-medium text-foreground">Test Cases</h4>

            {visibleTestCases.map((tc, i) => {
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
                    <p>
                      <span className="font-medium">Got:</span> {result.output}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {visibleTestCases.length === 0 && (
          <p className="mt-4 text-xs text-muted-foreground">
            No visible test cases for this language.
          </p>
        )}

        {allPassed && (
          <div className="mt-4 rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-600">
            All tests passed for {selectedLang}.
          </div>
        )}
      </div>
    </div>
  );
}
