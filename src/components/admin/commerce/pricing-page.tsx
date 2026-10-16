"use client";

import { useMemo, useState } from "react";
import { BadgePercent, Package, Receipt, TicketPercent } from "lucide-react";
import { DEMO_TODAY } from "@/data/constants";
import { useDemoStore } from "@/store/demo-store";
import { PageHeader, StatCard } from "@/components/shared/page-header";
import { InfoNote } from "@/components/admin/content/admin-kit";
import { PackagesSection } from "./packages-section";
import { ProgramPricing } from "./program-pricing";
import { CreatePromoDialog, PromoCodesSection } from "./promo-codes";

export function PricingPage() {
  const packages = useDemoStore((s) => s.packages);
  const promoCodes = useDemoStore((s) => s.promoCodes);
  const [creating, setCreating] = useState(false);

  const stats = useMemo(() => {
    const live = promoCodes.filter((p) => p.status === "active" && p.validTill >= DEMO_TODAY);
    const pct = promoCodes.filter((p) => p.discountType === "percent");
    return {
      activePackages: packages.filter((p) => p.active).length,
      activeCodes: live.length,
      redemptions: promoCodes.reduce((n, p) => n + p.uses, 0),
      avgPct: pct.length ? Math.round(pct.reduce((n, p) => n + p.value, 0) / pct.length) : 0,
    };
  }, [packages, promoCodes]);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Commerce"
          title="Pricing & Promos"
          description="Packages, programme-level prices per learning level, and promo codes."
        />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Active packages" value={`${stats.activePackages} / ${packages.length}`} icon={Package} hint="Live on checkout" />
          <StatCard label="Active promo codes" value={stats.activeCodes} icon={TicketPercent} accent="brand" hint={`${promoCodes.length} codes on record`} />
          <StatCard label="Total redemptions" value={stats.redemptions.toLocaleString("en-IN")} icon={Receipt} accent="info" hint="All codes, all time" />
          <StatCard label="Avg % discount" value={`${stats.avgPct}%`} icon={BadgePercent} accent="warning" hint="Across percentage codes" />
        </div>
        <InfoNote>
          The prices and promo codes here are what the <span className="font-medium">simulated checkout</span> uses. No real payments are processed in this prototype.
        </InfoNote>
      </div>
      <PackagesSection />
      <ProgramPricing />
      <PromoCodesSection onCreate={() => setCreating(true)} />
      <CreatePromoDialog open={creating} onOpenChange={setCreating} />
    </div>
  );
}
