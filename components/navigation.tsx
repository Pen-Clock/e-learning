import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { BookOpen } from "lucide-react";

export function Navigation() {
  return (
    <nav className="border-b border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <BookOpen className="h-6 w-6" />
              <span className="text-lg font-semibold">Luckily</span>
            </Link>
            <div className="hidden md:flex md:gap-6">
              <Link
                href="/"
                className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
              >
                Courses
              </Link>
              <Link
                href="/my-courses"
                className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
              >
                My Learning
              </Link>
            </div>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </nav>
  );
}