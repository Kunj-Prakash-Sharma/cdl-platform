"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { BookOpenCheck, Copy, CreditCard, History, IndianRupee, Receipt, RotateCcw, ShoppingBag, Undo2 } from "lucide-react";
import { getCohort, getCourse } from "@/data";
import { FORMAT_META, FORMATS } from "@/data/constants";
import { formatDate, formatINR, formatINRCompact } from "@/lib/format";
import type { Enrollment, Order } from "@/lib/types";
import { useDemoStore } from "@/store/demo-store";
import { LogoMark } from "@/components/brand/logo";
import { AutoStatus, DemoBadge, FormatBadge, StatusPill } from "@/components/shared/badges";
import { PageHeader, StatCard } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ClearFiltersButton,
  ConfirmDialog,
  DetailRow,
  FilterBar,
  FilterSelect,
  InfoNote,
  ResultsMeta,
  SearchField,
  TableCard,
  TableEmptyRow,
} from "@/components/admin/content/admin-kit";
import { useCommerceAdmin } from "./commerce-store";
import { PAYMENT_LABEL, PAYMENT_METHODS, PartyAvatar, resolveParty, SOURCE_META, useEffectiveOrders, type EffectiveOrder } from "./commerce-utils";

export function EnrollmentsPage() {
  const enrollments = useDemoStore((s) => s.enrollments);
  const colleges = useDemoStore((s) => s.colleges);
  const overrides = useDemoStore((s) => s.profileOverrides);
  const orders = useEffectiveOrders();
  const [tab, setTab] = useState("enrollments");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [historyUser, setHistoryUser] = useState<string>("u-riya");

  const party = useMemo(() => (id: string) => resolveParty(id, colleges, overrides), [colleges, overrides]);

  const kpis = useMemo(() => {
    const paid = orders.filter((o) => o.paymentStatus === "paid");
    const revenue = paid.reduce((n, o) => n + o.total, 0);
    const refunded = orders.filter((o) => o.paymentStatus === "refunded");
    return { count: orders.length, revenue, aov: paid.length ? revenue / paid.length : 0, refunds: refunded.length, refundValue: refunded.reduce((n, o) => n + o.total, 0) };
  }, [orders]);

  const learnerIds = useMemo(() => {
    const ids = new Set<string>([...enrollments.map((e) => e.userId), ...orders.map((o) => o.userId)]);
    return [...ids].filter((id) => party(id).kind !== "college" && party(id).kind !== "unknown");
  }, [enrollments, orders, party]);

  const openHistory = (userId: string) => {
    setHistoryUser(userId);
    setTab("history");
  };
  const openOrder = orders.find((o) => o.id === orderId);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Commerce"
        title="Enrollments & Orders"
        description="Who is enrolled in what, how they got access, and every order placed through the simulated checkout."
        actions={<DemoBadge>Simulated payments</DemoBadge>}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Orders" value={kpis.count} icon={ShoppingBag} hint={`${enrollments.length} enrolments on record`} />
        <StatCard label="Revenue (simulated)" value={formatINRCompact(kpis.revenue)} icon={IndianRupee} accent="brand" hint="Paid orders, incl. college licences" />
        <StatCard label="Avg order value" value={formatINR(Math.round(kpis.aov))} icon={Receipt} accent="info" hint="Paid orders" />
        <StatCard label="Refunds" value={kpis.refunds} icon={Undo2} accent="warning" hint={`${formatINR(kpis.refundValue)} refunded`} />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="gap-4">
        <TabsList className="h-9!">
          <TabsTrigger value="enrollments" className="px-3">
            Enrollments
          </TabsTrigger>
          <TabsTrigger value="orders" className="px-3">
            Orders
          </TabsTrigger>
          <TabsTrigger value="history" className="px-3">
            Learner history
          </TabsTrigger>
        </TabsList>
        <TabsContent value="enrollments">
          <EnrollmentsTab enrollments={enrollments} party={party} onLearner={openHistory} />
        </TabsContent>
        <TabsContent value="orders">
          <OrdersTab orders={orders} party={party} onOpen={setOrderId} />
        </TabsContent>
        <TabsContent value="history">
          <HistoryTab userId={historyUser} onUser={setHistoryUser} learnerIds={learnerIds} party={party} enrollments={enrollments} orders={orders} onOrder={setOrderId} />
        </TabsContent>
      </Tabs>

      <Sheet open={!!openOrder} onOpenChange={(o) => !o && setOrderId(null)}>
        <SheetContent className="w-full gap-0 p-0 data-[side=right]:sm:max-w-lg">
          {openOrder && (
            <OrderDrawer
              key={openOrder.id}
              order={openOrder}
              party={party(openOrder.userId)}
              onHistory={
                party(openOrder.userId).kind === "college"
                  ? undefined
                  : () => {
                      setOrderId(null);
                      openHistory(openOrder.userId);
                    }
              }
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

type PartyFn = (id: string) => ReturnType<typeof resolveParty>;

function EnrollmentsTab({ enrollments, party, onLearner }: { enrollments: Enrollment[]; party: PartyFn; onLearner: (id: string) => void }) {
  const [q, setQ] = useState("");
  const [level, setLevel] = useState("all");
  const [source, setSource] = useState("all");
  const [course, setCourse] = useState("all");
  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return [...enrollments]
      .sort((a, b) => b.enrolledOn.localeCompare(a.enrolledOn))
      .filter((e) => (level === "all" || e.format === level) && (source === "all" || e.source === source) && (course === "all" || e.courseId === course))
      .filter((e) => !term || `${party(e.userId).name} ${getCourse(e.courseId)?.title ?? ""}`.toLowerCase().includes(term));
  }, [enrollments, q, level, source, course, party]);
  const courseOptions = Array.from(new Set(enrollments.map((e) => e.courseId))).map((id) => ({ value: id, label: getCourse(id)?.title ?? id }));
  const hasFilters = q !== "" || level !== "all" || source !== "all" || course !== "all";
  const reset = () => {
    setQ("");
    setLevel("all");
    setSource("all");
    setCourse("all");
  };

  return (
    <div className="space-y-3">
      <FilterBar right={<ResultsMeta shown={rows.length} total={enrollments.length} noun="enrolments" onReset={reset} />}>
        <SearchField value={q} onChange={setQ} placeholder="Search learner or programme…" label="Search enrolments" />
        <FilterSelect label="Learning level" allLabel="All levels" value={level} onValueChange={setLevel} options={FORMATS.map((f) => ({ value: f, label: FORMAT_META[f].label }))} className="sm:w-52" />
        <FilterSelect label="Source" allLabel="All sources" value={source} onValueChange={setSource} options={Object.entries(SOURCE_META).map(([v, m]) => ({ value: v, label: m.label }))} className="sm:w-40" />
        <FilterSelect label="Programme" allLabel="All programmes" value={course} onValueChange={setCourse} options={courseOptions} className="sm:w-52" />
        <ClearFiltersButton visible={hasFilters} onClick={reset} />
      </FilterBar>
      <TableCard>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Learner</TableHead>
              <TableHead>Programme</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Cohort</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Enrolled on</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && <TableEmptyRow colSpan={6} icon={BookOpenCheck} />}
            {rows.map((e) => {
              const p = party(e.userId);
              const cohort = e.cohortId ? getCohort(e.cohortId) : undefined;
              return (
                <TableRow key={e.id}>
                  <TableCell>
                    <button type="button" onClick={() => onLearner(e.userId)} className="flex items-center gap-2.5 text-left hover:text-primary">
                      <PartyAvatar party={p} />
                      <span>
                        <span className="block font-medium whitespace-nowrap hover:underline">{p.name}</span>
                        <span className="block text-[11px] text-muted-foreground">{p.subtitle}</span>
                      </span>
                    </button>
                  </TableCell>
                  <TableCell className="max-w-[240px] truncate">{getCourse(e.courseId)?.title ?? e.courseId}</TableCell>
                  <TableCell>
                    <FormatBadge format={e.format} short />
                  </TableCell>
                  <TableCell className="max-w-[220px] truncate text-[13px] text-muted-foreground">{cohort?.name ?? "—"}</TableCell>
                  <TableCell>
                    <StatusPill tone={SOURCE_META[e.source].tone} dot={false}>
                      {SOURCE_META[e.source].label}
                    </StatusPill>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{formatDate(e.enrolledOn)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableCard>
    </div>
  );
}

function OrdersTab({ orders, party, onOpen }: { orders: EffectiveOrder[]; party: PartyFn; onOpen: (id: string) => void }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [method, setMethod] = useState("all");
  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return orders
      .filter((o) => (status === "all" || o.paymentStatus === status) && (method === "all" || o.method === method))
      .filter((o) => !term || `${o.id} ${party(o.userId).name} ${o.items.map((i) => i.title).join(" ")} ${o.promoCode ?? ""}`.toLowerCase().includes(term));
  }, [orders, q, status, method, party]);
  const hasFilters = q !== "" || status !== "all" || method !== "all";
  const reset = () => {
    setQ("");
    setStatus("all");
    setMethod("all");
  };

  return (
    <div className="space-y-3">
      <FilterBar right={<ResultsMeta shown={rows.length} total={orders.length} noun="orders" onReset={reset} />}>
        <SearchField value={q} onChange={setQ} placeholder="Search order ID, customer, promo…" label="Search orders" />
        <FilterSelect label="Payment status" allLabel="All payment statuses" value={status} onValueChange={setStatus} options={Object.entries(PAYMENT_LABEL).map(([v, l]) => ({ value: v, label: l }))} className="sm:w-48" />
        <FilterSelect label="Method" allLabel="All methods" value={method} onValueChange={setMethod} options={PAYMENT_METHODS.map((m) => ({ value: m, label: m }))} className="sm:w-52" />
        <ClearFiltersButton visible={hasFilters} onClick={reset} />
      </FilterBar>
      <TableCard>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead className="text-right">Subtotal</TableHead>
              <TableHead className="text-right">Discount</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && <TableEmptyRow colSpan={8} icon={Receipt} />}
            {rows.map((o) => {
              const p = party(o.userId);
              return (
                <TableRow key={o.id} className="cursor-pointer" onClick={() => onOpen(o.id)}>
                  <TableCell>
                    <button type="button" className="font-mono text-xs font-semibold hover:text-primary hover:underline" onClick={() => onOpen(o.id)}>
                      {o.id}
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <PartyAvatar party={p} className="size-7" />
                      <span className="text-[13px] font-medium whitespace-nowrap">{p.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[240px]">
                    <p className="truncate text-[13px]">{o.items.map((i) => i.title).join(", ")}</p>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatINR(o.subtotal)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {o.discount ? (
                      <>
                        <span className="text-success">−{formatINR(o.discount)}</span>
                        {o.promoCode && <div className="font-mono text-[10.5px] text-muted-foreground">{o.promoCode}</div>}
                      </>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">{formatINR(o.total)}</TableCell>
                  <TableCell>
                    <AutoStatus status={o.paymentStatus} label={PAYMENT_LABEL[o.paymentStatus]} />
                    <div className="mt-0.5 text-[11px] whitespace-nowrap text-muted-foreground">{o.method}</div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{formatDate(o.createdAt)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableCard>
    </div>
  );
}

function OrderDrawer({ order, party, onHistory }: { order: EffectiveOrder; party: ReturnType<typeof resolveParty>; onHistory?: () => void }) {
  const setPaymentStatus = useCommerceAdmin((s) => s.setPaymentStatus);
  const clearPaymentStatus = useCommerceAdmin((s) => s.clearPaymentStatus);
  const [refunding, setRefunding] = useState(false);

  return (
    <>
      <SheetHeader className="border-b px-5 pt-5 pb-4 pr-12">
        <SheetTitle className="font-mono text-base">{order.id}</SheetTitle>
        <SheetDescription>Order summary · {formatDate(order.createdAt, "d MMM yyyy, h:mm a")} IST</SheetDescription>
      </SheetHeader>
      <div className="flex-1 overflow-y-auto px-5 py-5">
        <div className="relative overflow-hidden rounded-2xl border bg-card p-5 shadow-xs">
          <div
            className="pointer-events-none absolute top-16 right-3 rotate-[-14deg] rounded-md border-2 border-dashed border-warning/60 px-2.5 py-1 text-[11px] font-bold tracking-[0.18em] text-warning/80 uppercase"
            aria-hidden="true"
          >
            Simulated payment
          </div>
          <div className="flex items-center gap-2.5">
            <LogoMark className="size-9" />
            <div>
              <p className="font-heading text-sm font-bold text-primary">Career Design Lab</p>
              <p className="text-[11px] text-muted-foreground">Receipt · demo only</p>
            </div>
          </div>
          <div className="mt-5 flex items-center gap-3 rounded-xl bg-muted/50 p-3">
            <PartyAvatar party={party} className="size-9" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{party.name}</p>
              <p className="truncate text-xs text-muted-foreground">{party.email ?? party.subtitle}</p>
            </div>
          </div>
          <ul className="mt-4 divide-y border-y">
            {order.items.map((i) => (
              <li key={i.refId + i.title} className="flex items-start justify-between gap-3 py-2.5 text-sm">
                <span>
                  {i.title}
                  {i.format && <FormatBadge format={i.format} short className="mt-1 flex w-fit" />}
                </span>
                <span className="font-medium tabular-nums">{formatINR(i.price)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2">
            <DetailRow label="Subtotal">{formatINR(order.subtotal)}</DetailRow>
            <DetailRow label={order.promoCode ? `Discount (${order.promoCode})` : "Discount"}>
              <span className="text-success">−{formatINR(order.discount)}</span>
            </DetailRow>
            <DetailRow label={<span className="font-semibold text-foreground">Total</span>} className="border-t pt-3">
              <span className="font-heading text-lg">{formatINR(order.total)}</span>
            </DetailRow>
            <DetailRow label="Method">{order.method}</DetailRow>
            <DetailRow label="Payment status">
              <AutoStatus status={order.paymentStatus} label={PAYMENT_LABEL[order.paymentStatus]} />
            </DetailRow>
          </div>
        </div>
        <InfoNote tone="warning" className="mt-4">
          No real payment was processed. Status changes here are kept for this demo session only.
        </InfoNote>
      </div>
      <div className="flex flex-wrap gap-2 border-t bg-muted/30 px-5 py-3.5">
        <Button
          variant="outline"
          onClick={() => {
            void navigator.clipboard?.writeText(order.id).catch(() => undefined);
            toast.success("Order ID copied", { description: order.id });
          }}
        >
          <Copy className="size-4" />
          Copy ID
        </Button>
        {onHistory && (
          <Button variant="outline" onClick={onHistory}>
            <History className="size-4" />
            Learner history
          </Button>
        )}
        {order.overridden ? (
          <Button
            variant="ghost"
            className="sm:ml-auto"
            onClick={() => {
              clearPaymentStatus(order.id);
              toast.success("Original status restored");
            }}
          >
            <RotateCcw className="size-4" />
            Undo change
          </Button>
        ) : order.paymentStatus === "paid" ? (
          <Button variant="destructive" className="sm:ml-auto" onClick={() => setRefunding(true)}>
            <Undo2 className="size-4" />
            Mark as refunded
          </Button>
        ) : order.paymentStatus === "pending" ? (
          <Button
            className="sm:ml-auto"
            onClick={() => {
              setPaymentStatus(order.id, "paid");
              toast.success("Marked as paid (simulated)", { description: order.id });
            }}
          >
            <CreditCard className="size-4" />
            Mark as paid
          </Button>
        ) : null}
      </div>
      <ConfirmDialog
        open={refunding}
        onOpenChange={setRefunding}
        title={`Refund ${formatINR(order.total)}?`}
        description="The order is marked as refunded for this demo session. No money moves — payments are simulated."
        confirmLabel="Mark as refunded"
        destructive
        onConfirm={() => {
          setPaymentStatus(order.id, "refunded");
          toast.success("Order marked as refunded", { description: order.id });
          setRefunding(false);
        }}
      />
    </>
  );
}

function HistoryTab({
  userId,
  onUser,
  learnerIds,
  party,
  enrollments,
  orders,
  onOrder,
}: {
  userId: string;
  onUser: (id: string) => void;
  learnerIds: string[];
  party: PartyFn;
  enrollments: Enrollment[];
  orders: Order[];
  onOrder: (id: string) => void;
}) {
  const p = party(userId);
  const timeline = useMemo(() => {
    const items: { key: string; date: string; kind: "order" | "enrollment"; order?: Order; enrollment?: Enrollment }[] = [
      ...orders.filter((o) => o.userId === userId).map((o) => ({ key: o.id, date: o.createdAt, kind: "order" as const, order: o })),
      ...enrollments.filter((e) => e.userId === userId).map((e) => ({ key: e.id, date: `${e.enrolledOn}T23:59:00`, kind: "enrollment" as const, enrollment: e })),
    ];
    return items.sort((a, b) => b.date.localeCompare(a.date));
  }, [orders, enrollments, userId]);
  const spent = orders.filter((o) => o.userId === userId && o.paymentStatus === "paid").reduce((n, o) => n + o.total, 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <div className="space-y-4 rounded-2xl border bg-card p-5 shadow-xs lg:self-start">
        <Select value={userId} onValueChange={onUser}>
          <SelectTrigger className="h-9! w-full" aria-label="Choose a learner">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {learnerIds.map((id) => (
              <SelectItem key={id} value={id}>
                {party(id).name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-3">
          <PartyAvatar party={p} className="size-12" />
          <div>
            <p className="font-heading font-semibold">{p.name}</p>
            <p className="text-xs text-muted-foreground">
              {p.subtitle}
              {p.city ? ` · ${p.city}` : ""}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-muted/60 p-2">
            <p className="font-heading font-semibold tabular-nums">{orders.filter((o) => o.userId === userId).length}</p>
            <p className="text-[11px] text-muted-foreground">Orders</p>
          </div>
          <div className="rounded-lg bg-muted/60 p-2">
            <p className="font-heading font-semibold tabular-nums">{enrollments.filter((e) => e.userId === userId).length}</p>
            <p className="text-[11px] text-muted-foreground">Enrolments</p>
          </div>
          <div className="rounded-lg bg-muted/60 p-2">
            <p className="font-heading font-semibold tabular-nums">{formatINRCompact(spent)}</p>
            <p className="text-[11px] text-muted-foreground">Paid</p>
          </div>
        </div>
      </div>
      <div className="rounded-2xl border bg-card p-5 shadow-xs">
        <h3 className="mb-4 font-heading text-sm font-semibold">Purchase & enrolment timeline</h3>
        {timeline.length === 0 ? (
          <p className="text-sm text-muted-foreground">No purchases or enrolments yet.</p>
        ) : (
          <ol className="relative space-y-5 border-l pl-6">
            {timeline.map((t) => (
              <li key={t.key} className="relative">
                <span className={`absolute top-0.5 -left-[35px] flex size-6 items-center justify-center rounded-full ring-4 ring-card ${t.kind === "order" ? "bg-secondary text-primary" : "bg-brand-soft text-brand"}`}>
                  {t.kind === "order" ? <Receipt className="size-3.5" /> : <BookOpenCheck className="size-3.5" />}
                </span>
                <p className="text-xs text-muted-foreground">{formatDate(t.date)}</p>
                {t.order ? (
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => onOrder(t.order!.id)} className="text-sm font-medium hover:text-primary hover:underline">
                      Order {t.order.id} · {formatINR(t.order.total)}
                    </button>
                    <AutoStatus status={t.order.paymentStatus} label={PAYMENT_LABEL[t.order.paymentStatus]} />
                    <p className="w-full text-[13px] text-muted-foreground">{t.order.items.map((i) => i.title).join(", ")}</p>
                  </div>
                ) : (
                  t.enrollment && (
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">Enrolled in {getCourse(t.enrollment.courseId)?.title}</span>
                      <FormatBadge format={t.enrollment.format} short />
                      <StatusPill tone={SOURCE_META[t.enrollment.source].tone} dot={false}>
                        {SOURCE_META[t.enrollment.source].label}
                      </StatusPill>
                    </div>
                  )
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
