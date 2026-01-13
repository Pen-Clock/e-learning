"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

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
    <div className="rounded-lg border border-border bg-card p-8">
      <h3 className="mb-6 text-lg font-semibold">{content.question}</h3>

      <div className="space-y-3">
        {content.options.map((option) => {
          const isSelected = selectedOption === option.id;
          const showCorrect = submitted && option.isCorrect;
          const showIncorrect = submitted && isSelected && !option.isCorrect;

          return (
            <button
              key={option.id}
              onClick={() => !submitted && setSelectedOption(option.id)}
              disabled={submitted}
              className={`w-full rounded-md border p-4 text-left transition-all ${
                isSelected && !submitted
                  ? "border-primary bg-primary/5"
                  : showCorrect
                  ? "border-green-200 bg-green-50"
                  : showIncorrect
                  ? "border-red-200 bg-red-50"
                  : "border-border hover:border-primary/50"
              } ${submitted ? "cursor-not-allowed" : "cursor-pointer"}`}
            >
              <div className="flex items-center justify-between">
                <span>{option.text}</span>
                {showCorrect && <Check className="h-5 w-5 text-green-600" />}
                {showIncorrect && <X className="h-5 w-5 text-red-600" />}
              </div>
            </button>
          );
        })}
      </div>

      {submitted && (
        <div
          className={`mt-6 rounded-md p-4 ${
            isCorrect ? "bg-green-50" : "bg-red-50"
          }`}
        >
          <p
            className={`mb-2 font-medium ${
              isCorrect ? "text-green-800" : "text-red-800"
            }`}
          >
            {isCorrect ? "Correct!" : "Incorrect"}
          </p>
          {content.explanation && (
            <p className="text-sm text-foreground/80">{content.explanation}</p>
          )}
        </div>
      )}

      <div className="mt-6 flex gap-3">
        {!submitted ? (
          <Button onClick={handleSubmit} disabled={!selectedOption} className="w-full">
            Submit Answer
          </Button>
        ) : (
          <Button onClick={handleReset} variant="outline" className="w-full">
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}