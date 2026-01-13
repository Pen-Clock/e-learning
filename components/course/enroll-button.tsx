"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AccessCodeModal } from "./access-code-modal";

interface EnrollButtonProps {
  courseId: string;
  isFree: boolean;
}

export function EnrollButton({ courseId, isFree }: EnrollButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleEnroll = async () => {
    if (!isFree) {
      setShowModal(true);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/enrollment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={handleEnroll} disabled={loading} size="lg">
        {loading ? "Enrolling..." : isFree ? "Enroll for Free" : "Enter Access Code"}
      </Button>

      {showModal && (
        <AccessCodeModal
          courseId={courseId}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}