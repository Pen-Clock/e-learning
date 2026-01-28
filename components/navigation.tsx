import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { BookOpen } from "lucide-react";

export function Navigation() {
  return (
    <nav className="border-b border-primary/10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 transition-all hover:scale-105">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-lg font-bold text-transparent">Luckily</span>
            </Link>
            <div className="hidden md:flex md:gap-6">
              <Link
                href="/"
                className="text-sm font-medium text-foreground/70 transition-colors hover:text-primary"
              >
                Courses
              </Link>
              <Link
                href="/my-courses"
                className="text-sm font-medium text-foreground/70 transition-colors hover:text-primary"
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
