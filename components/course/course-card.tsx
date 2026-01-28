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
    <Link href={`/courses/${id}`} className="group">
      <Card className="h-full overflow-hidden border-border/50 transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10">
        <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-primary/5 via-muted to-primary/10">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl || "/placeholder.svg"}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <BookOpen className="h-12 w-12 text-primary/30" />
            </div>
          )}
          {price === 0 ? (
            <div className="absolute right-3 top-3 rounded-full bg-success/90 p-2 shadow-lg backdrop-blur-sm">
              <Unlock className="h-4 w-4 text-success-foreground" />
            </div>
          ) : (
            <div className="absolute right-3 top-3 rounded-full bg-background/90 p-2 shadow-lg backdrop-blur-sm ring-1 ring-border">
              <Lock className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </div>
        <CardHeader className="pb-3">
          <CardTitle className="line-clamp-2 text-balance text-base leading-snug">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="line-clamp-2 text-pretty text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">
              {price === 0 ? "Free" : "Premium"}
            </span>
            {isEnrolled && (
              <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary ring-1 ring-primary/30">
                Enrolled
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
