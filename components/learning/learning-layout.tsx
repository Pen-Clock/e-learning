"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Check,
  BookOpen,
} from "lucide-react";
import { TextSection } from "./text-section";
import { MCQSection } from "./mcq-section";
import { ImageSection } from "./image-section";

const CodeSection = dynamic(
  () => import("./code-section").then((m) => m.CodeSection),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-lg border border-border bg-card p-8">
        Loading editor...
      </div>
    ),
  }
);

interface Page {
  id: string;
  title: string;
  orderIndex: number;
}

interface Section {
  id: string;
  type: "text" | "mcq" | "code" | "image";
  orderIndex: number;
  content: any;
}

interface CurrentPage extends Page {
  sections: Section[];
}

interface Course {
  id: string;
  title: string;
}

type ProgressDTO = {
  completedAt: string | null;
  mcqAnswers: Record<
    string,
    { selectedOption: string; isCorrect: boolean; answeredAt: string }
  >;
  codeSubmissions: Record<
    string,
    {
      code: string;
      language: string;
      allPassed: boolean;
      results: Array<{ passed: boolean; output: string; expected: string }>;
      output?: string;
      submittedAt: string;
    }
  >;
} | null;

interface LearningLayoutProps {
  course: Course;
  pages: Page[];
  currentPage: CurrentPage;
  prevPage: Page | null;
  nextPage: Page | null;
  courseId: string;
  userId: string;
  isCompleted: boolean;
  progress: ProgressDTO;
}

export function LearningLayout({
  course,
  pages,
  currentPage,
  prevPage,
  nextPage,
  courseId,
  userId,
  isCompleted,
  progress,
}: LearningLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [completed, setCompleted] = useState(isCompleted);
  const router = useRouter();

  const mcqAnswers = progress?.mcqAnswers ?? {};
  const codeSubmissions = progress?.codeSubmissions ?? {};

  const handleComplete = async () => {
    try {
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId: currentPage.id,
          action: "complete",
        }),
      });
      setCompleted(true);
    } catch (err) {
      console.error("Failed to mark as complete:", err);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <aside
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed inset-y-0 left-0 z-50 w-80 border-r border-border bg-background transition-transform lg:translate-x-0`}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-6">
          <Link
            href={`/courses/${courseId}`}
            className="flex items-center gap-2 text-sm font-medium hover:text-foreground/80"
          >
            <BookOpen className="h-4 w-4" />
            <span className="truncate">{course.title}</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav
          className="overflow-y-auto p-4"
          style={{ height: "calc(100vh - 4rem)" }}
        >
          <div className="space-y-1">
            {pages.map((page, index) => (
              <Link
                key={page.id}
                href={`/courses/${courseId}/learn/${page.id}`}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  page.id === currentPage.id
                    ? "bg-muted font-medium"
                    : "hover:bg-muted/50"
                }`}
              >
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded text-xs ${
                    page.id === currentPage.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {index + 1}
                </div>
                <span className="flex-1 truncate">{page.title}</span>
              </Link>
            ))}
          </div>
        </nav>
      </aside>

      <main className="flex-1 lg:ml-80">
        <header className="sticky top-0 z-40 border-b border-border bg-background">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden">
                <Menu className="h-5 w-5" />
              </button>
              <h1 className="text-lg font-semibold">{currentPage.title}</h1>
            </div>

            <div className="flex items-center gap-2">
              {!completed && (
                <Button
                  onClick={handleComplete}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Check className="h-4 w-4" />
                  Mark Complete
                </Button>
              )}
            </div>
          </div>
        </header>

        <div
          className="overflow-y-auto"
          style={{ height: "calc(100vh - 8rem)" }}
        >
          <div className="mx-auto max-w-4xl px-6 py-8">
            <div className="space-y-8">
              {currentPage.sections.map((section) => {
                if (section.type === "text") {
                  return (
                    <TextSection key={section.id} content={section.content} />
                  );
                }

                if (section.type === "image") {
                  return (
                    <ImageSection key={section.id} content={section.content} />
                  );
                }

                if (section.type === "mcq") {
                  return (
                    <MCQSection
                      key={section.id}
                      sectionId={section.id}
                      content={section.content}
                      pageId={currentPage.id}
                      savedAnswer={mcqAnswers[section.id]}
                    />
                  );
                }

                if (section.type === "code") {
                  return (
                    <CodeSection
                      key={section.id}
                      sectionId={section.id}
                      pageId={currentPage.id}
                      content={section.content}
                      savedSubmission={codeSubmissions[section.id]}
                    />
                  );
                }

                return null;
              })}
            </div>
          </div>
        </div>

        <footer className="sticky bottom-0 border-t border-border bg-background">
          <div className="flex h-16 items-center justify-between px-6">
            <div>
              {prevPage && (
                <Link href={`/courses/${courseId}/learn/${prevPage.id}`}>
                  <Button variant="outline" size="sm" className="gap-2">
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                </Link>
              )}
            </div>
            <div>
              {nextPage && (
                <Link href={`/courses/${courseId}/learn/${nextPage.id}`}>
                  <Button size="sm" className="gap-2">
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </footer>
      </main>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}