"use client";

interface TextSectionProps {
  content: {
    html: string;
  };
}

export function TextSection({ content }: TextSectionProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-8">
      <div
        className="prose prose-slate max-w-none"
        dangerouslySetInnerHTML={{ __html: content.html }}
        style={{
          fontSize: "1rem",
          lineHeight: "1.75",
        }}
      />
    </div>
  );
}