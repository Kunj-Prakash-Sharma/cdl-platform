"use client";

import { use } from "react";
import { AssessmentReport } from "@/components/assessment/assessment-report";

export default function ReportPage({ params }: { params: Promise<{ resultId: string }> }) {
  const { resultId } = use(params);
  return <AssessmentReport resultId={resultId} />;
}
