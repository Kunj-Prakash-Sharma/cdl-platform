"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarClock, Check, Package } from "lucide-react";
import { getCourse } from "@/data";
import { formatINR, pct } from "@/lib/format";
import type { PricingPackage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDemoStore } from "@/store/demo-store";
import { FormatBadge } from "@/components/shared/badges";
import { EmptyState } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { packageSavings } from "../commerce";

export function PackagesGrid() {
  const packages = useDemoStore((s) => s.packages);
  const setCheckout = useDemoStore((s) => s.setCheckout);
  const router = useRouter();
  const active = useMemo(() => packages.filter((p) => p.active), [packages]);

  const choose = (pkg: PricingPackage) => {
    setCheckout({ kind: "package", refId: pkg.id });
    router.push("/checkout");
  };

  if (!active.length) {
    return (
      <EmptyState
        icon={Package}
        title="No packages on offer right now"
        description="Individual courses are still available in every format."
        className="mt-12"
        action={
          <Button asChild variant="outline">
            <Link href="/courses">Browse courses</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className={cn("mt-12 grid gap-5 md:grid-cols-2", active.length >= 4 ? "xl:grid-cols-4" : "xl:grid-cols-3")}>
      {active.map((pkg) => {
        const savings = packageSavings(pkg);
        const hi = pkg.highlight;
        return (
          <div
            key={pkg.id}
            className={cn(
              "relative flex flex-col rounded-2xl border p-6 shadow-xs",
              hi ? "border-transparent bg-navy text-navy-foreground shadow-lg ring-2 ring-brand/60" : "bg-card",
            )}
          >
            {hi && (
              <span className="absolute -top-3 left-6 rounded-full bg-brand px-3 py-1 text-[11px] font-semibold text-brand-foreground">
                Most popular
              </span>
            )}
            <div className="flex items-center justify-between gap-2">
              {pkg.format === "bundle" ? (
                <span
                  className={cn(
                    "inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-xs font-medium ring-1 ring-inset",
                    hi ? "bg-white/10 text-white ring-white/20" : "bg-warning-soft text-warning ring-warning/25",
                  )}
                >
                  <Package className="size-3.5" /> Bundle
                </span>
              ) : (
                <FormatBadge format={pkg.format} short className={hi ? "bg-white/10 text-white ring-white/20" : undefined} />
              )}
              <span className={cn("inline-flex items-center gap-1 text-xs", hi ? "text-white/60" : "text-muted-foreground")}>
                <CalendarClock className="size-3.5" /> {pkg.validity}
              </span>
            </div>
            <h3 className={cn("mt-5 font-heading text-xl font-bold", hi && "text-white")}>{pkg.name}</h3>
            <p className={cn("mt-1.5 text-sm", hi ? "text-white/70" : "text-muted-foreground")}>{pkg.description}</p>
            <div className="mt-5 flex items-baseline gap-2">
              <span className={cn("font-heading text-3xl font-bold tracking-tight", hi && "text-white")}>{formatINR(pkg.price)}</span>
              {pkg.compareAt && pkg.compareAt > pkg.price && (
                <span className={cn("text-sm line-through", hi ? "text-white/50" : "text-muted-foreground")}>{formatINR(pkg.compareAt)}</span>
              )}
            </div>
            {savings > 0 && pkg.compareAt && (
              <p className={cn("mt-1 text-xs font-semibold", hi ? "text-teal-300" : "text-success")}>
                Save {formatINR(savings)} ({pct(savings, pkg.compareAt)}% off)
              </p>
            )}
            <ul className={cn("mt-5 space-y-2.5 border-t pt-5", hi && "border-white/15")}>
              {pkg.features.map((f) => (
                <li key={f} className="flex gap-2.5 text-sm">
                  <Check className={cn("mt-0.5 size-4 shrink-0", hi ? "text-teal-300" : "text-brand")} />
                  <span className={hi ? "text-white/85" : undefined}>{f}</span>
                </li>
              ))}
            </ul>
            {pkg.courseIds.length <= 3 && (
              <div className="mt-5 flex flex-wrap gap-1.5">
                {pkg.courseIds.map((id) => {
                  const c = getCourse(id);
                  return c ? (
                    <Link
                      key={id}
                      href={`/courses/${id}`}
                      className={cn(
                        "rounded-md px-2 py-0.5 text-xs transition",
                        hi ? "bg-white/10 text-white/80 hover:bg-white/20" : "bg-muted text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {c.title}
                    </Link>
                  ) : null;
                })}
              </div>
            )}
            <div className="mt-auto pt-6">
              <Button
                onClick={() => choose(pkg)}
                className={cn("h-11 w-full text-[15px]", hi ? "bg-brand text-brand-foreground hover:bg-brand/90" : "")}
                variant={hi ? "default" : "outline"}
              >
                Choose {pkg.format === "bundle" ? "bundle" : "package"} <ArrowRight />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
