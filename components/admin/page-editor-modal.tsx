"use client";

import { useEffect, useState } from "react";
import { X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PageEditorModalProps {
  courseId: string;
  page: { id: string; title: string; orderIndex: number } | null;
  pageCount: number;
  onClose: () => void;
}

type SectionType = "text" | "mcq" | "code" | "image";

interface Section {
  id?: string;
  type: SectionType;
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
      void loadPageSections();
    } else {
      setSections([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page?.id]);

  const makeLocalId = () => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  };

  const normalizeSections = (next: Section[]) =>
    next.map((s, i) => ({ ...s, orderIndex: i }));

  const safeParseJson = (value: unknown) => {
    if (typeof value !== "string") return value;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  };

  const loadPageSections = async () => {
    if (!page) return;
    try {
      const response = await fetch(`/api/admin/pages/${page.id}`);
      const data = await response.json();

      const loaded = (data.sections || []).map((s: any) => ({
        id: s.id,
        type: s.type as SectionType,
        orderIndex: s.orderIndex,
        content: safeParseJson(s.content),
      }));

      setSections(normalizeSections(loaded));
    } catch (err) {
      console.error("Failed to load sections:", err);
    }
  };

  const getDefaultContent = (type: SectionType) => {
    switch (type) {
      case "text":
        return { html: "<p>Enter your content here...</p>" };

      case "mcq":
        return {
          question: "Your question here?",
          options: [
            { id: makeLocalId(), text: "Option 1", isCorrect: false },
            { id: makeLocalId(), text: "Option 2", isCorrect: true },
          ],
          explanation: "Explanation here...",
        };

      case "code":
        return {
          title: "Coding Challenge",
          description: "Write a function that...",
          starterCode: "function solution(input) {\n  // Your code here\n}",
          language: "javascript",
          testCases: [{ input: "5", expectedOutput: "5", hidden: false }],
        };

      case "image":
        return {
          url: "",
          alt: "",
          caption: "",
        };

      default:
        return {};
    }
  };

  const handleAddSection = (type: SectionType) => {
    const newSection: Section = {
      type,
      orderIndex: sections.length,
      content: getDefaultContent(type),
    };
    setSections(normalizeSections([...sections, newSection]));
  };

  const handleUpdateSection = (index: number, content: any) => {
    const updated = [...sections];
    updated[index].content = content;
    setSections(normalizeSections(updated));
  };

  const handleDeleteSection = (index: number) => {
    setSections(normalizeSections(sections.filter((_, i) => i !== index)));
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= sections.length) return;

    const next = [...sections];
    const tmp = next[index];
    next[index] = next[nextIndex];
    next[nextIndex] = tmp;

    setSections(normalizeSections(next));
  };

  const addMcqOption = (sectionIndex: number) => {
    const section = sections[sectionIndex];
    const nextOptions = [
      ...(section.content.options || []),
      { id: makeLocalId(), text: "", isCorrect: false },
    ];
    handleUpdateSection(sectionIndex, {
      ...section.content,
      options: nextOptions,
    });
  };

  const deleteMcqOption = (sectionIndex: number, optionIndex: number) => {
    const section = sections[sectionIndex];
    const nextOptions = (section.content.options || []).filter(
      (_: any, i: number) => i !== optionIndex
    );
    handleUpdateSection(sectionIndex, {
      ...section.content,
      options: nextOptions,
    });
  };

  const setMcqCorrect = (sectionIndex: number, optionIndex: number) => {
    const section = sections[sectionIndex];
    const nextOptions = (section.content.options || []).map(
      (opt: any, i: number) => ({
        ...opt,
        isCorrect: i === optionIndex,
      })
    );
    handleUpdateSection(sectionIndex, {
      ...section.content,
      options: nextOptions,
    });
  };

  const addTestCase = (sectionIndex: number) => {
    const section = sections[sectionIndex];
    const nextTestCases = [
      ...(section.content.testCases || []),
      { input: "", expectedOutput: "", hidden: false },
    ];
    handleUpdateSection(sectionIndex, {
      ...section.content,
      testCases: nextTestCases,
    });
  };

  const deleteTestCase = (sectionIndex: number, testIndex: number) => {
    const section = sections[sectionIndex];
    const nextTestCases = (section.content.testCases || []).filter(
      (_: any, i: number) => i !== testIndex
    );
    handleUpdateSection(sectionIndex, {
      ...section.content,
      testCases: nextTestCases,
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const endpoint = page ? `/api/admin/pages/${page.id}` : "/api/admin/pages";
      const method = page ? "PATCH" : "POST";

      const payloadSections = normalizeSections(sections).map((s) => ({
        id: s.id,
        type: s.type,
        orderIndex: s.orderIndex,
        content: s.content,
      }));

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          title,
          orderIndex: page?.orderIndex ?? pageCount,
          sections: payloadSections,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        console.error("Failed to save page:", response.status, data);
        return;
      }

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
                onClick={() => handleAddSection("image")}
              >
                + Image
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

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => moveSection(index, -1)}
                      disabled={index === 0}
                    >
                      Up
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => moveSection(index, 1)}
                      disabled={index === sections.length - 1}
                    >
                      Down
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteSection(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {section.type === "text" && (
                  <textarea
                    value={section.content.html}
                    onChange={(e) =>
                      handleUpdateSection(index, { html: e.target.value })
                    }
                    rows={6}
                    placeholder="Enter HTML content..."
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  />
                )}

                {section.type === "image" && (
                  <div className="space-y-3">
                    <Input
                      value={section.content.url || ""}
                      onChange={(e) =>
                        handleUpdateSection(index, {
                          ...section.content,
                          url: e.target.value,
                        })
                      }
                      placeholder="Image URL (https://...)"
                    />
                    <Input
                      value={section.content.alt || ""}
                      onChange={(e) =>
                        handleUpdateSection(index, {
                          ...section.content,
                          alt: e.target.value,
                        })
                      }
                      placeholder="Alt text"
                    />
                    <Input
                      value={section.content.caption || ""}
                      onChange={(e) =>
                        handleUpdateSection(index, {
                          ...section.content,
                          caption: e.target.value,
                        })
                      }
                      placeholder="Caption (optional)"
                    />

                    {section.content.url?.trim() && (
                      <div className="overflow-hidden rounded-md border border-border">
                        <img
                          src={section.content.url.trim()}
                          alt={section.content.alt || "Image preview"}
                          className="w-full object-cover"
                        />
                      </div>
                    )}
                  </div>
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

                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Options</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addMcqOption(index)}
                      >
                        Add option
                      </Button>
                    </div>

                    {(section.content.options || []).map(
                      (opt: any, optIndex: number) => (
                        <div
                          key={opt.id || optIndex}
                          className="flex items-center gap-2"
                        >
                          <Input
                            value={opt.text}
                            onChange={(e) => {
                              const nextOptions = [...section.content.options];
                              nextOptions[optIndex] = {
                                ...nextOptions[optIndex],
                                text: e.target.value,
                              };
                              handleUpdateSection(index, {
                                ...section.content,
                                options: nextOptions,
                              });
                            }}
                            placeholder={`Option ${optIndex + 1}`}
                          />
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="radio"
                              name={`mcq-correct-${index}`}
                              checked={!!opt.isCorrect}
                              onChange={() => setMcqCorrect(index, optIndex)}
                              className="h-4 w-4"
                            />
                            Correct
                          </label>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteMcqOption(index, optIndex)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )
                    )}

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
                      rows={6}
                      placeholder="Starter code..."
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-sm"
                    />

                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-sm font-medium">Test cases</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addTestCase(index)}
                      >
                        Add test
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {(section.content.testCases || []).map(
                        (tc: any, tcIndex: number) => (
                          <div
                            key={tcIndex}
                            className="rounded-md border border-border p-3"
                          >
                            <div className="grid gap-2 sm:grid-cols-2">
                              <Input
                                value={tc.input}
                                onChange={(e) => {
                                  const next = [...section.content.testCases];
                                  next[tcIndex] = {
                                    ...next[tcIndex],
                                    input: e.target.value,
                                  };
                                  handleUpdateSection(index, {
                                    ...section.content,
                                    testCases: next,
                                  });
                                }}
                                placeholder="Input"
                              />
                              <Input
                                value={tc.expectedOutput}
                                onChange={(e) => {
                                  const next = [...section.content.testCases];
                                  next[tcIndex] = {
                                    ...next[tcIndex],
                                    expectedOutput: e.target.value,
                                  };
                                  handleUpdateSection(index, {
                                    ...section.content,
                                    testCases: next,
                                  });
                                }}
                                placeholder="Expected output"
                              />
                            </div>

                            <div className="mt-2 flex items-center justify-between">
                              <label className="flex items-center gap-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={!!tc.hidden}
                                  onChange={(e) => {
                                    const next = [...section.content.testCases];
                                    next[tcIndex] = {
                                      ...next[tcIndex],
                                      hidden: e.target.checked,
                                    };
                                    handleUpdateSection(index, {
                                      ...section.content,
                                      testCases: next,
                                    });
                                  }}
                                  className="h-4 w-4"
                                />
                                Hidden from students
                              </label>

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteTestCase(index, tcIndex)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {sections.length === 0 && (
              <div className="rounded-md border border-dashed border-border p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No sections yet. Add text, image, MCQ, or code sections above.
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