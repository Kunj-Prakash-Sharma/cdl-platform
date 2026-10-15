"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, LayoutDashboard, Menu, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDemoStore } from "@/store/demo-store";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export const SITE_NAV = [
  { href: "/programs", label: "Explore Programs" },
  { href: "/discover", label: "Career Discovery" },
  { href: "/courses", label: "Courses" },
  { href: "/mentors", label: "Mentors" },
  { href: "/#how-it-works", label: "How It Works" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isLoggedIn = useDemoStore((s) => s.isLoggedIn);

  return (
    <header className="no-print sticky top-0 z-40 border-b border-transparent bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/70 [&:has(+main_[data-scrolled])]:border-border">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 md:px-6">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {SITE_NAV.map((item) => {
            const active = item.href !== "/#how-it-works" && (pathname === item.href || pathname.startsWith(item.href + "/"));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground",
                  active && "text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {isLoggedIn ? (
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link href="/dashboard">
                <LayoutDashboard /> My Dashboard
              </Link>
            </Button>
          ) : (
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link href="/login">Login</Link>
            </Button>
          )}
          <Button asChild size="lg" className="hidden bg-brand px-4 text-brand-foreground hover:bg-brand/90 md:inline-flex">
            <Link href="/discover">
              <Sparkles /> Start Free Career Discovery
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu" onClick={() => setOpen(true)}>
            <Menu />
          </Button>
        </div>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-80">
          <SheetHeader>
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <Logo />
          </SheetHeader>
          <nav className="flex flex-col gap-1 px-4" aria-label="Mobile">
            {SITE_NAV.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-[15px] font-medium hover:bg-accent">
                {item.label}
              </Link>
            ))}
            <Link href={isLoggedIn ? "/dashboard" : "/login"} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-[15px] font-medium hover:bg-accent">
              {isLoggedIn ? "My Dashboard" : "Login"}
            </Link>
          </nav>
          <div className="mt-auto p-4">
            <Button asChild size="lg" className="h-11 w-full bg-brand text-brand-foreground hover:bg-brand/90">
              <Link href="/discover" onClick={() => setOpen(false)}>
                Start Free Career Discovery <ArrowRight />
              </Link>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}

/** Minimal header for focused flows (discovery, login, checkout, assessments). */
export function FocusHeader({ right, className }: { right?: React.ReactNode; className?: string }) {
  return (
    <header className={cn("no-print sticky top-0 z-40 border-b bg-background/85 backdrop-blur-lg", className)}>
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 md:px-6">
        <Logo />
        <div className="ml-auto flex items-center gap-2">{right}</div>
      </div>
    </header>
  );
}
