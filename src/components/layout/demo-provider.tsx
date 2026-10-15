"use client";

import { useEffect } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { useDemoStore } from "@/store/demo-store";

/** Restores persisted demo state after mount and provides app-wide UI context. */
export function DemoProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void useDemoStore.persist.rehydrate();
  }, []);
  return (
    <TooltipProvider delayDuration={200}>
      {children}
      <Toaster position="top-center" richColors closeButton />
    </TooltipProvider>
  );
}
