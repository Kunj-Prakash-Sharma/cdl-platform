"use client";

/**
 * Session-only (not persisted) state for the admin Engagement screens, so moderation work survives
 * navigating between admin pages: certificate revocations/reissues, announcement history,
 * doubt assignments and support-ticket replies.
 */

import { create } from "zustand";
import { demoTimestamp, newId } from "@/store/demo-store";
import { seedAnnouncements, type Announcement } from "./engagement-data";

export interface CertOverride {
  status: "revoked" | "reissued";
  reason?: string;
  note?: string;
  /** Effective issue date after a reissue */
  issuedOn?: string;
  changedAt: string;
}

export interface TicketReply {
  id: string;
  body: string;
  author: string;
  at: string;
}

interface EngagementState {
  certOverrides: Record<string, CertOverride>;
  announcements: Announcement[];
  /** threadId → mentorId */
  doubtAssignments: Record<string, string>;
  ticketReplies: Record<string, TicketReply[]>;

  revokeCertificate: (id: string, reason: string, note?: string) => void;
  reissueCertificate: (id: string, issuedOn: string) => void;
  addAnnouncement: (a: Omit<Announcement, "id" | "createdBy">) => Announcement;
  updateAnnouncement: (id: string, patch: Partial<Announcement>) => void;
  removeAnnouncement: (id: string) => void;
  assignDoubt: (threadId: string, mentorId: string) => void;
  addTicketReply: (ticketId: string, body: string) => void;
}

export const useEngagementStore = create<EngagementState>()((set) => ({
  certOverrides: {},
  announcements: seedAnnouncements,
  doubtAssignments: {},
  ticketReplies: {},

  revokeCertificate: (id, reason, note) =>
    set((s) => ({ certOverrides: { ...s.certOverrides, [id]: { ...s.certOverrides[id], status: "revoked", reason, note, changedAt: demoTimestamp() } } })),
  reissueCertificate: (id, issuedOn) =>
    set((s) => ({ certOverrides: { ...s.certOverrides, [id]: { status: "reissued", issuedOn, changedAt: demoTimestamp() } } })),

  addAnnouncement: (a) => {
    const item: Announcement = { ...a, id: newId("an"), createdBy: "Aditi Kulkarni" };
    set((s) => ({ announcements: [item, ...s.announcements] }));
    return item;
  },
  updateAnnouncement: (id, patch) => set((s) => ({ announcements: s.announcements.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),
  removeAnnouncement: (id) => set((s) => ({ announcements: s.announcements.filter((a) => a.id !== id) })),

  assignDoubt: (threadId, mentorId) => set((s) => ({ doubtAssignments: { ...s.doubtAssignments, [threadId]: mentorId } })),
  addTicketReply: (ticketId, body) =>
    set((s) => ({
      ticketReplies: {
        ...s.ticketReplies,
        [ticketId]: [...(s.ticketReplies[ticketId] ?? []), { id: newId("tr"), body, author: "Aditi Kulkarni", at: demoTimestamp() }],
      },
    })),
}));
