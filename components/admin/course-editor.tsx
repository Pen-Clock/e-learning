"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Edit2, Trash2 } from "lucide-react";
import { PageEditorModal } from "./page-editor-modal";

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  accessCode: string | null;
  isPublished: boolean;
}

interface Page {
  id: string;
  title: string;
  orderIndex: number;
}

interface CourseEditorProps {
  course: Course;
  pages: Page[];
}

export function CourseEditor({ course, pages }: CourseEditorProps) {
  const router = useRouter();
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [showPageModal, setShowPageModal] = useState(false);
  const [formData, setFormData] = useState({
    title: course.title,
    description: course.description,
    price: course.price.toString(),
    accessCode: course.accessCode || "",
    isPublished: course.isPublished,
  });
  const [saving, setSaving] = useState(false);

  const handleUpdateCourse = async () => {
    setSaving(true);
    try {
      await fetch(`/api/admin/courses/${course.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: parseInt(formData.price),
        }),
      });
      router.refresh();
    } catch (err) {
      console.error("Failed to update course:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePage = async (pageId: string) => {
    if (!confirm("Are you sure you want to delete this page?")) return;

    try {
      await fetch(`/api/admin/pages/${pageId}`, {
        method: "DELETE",
      });
      router.refresh();
    } catch (err) {
      console.error("Failed to delete page:", err);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href="/admin"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">
          Edit Course
        </h1>
        <p className="text-muted-foreground">
          Manage course details and content
        </p>
      </div>

      <div className="space-y-8">
        {/* Course Details */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-xl font-semibold">Course Details</h2>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Title</label>
              <Input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">Price</label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  min="0"
                />
              </div>

              {formData.price !== "0" && (
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Access Code
                  </label>
                  <Input
                    type="text"
                    value={formData.accessCode}
                    onChange={(e) =>
                      setFormData({ ...formData, accessCode: e.target.value })
                    }
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="published"
                checked={formData.isPublished}
                onChange={(e) =>
                  setFormData({ ...formData, isPublished: e.target.checked })
                }
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="published" className="text-sm font-medium">
                Published (visible to students)
              </label>
            </div>

            <Button onClick={handleUpdateCourse} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* Course Pages */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Course Pages</h2>
            <Button
              onClick={() => {
                setEditingPage(null);
                setShowPageModal(true);
              }}
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Page
            </Button>
          </div>

          <div className="space-y-2">
            {pages.map((page, index) => (
              <div
                key={page.id}
                className="flex items-center justify-between rounded-md border border-border p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded bg-muted text-sm font-medium">
                    {index + 1}
                  </span>
                  <span className="font-medium">{page.title}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingPage(page);
                      setShowPageModal(true);
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeletePage(page.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {pages.length === 0 && (
              <div className="rounded-md border border-dashed border-border p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No pages yet. Add your first page to get started.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showPageModal && (
        <PageEditorModal
          courseId={course.id}
          page={editingPage}
          pageCount={pages.length}
          onClose={() => {
            setShowPageModal(false);
            setEditingPage(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}