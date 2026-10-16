import { cn } from "@/lib/utils";

/** Standard marketing-site width + gutters. */
export function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-7xl px-4 md:px-6", className)}>{children}</div>;
}

/** Marketing section with the site's vertical rhythm. */
export function Section({
  id,
  className,
  containerClassName,
  children,
}: {
  id?: string;
  className?: string;
  containerClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={cn("scroll-mt-20 py-16 md:py-24", className)}>
      <Container className={containerClassName}>{children}</Container>
    </section>
  );
}

export function Eyebrow({ children, className, inverted }: { children: React.ReactNode; className?: string; inverted?: boolean }) {
  return (
    <p className={cn("text-xs font-semibold tracking-[0.14em] uppercase", inverted ? "text-teal-300" : "text-brand", className)}>{children}</p>
  );
}

/** Section heading block: eyebrow, h2, supporting copy and an optional action on the right. */
export function SectionIntro({
  eyebrow,
  title,
  description,
  action,
  align = "left",
  inverted,
  className,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  align?: "left" | "center";
  inverted?: boolean;
  className?: string;
}) {
  const centered = align === "center";
  return (
    <div className={cn("flex flex-col gap-6", centered ? "items-center text-center" : "md:flex-row md:items-end md:justify-between", className)}>
      <div className={cn("max-w-2xl", centered && "mx-auto")}>
        {eyebrow && <Eyebrow inverted={inverted}>{eyebrow}</Eyebrow>}
        <h2
          className={cn(
            "mt-3 font-heading text-3xl leading-tight font-bold tracking-tight text-balance md:text-[40px] md:leading-[1.1]",
            inverted && "text-white",
          )}
        >
          {title}
        </h2>
        {description && (
          <p className={cn("mt-4 text-base text-pretty md:text-lg", inverted ? "text-white/70" : "text-muted-foreground")}>{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
