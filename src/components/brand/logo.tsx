import { useId } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** CDL mark: a compass-like "C" arc with a rising path — discovery + growth. */
export function LogoMark({ className }: { className?: string }) {
  // Unique per instance: a shared id breaks when the first copy sits inside a hidden (display:none) sidebar.
  const gradientId = `cdl-mark-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg viewBox="0 0 40 40" className={cn("size-8", className)} aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.36 0.13 268)" />
          <stop offset="100%" stopColor="oklch(0.25 0.08 268)" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill={`url(#${gradientId})`} />
      <path d="M27.5 13.2A10 10 0 1 0 27.5 26.8" fill="none" stroke="white" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M17 24.5 21.5 19.5 24.5 22 30 15.5" fill="none" stroke="oklch(0.78 0.11 186)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="30" cy="15.5" r="2.1" fill="oklch(0.78 0.11 186)" />
    </svg>
  );
}

export function Logo({
  href = "/",
  className,
  subtitle,
  inverted,
}: {
  href?: string | null;
  className?: string;
  subtitle?: string;
  inverted?: boolean;
}) {
  const content = (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark className={inverted ? "rounded-[11px] ring-1 ring-white/25" : undefined} />
      <span className="flex flex-col leading-none">
        <span className={cn("font-heading text-[15px] font-bold tracking-tight", inverted ? "text-white" : "text-primary")}>
          Career Design Lab
        </span>
        <span className={cn("mt-1 text-[10.5px] font-medium tracking-wide uppercase", inverted ? "text-white/60" : "text-muted-foreground")}>
          {subtitle ?? "Discover · Learn · Grow"}
        </span>
      </span>
    </span>
  );
  if (href === null) return content;
  return (
    <Link href={href} className="rounded-lg focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none" aria-label="Career Design Lab home">
      {content}
    </Link>
  );
}
