"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, X, RotateCcw, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

interface MCQOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface MCQSectionProps {
  content: {
    question: string;
    options: MCQOption[];
    explanation?: string;
  };
  pageId: string;
  sectionId: string;
  savedAnswer?: {
    selectedOption: string;
    isCorrect: boolean;
    answeredAt: string;
  };
}

export function MCQSection({ content, pageId, sectionId, savedAnswer }: MCQSectionProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  useEffect(() => {
    if (!savedAnswer) return;
    setSelectedOption(savedAnswer.selectedOption);
    setSubmitted(true);
    setIsCorrect(savedAnswer.isCorrect);
  }, [savedAnswer]);

  const handleSubmit = async () => {
    if (!selectedOption) return;

    const selected = content.options.find((opt) => opt.id === selectedOption);
    const correct = selected?.isCorrect || false;

    setIsCorrect(correct);
    setSubmitted(true);

    try {
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId,
          action: "mcq",
          data: { sectionId, selectedOption, isCorrect: correct },
        }),
      });
    } catch (err) {
      console.error("Failed to save MCQ answer:", err);
    }
  };

  const handleReset = () => {
    setSelectedOption(null);
    setSubmitted(false);
    setIsCorrect(false);
  };

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm">
      {/* Question Header */}
      <div className="border-b border-border p-6 lg:p-8">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
            <Lightbulb className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Question
          </span>
        </div>
        <h3 className="text-lg font-semibold text-foreground lg:text-xl">
          {content.question}
        </h3>
      </div>

      {/* Options */}
      <div className="p-6 lg:p-8">
        <div className="space-y-3">
          {content.options.map((option, index) => {
            const isSelected = selectedOption === option.id;
            const showCorrect = submitted && option.isCorrect;
            const showIncorrect = submitted && isSelected && !option.isCorrect;

            return (
              <button
                key={option.id}
                onClick={() => !submitted && setSelectedOption(option.id)}
                disabled={submitted}
                className={cn(
                  "group relative w-full rounded-xl border p-4 text-left transition-all duration-200",
                  !submitted && "hover:border-primary/50 hover:bg-muted/50",
                  isSelected && !submitted && "border-primary bg-primary/5 ring-1 ring-primary/20",
                  showCorrect && "border-green-500/50 bg-green-500/10",
                  showIncorrect && "border-red-500/50 bg-red-500/10",
                  !isSelected && !showCorrect && !showIncorrect && "border-border",
                  submitted ? "cursor-default" : "cursor-pointer"
                )}
              >
                <div className="flex items-center gap-4">
                  {/* Option Letter */}
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-medium transition-colors",
                      isSelected && !submitted && "bg-primary text-primary-foreground",
                      showCorrect && "bg-green-500 text-white",
                      showIncorrect && "bg-red-500 text-white",
                      !isSelected && !showCorrect && !showIncorrect && "bg-muted text-muted-foreground"
                    )}
                  >
                    {String.fromCharCode(65 + index)}
                  </div>

                  {/* Option Text */}
                  <span className={cn(
                    "flex-1 text-sm lg:text-base",
                    showCorrect && "text-green-700",
                    showIncorrect && "text-red-700",
                    !showCorrect && !showIncorrect && "text-foreground"
                  )}>
                    {option.text}
                  </span>

                  {/* Status Icon */}
                  {showCorrect && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                  {showIncorrect && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500">
                      <X className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Feedback */}
        {submitted && (
          <div
            className={cn(
              "mt-6 rounded-xl p-4",
              isCorrect ? "bg-green-500/10 border border-green-500/20" : "bg-red-500/10 border border-red-500/20"
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  isCorrect ? "bg-green-500" : "bg-red-500"
                )}
              >
                {isCorrect ? (
                  <Check className="h-4 w-4 text-white" />
                ) : (
                  <X className="h-4 w-4 text-white" />
                )}
              </div>
              <div>
                <p
                  className={cn(
                    "mb-1 font-semibold",
                    isCorrect ? "text-green-700" : "text-red-700"
                  )}
                >
                  {isCorrect ? "Correct!" : "Incorrect"}
                </p>
                {content.explanation && (
                  <p className="text-sm text-foreground/70">{content.explanation}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6">
          {!submitted ? (
            <Button
              onClick={handleSubmit}
              disabled={!selectedOption}
              className="w-full gap-2"
              size="lg"
            >
              <Check className="h-4 w-4" />
              Submit Answer
            </Button>
          ) : (
            <Button
              onClick={handleReset}
              variant="outline"
              className="w-full gap-2 bg-transparent"
              size="lg"
            >
              <RotateCcw className="h-4 w-4" />
              Try Again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}