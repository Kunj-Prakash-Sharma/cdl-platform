"use client";

import { CalendarX } from "lucide-react";
import { toast } from "sonner";
import { formatDate, formatTime } from "@/lib/format";
import type { Booking } from "@/lib/types";
import { useDemoStore } from "@/store/demo-store";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/** Confirm-and-cancel for a live-session or mentoring booking. */
export function CancelBookingDialog({
  booking,
  label,
  open,
  onOpenChange,
  onCancelled,
}: {
  booking?: Booking;
  /** What is being cancelled, e.g. the session title */
  label: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancelled?: () => void;
}) {
  const cancelBooking = useDemoStore((s) => s.cancelBooking);
  const addNotification = useDemoStore((s) => s.addNotification);

  const confirm = () => {
    if (!booking) return;
    cancelBooking(booking.id);
    const mentoring = booking.kind === "mentoring";
    addNotification({
      kind: mentoring ? "mentoring" : "session",
      title: mentoring ? "Mentoring session cancelled" : "Session booking cancelled",
      body: `${label} on ${formatDate(booking.date, "EEE, d MMM")} at ${formatTime(booking.time)} was cancelled.`,
      href: mentoring ? "/dashboard/mentoring" : "/dashboard/sessions",
    });
    toast.success("Booking cancelled", {
      description: mentoring ? "Any refund would be processed to the original method (simulated)." : "Your seat has been released for other learners.",
    });
    onCancelled?.();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <CalendarX />
          </AlertDialogMedia>
          <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
          <AlertDialogDescription>
            {label}
            {booking && (
              <>
                {" "}
                · {formatDate(booking.date, "EEE, d MMM")} at {formatTime(booking.time)} IST
              </>
            )}
            . You can book again later if seats are available.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep booking</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={confirm}>
            Cancel booking
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
