"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { getMentor } from "@/data";
import { MentorProfile } from "@/components/site/mentors/mentor-profile";

export default function MentorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  if (!getMentor(id)) notFound();
  return <MentorProfile key={id} mentorId={id} />;
}
