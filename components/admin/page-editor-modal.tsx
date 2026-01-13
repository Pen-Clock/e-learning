"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus, Trash2 } from "lucide-react";
import { getPageWithSections } from "@/lib/db/queries";

interface PageEditorModalProps {
  courseId: string;
  page: { id: string; title: string; orderIndex: number } | null;
  pageCount: number;
  onClose: () => void;
}

interface Section {
  id?: string;
  type: "text" | "mcq" | "code";
  orderIndex: number;
  content: any;
}

export function PageEditorModal({
  courseId,
  page,
  pageCount,
  onClose,
}: PageEditorModalProps) {
  const [title, setTitle] = useState(page?.title || "");
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (page) {
      loadPageSections();
    }
  }, [page]);

  const loadPageSections = async () => {
    if (!page) return;
    try {
      const response = await fetch(`/api/admin/pages/${page.id}`);
      const data = await response.json();
      setSections(data.sections || []);
    } catch (err) {
      console.error("Failed to load sections:", err);
    }
  };

  const handleAddSection = (type: "text" | "mcq" | "code") => {
    const newSection: Section = {
      type,
      orderIndex: sections.length,
      content: getDefaultContent(type),
    };
    setSections([...sections, newSection]);
  };

  const getDefaultContent = (type: string) => {
    switch (type) {
      case "text":
        return { html: "<p>Enter your content here...</p>" };
      case "mcq":
        return {
          question: "Your question here?",
          options: [
            { id: "1", text: "Option 1", isCorrect: false },
            { id: "2", text: "Option 2", isCorrect: true },
          ],
          explanation: "Explanation here...",
        };
      case "code":
        return {
          title: "Coding Challenge",
          description: "Write a function that...",
          starterCode: "function solution(input) {\n  // Your code here\n}",
          language: "javascript",
          testCases: [
            { input: "5", expectedOutput: "5", hidden: false },
          ],
        };
      default:
        return {};
    }
  };

  const handleUpdateSection = (index: number, content: any) => {
    const updated = [...sections];
    updated[index].content = content;
    setSections(updated);
  };

  const handleDeleteSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const endpoint = page
        ? `/api/admin/pages/${page.id}`
        : "/api/admin/pages";
      const method = page ? "PATCH" : "POST";

      await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          title,
          orderIndex: page?.orderIndex ?? pageCount,
          sections,
        }),
      });

      onClose();
    } catch (err) {
      console.error("Failed to save page:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
      <div className="relative my-8 w-full max-w-4xl rounded-lg bg-background p-6 shadow-lg">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="mb-6 text-2xl font-semibold">
          {page ? "Edit Page" : "Create Page"}
        </h2>

        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium">Page Title</label>
          <Input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Introduction to Variables"
          />
        </div>

        <div className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Sections</h3>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAddSection("text")}
              >
                + Text
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAddSection("mcq")}
              >
                + MCQ
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAddSection("code")}
              >
                + Code
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {sections.map((section, index) => (
              <div key={index} className="rounded-lg border border-border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">
                    {section.type} Section
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteSection(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {section.type === "text" && (
                  <textarea
                    value={section.content.html}
                    onChange={(e) =>
                      handleUpdateSection(index, { html: e.target.value })
                    }
                    rows={4}
                    placeholder="Enter HTML content..."
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  />
                )}

                {section.type === "mcq" && (
                  <div className="space-y-3">
                    <Input
                      value={section.content.question}
                      onChange={(e) =>
                        handleUpdateSection(index, {
                          ...section.content,
                          question: e.target.value,
                        })
                      }
                      placeholder="Question"
                    />
                    {section.content.options.map((opt: any, optIndex: number) => (
                      <div key={optIndex} className="flex gap-2">
                        <Input
                          value={opt.text}
                          onChange={(e) => {
                            const newOptions = [...section.content.options];
                            newOptions[optIndex].text = e.target.value;
                            handleUpdateSection(index, {
                              ...section.content,
                              options: newOptions,
                            });
                          }}
                          placeholder={`Option ${optIndex + 1}`}
                        />
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={opt.isCorrect}
                            onChange={(e) => {
                              const newOptions = [...section.content.options];
                              newOptions[optIndex].isCorrect = e.target.checked;
                              handleUpdateSection(index, {
                                ...section.content,
                                options: newOptions,
                              });
                            }}
                            className="h-4 w-4"
                          />
                          Correct
                        </label>
                      </div>
                    ))}
                    <Input
                      value={section.content.explanation || ""}
                      onChange={(e) =>
                        handleUpdateSection(index, {
                          ...section.content,
                          explanation: e.target.value,
                        })
                      }
                      placeholder="Explanation"
                    />
                  </div>
                )}

                {section.type === "code" && (
                  <div className="space-y-3">
                    <Input
                      value={section.content.title}
                      onChange={(e) =>
                        handleUpdateSection(index, {
                          ...section.content,
                          title: e.target.value,
                        })
                      }
                      placeholder="Challenge Title"
                    />
                    <Input
                      value={section.content.description}
                      onChange={(e) =>
                        handleUpdateSection(index, {
                          ...section.content,
                          description: e.target.value,
                        })
                      }
                      placeholder="Description"
                    />
                    <textarea
                      value={section.content.starterCode}
                      onChange={(e) =>
                        handleUpdateSection(index, {
                          ...section.content,
                          starterCode: e.target.value,
                        })
                      }
                      rows={4}
                      placeholder="Starter code..."
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-sm"
                    />
                  </div>
                )}
              </div>
            ))}

            {sections.length === 0 && (
              <div className="rounded-md border border-dashed border-border p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No sections yet. Add text, MCQ, or code sections above.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || !title}>
            {loading ? "Saving..." : "Save Page"}
          </Button>
        </div>
      </div>
    </div>
  );
}