"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Check,
  BookOpen,
  FileText,
  Code,
  HelpCircle,
  ImageIcon,
} from "lucide-react";
import { TextSection } from "./text-section";
import { MCQSection } from "./mcq-section";
import { ImageSection } from "./image-section";
import { cn } from "@/lib/utils";

const CodeSection = dynamic(
  () => import("./code-section").then((m) => m.CodeSection),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-96 items-center justify-center rounded-2xl border border-border bg-card">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          <span className="text-sm text-muted-foreground">Loading editor...</span>
        </div>
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

const getSectionIcon = (type: string) => {
  switch (type) {
    case "text":
      return FileText;
    case "code":
      return Code;
    case "mcq":
      return HelpCircle;
    case "image":
      return ImageIcon;
    default:
      return FileText;
  }
};

const getSectionType = (sections: Section[]) => {
  if (sections.length === 0) return "text";
  // Return the type of the first non-text section, or text if all are text
  const mainSection = sections.find(s => s.type !== "text") || sections[0];
  return mainSection?.type || "text";
};

export function LearningLayout({
  course,
  pages,
  currentPage,
  prevPage,
  nextPage,
  courseId,
  isCompleted,
  progress,
}: LearningLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [completed, setCompleted] = useState(isCompleted);

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

  const currentPageIndex = pages.findIndex((p) => p.id === currentPage.id);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 border-r border-border bg-card/50 backdrop-blur-sm transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <Link
            href={`/courses/${courseId}`}
            className="flex items-center gap-2 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
            <span className="truncate">{course.title}</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress indicator */}
        <div className="border-b border-border px-4 py-3">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium text-foreground">
              {currentPageIndex + 1} / {pages.length}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{
                width: `${((currentPageIndex + 1) / pages.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Navigation */}
        <nav
          className="overflow-y-auto p-3"
          style={{ height: "calc(100vh - 7.5rem)" }}
        >
          <div className="space-y-1">
            {pages.map((page, index) => {
              const isActive = page.id === currentPage.id;
              const Icon = getSectionIcon("text"); // Could be enhanced to show section type

              return (
                <Link
                  key={page.id}
                  href={`/courses/${courseId}/learn/${page.id}`}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
                    isActive
                      ? "bg-primary/10 text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground group-hover:bg-muted-foreground/20"
                    )}
                  >
                    {index + 1}
                  </div>
                  <span className="flex-1 truncate">{page.title}</span>
                  {isActive && (
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex flex-1 flex-col lg:ml-72">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
          <div className="flex h-16 items-center justify-between px-4 lg:px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2">
                <div className="hidden items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground sm:flex">
                  {(() => {
                    const type = getSectionType(currentPage.sections);
                    const Icon = getSectionIcon(type);
                    return (
                      <>
                        <Icon className="h-3 w-3" />
                        <span className="capitalize">{type}</span>
                      </>
                    );
                  })()}
                </div>
                <h1 className="text-lg font-semibold text-foreground">
                  {currentPage.title}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {completed ? (
                <div className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-600">
                  <Check className="h-3.5 w-3.5" />
                  Completed
                </div>
              ) : (
                <Button
                  onClick={handleComplete}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 bg-transparent"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Mark Complete</span>
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div
          className="flex-1 overflow-y-auto"
          style={{ height: "calc(100vh - 8rem)" }}
        >
          <div className="mx-auto max-w-4xl px-4 py-8 lg:px-6">
            <div className="space-y-6">
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

        {/* Footer Navigation */}
        <footer className="sticky bottom-0 border-t border-border bg-background/80 backdrop-blur-sm">
          <div className="flex h-16 items-center justify-between px-4 lg:px-6">
            <div>
              {prevPage ? (
                <Link href={`/courses/${courseId}/learn/${prevPage.id}`}>
                  <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Previous</span>
                  </Button>
                </Link>
              ) : (
                <div />
              )}
            </div>

            <div className="text-xs text-muted-foreground">
              Page {currentPageIndex + 1} of {pages.length}
            </div>

            <div>
              {nextPage ? (
                <Link href={`/courses/${courseId}/learn/${nextPage.id}`}>
                  <Button size="sm" className="gap-2">
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <Link href={`/courses/${courseId}`}>
                  <Button size="sm" className="gap-2">
                    <span>Finish</span>
                    <Check className="h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </footer>
      </main>

      {/* Mobile Overlay */}
      {/* {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )} */}
    </div>
  );
}