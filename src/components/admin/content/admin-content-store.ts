"use client";

import { create } from "zustand";
import type { Assessment, Course, LiveSession } from "@/lib/types";

/**
 * Session-only admin state for the content screens (courses, assessments, live sessions).
 * Not persisted: these are "saved for this demo session" edits that don't need to reach other portals.
 * Changes that other portals must see go through the shared demo store instead.
 */
interface AdminContentState {
  /** Seed courses hidden from the admin list via "Remove" */
  removedCourseIds: string[];
  /** Field edits made to seed courses in the course editor */
  courseEdits: Record<string, Partial<Course>>;

  /** Sessions scheduled from the admin console */
  scheduledSessions: LiveSession[];
  /** Per-session overrides: instructor, reschedule, cancel, recording */
  sessionOverrides: Record<string, Partial<LiveSession> & { recordingItemId?: string }>;

  /** Assessments created in the admin console */
  newAssessments: Assessment[];
  /** Configuration edits for existing assessments */
  assessmentEdits: Record<string, Partial<Assessment> & { display?: Record<string, boolean> }>;

  removeCourse: (id: string) => void;
  saveCourseEdits: (id: string, patch: Partial<Course>) => void;
  addSession: (s: LiveSession) => void;
  overrideSession: (id: string, patch: Partial<LiveSession> & { recordingItemId?: string }) => void;
  addAssessment: (a: Assessment) => void;
  editAssessment: (id: string, patch: Partial<Assessment> & { display?: Record<string, boolean> }) => void;
}

export const useAdminContent = create<AdminContentState>()((set) => ({
  removedCourseIds: [],
  courseEdits: {},
  scheduledSessions: [],
  sessionOverrides: {},
  newAssessments: [],
  assessmentEdits: {},

  removeCourse: (id) => set((s) => ({ removedCourseIds: [...s.removedCourseIds, id] })),
  saveCourseEdits: (id, patch) => set((s) => ({ courseEdits: { ...s.courseEdits, [id]: { ...s.courseEdits[id], ...patch } } })),
  addSession: (session) => set((s) => ({ scheduledSessions: [session, ...s.scheduledSessions] })),
  overrideSession: (id, patch) => set((s) => ({ sessionOverrides: { ...s.sessionOverrides, [id]: { ...s.sessionOverrides[id], ...patch } } })),
  addAssessment: (a) => set((s) => ({ newAssessments: [a, ...s.newAssessments] })),
  editAssessment: (id, patch) => set((s) => ({ assessmentEdits: { ...s.assessmentEdits, [id]: { ...s.assessmentEdits[id], ...patch } } })),
}));
