"use client";

interface TextSectionProps {
  content: {
    html: string;
  };
}

export function TextSection({ content }: TextSectionProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm lg:p-8">
      <div
        className="prose prose-slate max-w-none prose-headings:text-foreground prose-p:text-foreground/80 prose-a:text-primary prose-strong:text-foreground prose-code:rounded prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:text-foreground prose-pre:bg-muted"
        dangerouslySetInnerHTML={{ __html: content.html }}
        style={{
          fontSize: "1rem",
          lineHeight: "1.75",
        }}
      />
    </div>
  );
}