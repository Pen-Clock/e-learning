import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Unlock, BookOpen } from "lucide-react";

interface CourseCardProps {
  id: string;
  title: string;
  description: string;
  price: number;
  thumbnailUrl: string | null;
  isEnrolled: boolean;
}

export function CourseCard({
  id,
  title,
  description,
  price,
  thumbnailUrl,
  isEnrolled,
}: CourseCardProps) {
  return (
    <Link href={`/courses/${id}`}>
      <Card className="h-full transition-all hover:border-foreground/20 hover:shadow-md">
        <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-muted">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <BookOpen className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-2 text-base">{title}</CardTitle>
            <div className="flex items-center gap-1 text-xs">
              {price === 0 ? (
                <Unlock className="h-4 w-4 text-green-600" />
              ) : (
                <Lock className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {description}
          </p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm font-medium">
              {price === 0 ? "Free" : "Premium"}
            </span>
            {isEnrolled && (
              <span className="rounded bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                Enrolled
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}