"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronsUpDown, LogOut, Menu, Repeat } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ROLE_META } from "@/data/constants";
import type { AvatarSpec, Role } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDemoStore } from "@/store/demo-store";
import { useHydrated } from "@/store/hooks";
import { Logo } from "@/components/brand/logo";
import { Portrait } from "@/components/shared/portrait";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: React.ReactNode;
  /** Match only the exact path (use for portal home links) */
  exact?: boolean;
}

export interface NavSection {
  label?: string;
  items: NavItem[];
}

export interface PortalShellProps {
  portalLabel: string;
  sections: NavSection[];
  user: { name: string; subtitle: string; avatar?: AvatarSpec };
  /** Roles allowed in this portal; the first is applied when the current role doesn't match. */
  roles: Role[];
  homeHref: string;
  notificationsHref?: string;
  unreadCount?: number;
  /** Optional institution co-branding (college portals) */
  coBrand?: { name: string; shortName: string; color: string };
  children: React.ReactNode;
}

function isActive(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(item.href + "/");
}

export function PortalShell({ portalLabel, sections, user, roles, homeHref, notificationsHref, unreadCount = 0, coBrand, children }: PortalShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const role = useDemoStore((s) => s.role);
  const setRole = useDemoStore((s) => s.setRole);
  const logout = useDemoStore((s) => s.logout);
  const [mobileOpen, setMobileOpen] = useState(false);
  const hydrated = useHydrated();

  // Visiting a portal URL directly switches the demo role to match it.
  useEffect(() => {
    // Wait for saved state so the switch applies on top of it.
    if (hydrated && !roles.includes(role)) setRole(roles[0]);
  }, [hydrated, role, roles, setRole]);

  const nav = (
    <nav className="flex flex-col gap-5" aria-label={`${portalLabel} navigation`}>
      {sections.map((section, i) => (
        <div key={section.label ?? i}>
          {section.label && <p className="mb-1.5 px-3 text-[11px] font-semibold tracking-wider text-muted-foreground/80 uppercase">{section.label}</p>}
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const active = isActive(pathname, item);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex h-9 items-center gap-2.5 rounded-lg px-3 text-sm text-sidebar-foreground/85 transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      active && "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
                    )}
                  >
                    {active && <span className="absolute top-1.5 bottom-1.5 left-0 w-0.5 rounded-full bg-primary" />}
                    <item.icon className={cn("size-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
                    <span className="truncate">{item.label}</span>
                    {item.badge && <span className="ml-auto">{item.badge}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  const brandBlock = (
    <div className="space-y-3">
      <Logo href={homeHref} subtitle={portalLabel} />
      {coBrand && (
        <div className="flex items-center gap-2.5 rounded-lg border bg-background px-2.5 py-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md text-[11px] font-bold text-white" style={{ backgroundColor: coBrand.color }}>
            {coBrand.shortName}
          </span>
          <span className="min-w-0 text-xs leading-tight">
            <span className="block truncate font-medium">{coBrand.name}</span>
            <span className="text-muted-foreground">Partner institution</span>
          </span>
        </div>
      )}
    </div>
  );

  const userMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="flex w-full items-center gap-2.5 rounded-lg p-2 text-left transition hover:bg-sidebar-accent">
          <Portrait avatar={user.avatar} name={user.name} className="size-8" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{user.name}</span>
            <span className="block truncate text-xs text-muted-foreground">{user.subtitle}</span>
          </span>
          <ChevronsUpDown className="size-4 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-60">
        <DropdownMenuLabel>Signed in as {ROLE_META[role].label} (demo)</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push("/demo")}>
          <Repeat /> Switch demo role
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            logout();
            router.push("/");
          }}
        >
          <LogOut /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="flex min-h-screen bg-muted/40">
      {/* Desktop sidebar */}
      <aside className="no-print sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-sidebar lg:flex">
        <div className="px-4 pt-5 pb-4">{brandBlock}</div>
        <div className="flex-1 overflow-y-auto px-3 pb-4">{nav}</div>
        <div className="border-t p-2">{userMenu}</div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="no-print sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/85 px-4 backdrop-blur-md md:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation" onClick={() => setMobileOpen(true)}>
            <Menu />
          </Button>
          <div className="lg:hidden">
            <Logo href={homeHref} subtitle={portalLabel} />
          </div>
          <span className="hidden text-sm text-muted-foreground lg:inline">
            {coBrand ? `${coBrand.name} · ` : ""}
            {portalLabel}
          </span>
          <div className="ml-auto flex items-center gap-1">
            <span className="mr-2 hidden rounded-full border border-dashed border-warning/50 bg-warning-soft px-2.5 py-1 text-[11px] font-medium text-warning md:inline">
              Prototype · synthetic data
            </span>
            {notificationsHref && (
              <Button asChild variant="ghost" size="icon" className="relative" aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ""}`}>
                <Link href={notificationsHref}>
                  <Bell />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] leading-4 font-semibold text-white">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              </Button>
            )}
            <div className="lg:hidden">
              <Portrait avatar={user.avatar} name={user.name} className="size-8" />
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 pt-6 pb-24 md:px-8 md:pt-8">{children}</main>
      </div>

      {/* Mobile navigation */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="flex w-72 flex-col gap-0 p-0">
          <SheetHeader className="border-b px-4 py-4">
            <SheetTitle className="sr-only">{portalLabel} navigation</SheetTitle>
            {brandBlock}
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-3 py-4">{nav}</div>
          <div className="border-t p-2">{userMenu}</div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

/** Small count badge for nav items. */
export function NavCount({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "primary" | "brand" }) {
  return (
    <span
      className={cn(
        "rounded-full px-1.5 text-[10px] leading-4 font-semibold",
        tone === "muted" && "bg-muted text-muted-foreground",
        tone === "primary" && "bg-primary text-primary-foreground",
        tone === "brand" && "bg-brand-soft text-brand",
      )}
    >
      {children}
    </span>
  );
}
