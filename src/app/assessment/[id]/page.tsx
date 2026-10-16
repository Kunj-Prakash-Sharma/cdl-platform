"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { getAssessment } from "@/data";
import { AssessmentRunner } from "@/components/assessment/assessment-runner";

export default function AssessmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const assessment = getAssessment(id);
  if (!assessment) notFound();
  return <AssessmentRunner assessment={assessment} />;
}
