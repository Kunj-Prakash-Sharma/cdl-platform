"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AutoStatus } from "@/components/shared/badges";
import { EmptyState } from "@/components/shared/page-header";
import type { CallbackRequest } from "@/lib/types";
import { formatDayShort } from "@/lib/format";
import { useDemoStore } from "@/store/demo-store";
import { ChartCard } from "./ui";

/** "+91 98765 43210" → "+91 98XXX 43210"; already-masked values pass through. */
export function maskPhone(phone: string) {
  if (/x/i.test(phone)) return phone;
  const d = phone.replace(/\D/g, "").slice(-10);
  if (d.length < 10) return phone;
  return `+91 ${d.slice(0, 2)}XXX ${d.slice(5)}`;
}

function timeOf(iso: string) {
  const [h, m] = iso.slice(11, 16).split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** Callback requests captured at the end of the free discovery flow (store `callbackRequests`). */
export function CallbackRequests() {
  const requests = useDemoStore((s) => s.callbackRequests);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, CallbackRequest["status"]>>({});
  const sorted = useMemo(() => [...requests].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [requests]);

  const setStatus = (r: CallbackRequest, status: CallbackRequest["status"]) => {
    setStatusOverrides((s) => ({ ...s, [r.id]: status }));
    toast.success(status === "scheduled" ? `Callback scheduled with ${r.name}` : `Callback with ${r.name} marked done`, {
      description: status === "scheduled" ? `An advisor will call during “${r.preferredTime}” (simulated).` : "Follow-up notes saved to the anonymous session (simulated).",
    });
  };

  return (
    <ChartCard
      title="Callback requests"
      description="Requested from the free career discovery chat · newest first"
      action={sorted.length > 0 ? <span className="text-xs text-muted-foreground tabular-nums">{sorted.length} total</span> : undefined}
    >
      {sorted.length === 0 ? (
        <EmptyState
          icon={PhoneCall}
          title="No callback requests yet"
          description="When a visitor taps “Request a callback” at the end of the free career discovery conversation, the request appears here for the advisor team."
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/discover">Open the discovery flow</Link>
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table className="min-w-[760px]">
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Requested</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Topic</TableHead>
                <TableHead>Preferred time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((r) => {
                const status = statusOverrides[r.id] ?? r.status;
                return (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap text-[13px]">
                      {formatDayShort(r.createdAt)} · {timeOf(r.createdAt)}
                    </TableCell>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="font-mono text-xs">{maskPhone(r.phone)}</TableCell>
                    <TableCell className="max-w-56 truncate text-[13px]">{r.topic}</TableCell>
                    <TableCell className="text-[13px]">{r.preferredTime}</TableCell>
                    <TableCell>
                      <AutoStatus status={status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {status === "requested" && (
                        <Button size="sm" variant="outline" onClick={() => setStatus(r, "scheduled")}>
                          Schedule
                        </Button>
                      )}
                      {status === "scheduled" && (
                        <Button size="sm" variant="outline" onClick={() => setStatus(r, "done")}>
                          Mark done
                        </Button>
                      )}
                      {status === "done" && <span className="text-xs text-muted-foreground">Completed</span>}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </ChartCard>
  );
}
