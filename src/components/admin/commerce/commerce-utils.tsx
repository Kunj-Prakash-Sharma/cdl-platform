"use client";

import { useMemo } from "react";
import { getCollegeStudent, getUser } from "@/data";
import { FORMAT_META, STAGE_META } from "@/data/constants";
import { formatINR } from "@/lib/format";
import type { AvatarSpec, College, Enrollment, Order, PromoCode, UserProfile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Portrait } from "@/components/shared/portrait";
import { useDemoStore } from "@/store/demo-store";
import { useCommerceAdmin } from "./commerce-store";

export const PAYMENT_LABEL: Record<Order["paymentStatus"], string> = {
  paid: "Paid",
  pending: "Pending",
  failed: "Failed",
  refunded: "Refunded",
};

export const PAYMENT_METHODS: Order["method"][] = ["UPI (simulated)", "Card (simulated)", "Net banking (simulated)", "College licence"];

export const SOURCE_META: Record<Enrollment["source"], { label: string; tone: "primary" | "info" | "neutral" }> = {
  purchase: { label: "Purchase", tone: "primary" },
  college: { label: "College licence", tone: "info" },
  free: { label: "Free", tone: "neutral" },
};

export function appliesToLabel(a: PromoCode["appliesTo"]) {
  if (a === "all") return "All programmes";
  if (a === "bundle") return "Bundles";
  return FORMAT_META[a].label;
}

export function discountLabel(p: Pick<PromoCode, "discountType" | "value">) {
  return p.discountType === "percent" ? `${p.value}% off` : `${formatINR(p.value)} flat`;
}

/** A customer / learner record resolved from a user id, college-student id or college id. */
export interface Party {
  id: string;
  name: string;
  kind: "learner" | "college-student" | "college" | "unknown";
  subtitle: string;
  avatar?: AvatarSpec;
  email?: string;
  phone?: string;
  city?: string;
  brandColor?: string;
  shortName?: string;
}

export function resolveParty(id: string, colleges: College[], overrides: Record<string, Partial<UserProfile>> = {}): Party {
  const user = getUser(id);
  if (user) {
    const u = { ...user, ...overrides[id] };
    return {
      id,
      name: u.name,
      kind: "learner",
      subtitle: STAGE_META[u.stage].label,
      avatar: u.avatar,
      email: u.email,
      phone: u.phone,
      city: u.city,
    };
  }
  const student = getCollegeStudent(id);
  if (student) {
    const college = colleges.find((c) => c.id === student.collegeId);
    return {
      id,
      name: student.name,
      kind: "college-student",
      subtitle: `College student${college ? ` · ${college.shortName}` : ""}`,
      avatar: student.avatar,
      email: student.email,
      city: college?.city,
    };
  }
  const college = colleges.find((c) => c.id === id);
  if (college) {
    return {
      id,
      name: college.name,
      kind: "college",
      subtitle: `College · ${college.plan}`,
      email: college.contactEmail,
      city: `${college.city}, ${college.state}`,
      brandColor: college.brandColor,
      shortName: college.shortName,
    };
  }
  return { id, name: id, kind: "unknown", subtitle: "Unknown account" };
}

/** Portrait for people, a branded monogram tile for colleges. */
export function PartyAvatar({ party, className }: { party: Party; className?: string }) {
  if (party.kind === "college") {
    return (
      <span
        className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold tracking-wide text-white", className)}
        style={{ backgroundColor: party.brandColor ?? "var(--primary)" }}
        aria-hidden="true"
      >
        {party.shortName ?? party.name.slice(0, 3).toUpperCase()}
      </span>
    );
  }
  return <Portrait avatar={party.avatar} name={party.name} className={cn("size-8 shrink-0", className)} />;
}

export type EffectiveOrder = Order & { overridden: boolean };

/** Store orders with session-only payment overrides applied, newest first. */
export function useEffectiveOrders(): EffectiveOrder[] {
  const orders = useDemoStore((s) => s.orders);
  const overrides = useCommerceAdmin((s) => s.paymentOverrides);
  return useMemo(
    () =>
      orders
        .map((o) => (overrides[o.id] ? { ...o, paymentStatus: overrides[o.id], overridden: true } : { ...o, overridden: false }))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [orders, overrides],
  );
}

/** Plain-text receipt used by the "Download receipt" action. */
export function receiptText(order: Order, party: Party) {
  const lines = [
    "Career Design Lab — Order summary",
    "SIMULATED PAYMENT · No real payment was processed",
    "",
    `Order ID: ${order.id}`,
    `Date: ${order.createdAt.replace("T", " ").slice(0, 16)} IST`,
    `Billed to: ${party.name}`,
    "",
    ...order.items.map((i) => `${i.title} — ${formatINR(i.price)}`),
    "",
    `Subtotal: ${formatINR(order.subtotal)}`,
    `Discount${order.promoCode ? ` (${order.promoCode})` : ""}: -${formatINR(order.discount)}`,
    `Total: ${formatINR(order.total)}`,
    `Payment: ${PAYMENT_LABEL[order.paymentStatus]} · ${order.method}`,
  ];
  return lines.join("\n");
}

/** Titled page section: heading + description with a right-aligned action slot that stacks on mobile. */
export function CommerceSection({
  id,
  title,
  description,
  action,
  children,
  className,
}: {
  id: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section aria-labelledby={id} className={cn("space-y-3", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 id={id} className="font-heading text-base font-semibold md:text-lg">
            {title}
          </h2>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
        {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
      </div>
      {children}
    </section>
  );
}
