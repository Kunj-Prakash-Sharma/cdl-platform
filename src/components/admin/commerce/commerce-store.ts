"use client";

import { create } from "zustand";
import type { LearningFormat, Order } from "@/lib/types";

/**
 * Session-only admin commerce overrides (deliberately NOT persisted):
 * programme-level price edits and payment-status changes made from the order drawer.
 * They survive navigating between admin pages but reset on reload.
 */
interface CommerceAdminState {
  priceOverrides: Record<string, Partial<Record<LearningFormat, number>>>;
  paymentOverrides: Record<string, Order["paymentStatus"]>;
  setCoursePricing: (courseId: string, pricing: Partial<Record<LearningFormat, number>>) => void;
  resetCoursePricing: (courseId: string) => void;
  setPaymentStatus: (orderId: string, status: Order["paymentStatus"]) => void;
  clearPaymentStatus: (orderId: string) => void;
}

export const useCommerceAdmin = create<CommerceAdminState>()((set) => ({
  priceOverrides: {},
  paymentOverrides: {},
  setCoursePricing: (courseId, pricing) => set((s) => ({ priceOverrides: { ...s.priceOverrides, [courseId]: pricing } })),
  resetCoursePricing: (courseId) =>
    set((s) => {
      const next = { ...s.priceOverrides };
      delete next[courseId];
      return { priceOverrides: next };
    }),
  setPaymentStatus: (orderId, status) => set((s) => ({ paymentOverrides: { ...s.paymentOverrides, [orderId]: status } })),
  clearPaymentStatus: (orderId) =>
    set((s) => {
      const next = { ...s.paymentOverrides };
      delete next[orderId];
      return { paymentOverrides: next };
    }),
}));
