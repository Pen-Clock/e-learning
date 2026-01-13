"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Play, Check, X, Loader2 } from "lucide-react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

interface TestCase {
  input: string;
  expectedOutput: string;
  hidden?: boolean;
}

interface CodeSectionProps {
  content: {
    title: string;
    description: string;
    starterCode: string;
    language: string;
    testCases: TestCase[];
  };
}

export function CodeSection({ content }: CodeSectionProps) {
  const [code, setCode] = useState(content.starterCode);
  const [output, setOutput] = useState<string>("");
  const [testResults, setTestResults] = useState<
    Array<{ passed: boolean; output: string; expected: string }>
  >([]);
  const [running, setRunning] = useState(false);
  const [allPassed, setAllPassed] = useState(false);

  const handleRunCode = async () => {
    setRunning(true);
    setOutput("");
    setTestResults([]);
    setAllPassed(false);

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

      const data = await response.json();

      if (data.error) {
        setOutput(`Error: ${data.error}`);
        return;
      }

      setTestResults(data.results);
      setOutput(data.output);
      setAllPassed(data.allPassed);
    } catch (err) {
      setOutput("Failed to execute code. Please try again.");
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
          />
        </div>

        <Button
          onClick={handleRunCode}
          disabled={running}
          className="mb-4 w-full gap-2"
        >
          {running ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Run Code
            </>
          )}
        </Button>

        {testResults.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Test Results</h4>
              {allPassed && (
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <Check className="h-4 w-4" />
                  All tests passed!
                </span>
              )}
            </div>

            {content.testCases.map((testCase, index) => {
              if (testCase.hidden) return null;
              const result = testResults[index];

              return (
                <div
                  key={index}
                  className={`rounded-md border p-4 ${
                    result.passed
                      ? "border-green-200 bg-green-50"
                      : "border-red-200 bg-red-50"
                  }`}
                >
                  <div className="mb-2 flex items-center gap-2">
                    {result.passed ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-sm font-medium">
                      Test Case {index + 1}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div>
                      <span className="font-medium">Input:</span>{" "}
                      <code className="rounded bg-black/5 px-1 py-0.5">
                        {testCase.input}
                      </code>
                    </div>
                    <div>
                      <span className="font-medium">Expected:</span>{" "}
                      <code className="rounded bg-black/5 px-1 py-0.5">
                        {result.expected}
                      </code>
                    </div>
                    <div>
                      <span className="font-medium">Got:</span>{" "}
                      <code className="rounded bg-black/5 px-1 py-0.5">
                        {result.output}
                      </code>
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
            <pre className="text-xs">
              <code>{output}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}