import { Suspense } from "react";
import { CollegesDirectory } from "@/components/admin/people/colleges-directory";

export default function AdminCollegesPage() {
  return (
    <Suspense>
      <CollegesDirectory />
    </Suspense>
  );
}
