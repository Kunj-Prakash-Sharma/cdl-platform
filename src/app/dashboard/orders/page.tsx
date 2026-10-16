"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Download, Eye, Package, Receipt, ShoppingBag, UserRound } from "lucide-react";
import { toast } from "sonner";
import { getCourse } from "@/data";
import { formatDate, formatINR } from "@/lib/format";
import type { Order } from "@/lib/types";
import { useDemoStore } from "@/store/demo-store";
import { useCurrentUser } from "@/store/hooks";
import { AutoStatus } from "@/components/shared/badges";
import { CourseThumbnail } from "@/components/shared/course-thumbnail";
import { EmptyState, PageHeader, StatCard } from "@/components/shared/page-header";
import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const PAY_LABEL: Record<Order["paymentStatus"], string> = { paid: "Paid", pending: "Pending", failed: "Failed", refunded: "Refunded" };

function ItemIcon({ item }: { item: Order["items"][number] }) {
  const course = item.kind === "course" ? getCourse(item.refId) : undefined;
  if (course) return <div className="w-14 shrink-0"><CourseThumbnail course={course} size="sm" /></div>;
  return (
    <span className="flex aspect-video w-14 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
      {item.kind === "mentoring" ? <UserRound className="size-4" /> : <Package className="size-4" />}
    </span>
  );
}

const invoiceToast = (o: Order) => toast.success("Invoice downloaded", { description: `INV-${o.id.replace("ORD-", "")}.pdf (simulated)` });

export default function PurchasesPage() {
  const { user, userId } = useCurrentUser();
  const allOrders = useDemoStore((s) => s.orders);
  const orders = useMemo(() => allOrders.filter((o) => o.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [allOrders, userId]);
  const [open, setOpen] = useState<Order | null>(null);
  const spent = orders.filter((o) => o.paymentStatus === "paid").reduce((s, o) => s + o.total, 0);
  const saved = orders.reduce((s, o) => s + o.discount, 0);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader eyebrow="Account" title="Purchases" description="Your orders, receipts and invoices. All payments in this prototype are simulated." actions={<Button asChild variant="outline"><Link href="/courses"><ShoppingBag /> Browse courses</Link></Button>} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label="Orders" value={orders.length} icon={Receipt} />
        <StatCard label="Total paid" value={formatINR(spent)} icon={ShoppingBag} accent="brand" hint="simulated payments" />
        <StatCard label="Saved with offers" value={formatINR(saved)} icon={Package} accent="success" className="col-span-2 lg:col-span-1" />
      </div>

      {orders.length === 0 ? (
        <EmptyState icon={Receipt} title="No purchases yet" description="Programmes and mentoring sessions you buy will appear here with receipts." action={<Button asChild size="sm"><Link href="/courses">Browse courses</Link></Button>} />
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-xl border bg-card shadow-xs md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Order</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="pl-4 font-mono text-xs">{o.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <ItemIcon item={o.items[0]} />
                        <div className="min-w-0">
                          <p className="max-w-72 truncate font-medium">{o.items[0]?.title}</p>
                          {o.items.length > 1 && <p className="text-xs text-muted-foreground">+{o.items.length - 1} more</p>}
                          {o.promoCode && <p className="text-xs text-success">{o.promoCode} · −{formatINR(o.discount)}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(o.createdAt)}</TableCell>
                    <TableCell className="text-muted-foreground">{o.method}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{formatINR(o.total)}</TableCell>
                    <TableCell><AutoStatus status={o.paymentStatus} label={PAY_LABEL[o.paymentStatus]} /></TableCell>
                    <TableCell className="pr-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setOpen(o)}><Eye /> Receipt</Button>
                        <Button variant="ghost" size="icon-sm" aria-label={`Download invoice for ${o.id}`} onClick={() => invoiceToast(o)}><Download /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <ul className="space-y-3 md:hidden">
            {orders.map((o) => (
              <li key={o.id} className="rounded-2xl border bg-card p-4 shadow-xs">
                <div className="flex items-start gap-3">
                  <ItemIcon item={o.items[0]} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium leading-snug">{o.items[0]?.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{o.id} · {formatDate(o.createdAt)}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-semibold">{formatINR(o.total)}</span>
                  <AutoStatus status={o.paymentStatus} label={PAY_LABEL[o.paymentStatus]} />
                </div>
                <div className="mt-3 flex gap-2 border-t pt-3">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setOpen(o)}><Eye /> Receipt</Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => invoiceToast(o)}><Download /> Invoice</Button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <Dialog open={Boolean(open)} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="gap-0 p-0 sm:max-w-md">
          {open && (
            <>
              <DialogHeader className="border-b p-5">
                <div className="flex items-center gap-2.5">
                  <LogoMark className="size-8" />
                  <div>
                    <DialogTitle className="font-heading">Receipt</DialogTitle>
                    <DialogDescription>Career Design Lab · {open.id}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-4 p-5 text-sm">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div><p className="text-muted-foreground">Date</p><p className="font-medium">{formatDate(open.createdAt, "d MMM yyyy, h:mm a")}</p></div>
                  <div><p className="text-muted-foreground">Payment</p><p className="font-medium">{open.method}</p></div>
                  <div><p className="text-muted-foreground">Status</p><AutoStatus status={open.paymentStatus} label={PAY_LABEL[open.paymentStatus]} /></div>
                  <div><p className="text-muted-foreground">Billed to</p><p className="font-medium">{user.name}</p></div>
                </div>
                <div className="border-t border-dashed pt-3">
                  {open.items.map((i) => (
                    <div key={i.refId} className="flex justify-between gap-3 py-1.5">
                      <span>{i.title}</span>
                      <span className="tabular-nums">{formatINR(i.price)}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-1.5 border-t border-dashed pt-3">
                  <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span className="tabular-nums">{formatINR(open.subtotal)}</span></div>
                  {open.discount > 0 && (
                    <div className="flex justify-between text-success"><span>Discount{open.promoCode ? ` (${open.promoCode})` : ""}</span><span className="tabular-nums">−{formatINR(open.discount)}</span></div>
                  )}
                  <div className="flex justify-between text-muted-foreground"><span>GST (incl.)</span><span className="tabular-nums">{formatINR(Math.round(open.total - open.total / 1.18))}</span></div>
                  <div className="flex justify-between border-t pt-2 text-base font-semibold"><span>Total</span><span className="tabular-nums">{formatINR(open.total)}</span></div>
                </div>
                <p className="rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning">Simulated payment — no money was charged. This receipt is for demonstration only.</p>
              </div>
              <DialogFooter className="m-0 rounded-b-xl p-4">
                <Button variant="outline" onClick={() => setOpen(null)}>Close</Button>
                <Button onClick={() => invoiceToast(open)} className="bg-brand text-brand-foreground hover:bg-brand/90"><Download /> Download invoice</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
