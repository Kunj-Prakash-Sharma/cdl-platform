"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AiFeatureId } from "./ai-features";

interface AiWaitlistState {
  /** Features the visitor asked to be notified about */
  features: AiFeatureId[];
  /** Joined the general My Self AI waitlist */
  joined: boolean;
  toggleFeature: (id: AiFeatureId) => boolean;
  join: () => void;
}

/** Local-only "Notify me" state for the Phase 2 AI preview. Nothing leaves the browser. */
export const useAiWaitlist = create<AiWaitlistState>()(
  persist(
    (set, get) => ({
      features: [],
      joined: false,
      toggleFeature: (id) => {
        const on = !get().features.includes(id);
        set((s) => ({ features: on ? [...s.features, id] : s.features.filter((f) => f !== id) }));
        return on;
      },
      join: () => set({ joined: true }),
    }),
    { name: "cdl-ai-waitlist", storage: createJSONStorage(() => localStorage), skipHydration: true },
  ),
);

/** Restores the persisted waitlist after mount (avoids SSR hydration mismatches). */
export function useRehydrateAiWaitlist() {
  useEffect(() => {
    void useAiWaitlist.persist.rehydrate();
  }, []);
}
