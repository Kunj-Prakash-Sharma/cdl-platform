"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Building, FlaskConical, GraduationCap, LayoutDashboard, RotateCcw, School, ShieldCheck, UserRound, Users } from "lucide-react";
import { toast } from "sonner";
import { ROLE_META } from "@/data/constants";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDemoStore } from "@/store/demo-store";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

export const ROLE_ICONS: Record<Role, React.ComponentType<{ className?: string }>> = {
  visitor: Users,
  learner: GraduationCap,
  parent: UserRound,
  "college-admin": Building,
  "college-student": School,
  mentor: LayoutDashboard,
  admin: ShieldCheck,
};

export const ROLE_ORDER: Role[] = ["visitor", "learner", "parent", "college-admin", "college-student", "mentor", "admin"];

/** Floating "Demo" control available on every screen: jump between portals or reset demo data. */
export function DemoSwitcher() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const role = useDemoStore((s) => s.role);
  const setRole = useDemoStore((s) => s.setRole);
  const resetDemo = useDemoStore((s) => s.resetDemo);

  if (pathname === "/demo") return null;
  // In portals the desktop sidebar owns the bottom-left corner (user menu), so sit just right of it.
  const inPortal = /^\/(dashboard|college|campus|mentor|admin)(\/|$)/.test(pathname);

  const go = (r: Role) => {
    setRole(r);
    setOpen(false);
    router.push(ROLE_META[r].home);
  };

  return (
    <div className={cn("no-print fixed bottom-4 left-4 z-50", inPortal && "lg:left-[272px]")}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex h-10 items-center gap-2 rounded-full bg-navy px-4 text-sm font-medium text-navy-foreground shadow-lg ring-1 ring-white/10 transition hover:brightness-110"
            aria-label="Open demo switcher"
          >
            <FlaskConical className="size-4 text-brand-soft" />
            <span>Demo</span>
            <span className="hidden max-w-36 truncate text-xs text-white/60 sm:inline">· {ROLE_META[role].label}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent side="top" align="start" className="w-80 p-2">
          <div className="px-2 pt-1 pb-2">
            <p className="font-heading text-sm font-semibold">Explore as…</p>
            <p className="text-xs text-muted-foreground">Prototype only — no real login, payments or data.</p>
          </div>
          <div className="space-y-0.5">
            {ROLE_ORDER.map((r) => {
              const Icon = ROLE_ICONS[r];
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => go(r)}
                  className={cn("flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left hover:bg-accent", role === r && "bg-accent")}
                >
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{ROLE_META[r].label}</span>
                    <span className="block truncate text-xs text-muted-foreground">{ROLE_META[r].description}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <Separator className="my-2" />
          <div className="flex items-center justify-between gap-2 px-1">
            <Button variant="ghost" size="sm" onClick={() => { setOpen(false); router.push("/demo"); }}>
              All demo journeys
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                resetDemo();
                setOpen(false);
                toast.success("Demo data reset", { description: "All simulated changes were cleared." });
              }}
            >
              <RotateCcw /> Reset data
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
