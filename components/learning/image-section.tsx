"use client";

interface ImageSectionProps {
  content: {
    url: string;
    alt?: string;
    caption?: string;
  };
}

export function ImageSection({ content }: ImageSectionProps) {
  if (!content?.url) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-8">
      <div className="overflow-hidden rounded-md border border-border">
        <img
          src={content.url}
          alt={content.alt || ""}
          className="w-full object-cover"
        />
      </div>

      {content.caption?.trim() && (
        <p className="mt-3 text-sm text-muted-foreground">{content.caption}</p>
      )}
    </div>
  );
}