"use client";

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { ArrowRight, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { getMentor, getMentorOffer } from "@/data";
import { formatDate, formatTime } from "@/lib/format";
import type { Booking } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDemoStore } from "@/store/demo-store";
import { useMentorSlots } from "@/store/hooks";
import { Portrait } from "@/components/shared/portrait";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/** Pick a new slot from the mentor's live availability and move a mentoring booking. Remount with `key` to reset. */
export function RescheduleDialog({ booking, open, onOpenChange }: { booking?: Booking; open: boolean; onOpenChange: (open: boolean) => void }) {
  const mentor = booking ? getMentor(booking.mentorId) : undefined;
  const offer = booking?.offerId ? getMentorOffer(booking.offerId)?.offer : undefined;
  const days = useMentorSlots(mentor);
  const rescheduleBooking = useDemoStore((s) => s.rescheduleBooking);
  const addNotification = useDemoStore((s) => s.addNotification);
  const [date, setDate] = useState<string>();
  const [time, setTime] = useState<string>();
  const day = useMemo(() => days.find((d) => d.date === date), [days, date]);

  const confirm = () => {
    if (!booking || !date || !time) return;
    rescheduleBooking(booking.id, date, time);
    addNotification({
      kind: "mentoring",
      title: "Mentoring session rescheduled",
      body: `${offer?.title ?? "Your session"} with ${mentor?.name} moved to ${formatDate(date, "EEE, d MMM")} at ${formatTime(time)}.`,
      href: "/dashboard/mentoring",
    });
    toast.success("Session rescheduled", { description: `New time: ${formatDate(date, "EEE, d MMM")} at ${formatTime(time)} IST. ${mentor?.name.split(" ")[0]} has been notified (simulated).` });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {mentor && <Portrait avatar={mentor.avatar} name={mentor.name} className="size-11" rounded="xl" />}
            <div className="text-left">
              <DialogTitle>Reschedule your session</DialogTitle>
              <DialogDescription>
                {offer?.title} · {mentor?.name}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {booking && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl bg-muted/60 px-3.5 py-2.5 text-sm">
            <CalendarClock className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground line-through">
              {formatDate(booking.date, "EEE, d MMM")} · {formatTime(booking.time)}
            </span>
            <ArrowRight className="size-3.5 text-muted-foreground" />
            <span className={cn("font-medium", !(date && time) && "text-muted-foreground")}>
              {date && time ? `${formatDate(date, "EEE, d MMM")} · ${formatTime(time)}` : "Pick a new slot"}
            </span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium">1. Choose a date</p>
            {days.length === 0 ? (
              <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">No availability published in the next three weeks.</p>
            ) : (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {days.map((d) => {
                  const free = d.slots.filter((s) => s.available).length;
                  return (
                    <button
                      key={d.date}
                      type="button"
                      disabled={!free}
                      onClick={() => {
                        setDate(d.date);
                        setTime(undefined);
                      }}
                      className={cn(
                        "rounded-xl border px-1 py-2 text-center transition hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-40",
                        date === d.date && "border-primary bg-accent ring-1 ring-primary/30",
                      )}
                    >
                      <span className="block text-[10px] text-muted-foreground uppercase">{format(parseISO(d.date), "EEE")}</span>
                      <span className="block font-heading text-base leading-tight font-semibold">{format(parseISO(d.date), "d")}</span>
                      <span className="block text-[10px] text-muted-foreground">{format(parseISO(d.date), "MMM")}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          {day && (
            <div>
              <p className="mb-2 text-sm font-medium">2. Choose a time (IST)</p>
              <div className="grid grid-cols-3 gap-2">
                {day.slots.map((s) => (
                  <button
                    key={s.time}
                    type="button"
                    disabled={!s.available}
                    onClick={() => setTime(s.time)}
                    className={cn(
                      "rounded-lg border px-3 py-2.5 text-sm font-medium transition hover:border-primary/40 disabled:cursor-not-allowed disabled:line-through disabled:opacity-40",
                      time === s.time && "border-primary bg-primary text-primary-foreground hover:border-primary",
                    )}
                  >
                    {formatTime(s.time)}
                  </button>
                ))}
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground">Free rescheduling up to 12 hours before the session (illustrative policy).</p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Keep current time
          </Button>
          <Button onClick={confirm} disabled={!date || !time}>
            Confirm new time
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
