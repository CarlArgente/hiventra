import Topbar from "@/components/dashboard/Topbar";
import AuditClient from "@/components/dashboard/audit/AuditClient";
import {
  getAuditLog,
  getAuditStats,
  getScoreDistribution,
  getAnomalyAlerts,
} from "@/app/actions/audit";
import { createClient } from "@/lib/supabase/server";

export default async function AuditPage() {
  const supabase = await createClient();
  await supabase.auth.getUser();

  const [{ entries, total }, stats, distribution, anomalyAlerts, { data: jobRows }] =
    await Promise.all([
      getAuditLog({ page: 1 }),
      getAuditStats(),
      getScoreDistribution(),
      getAnomalyAlerts(),
      supabase.from("jobs").select("id, title").order("title"),
    ]);

  const jobs = (jobRows ?? []) as Array<{ id: string; title: string }>;

  return (
    <>
      <Topbar
        title="AI Transparency & Audit"
        subtitle="Monitor AI decisions, review scoring rationale, and ensure fair hiring."
      />
      <main className="flex-1 overflow-y-auto bg-brand-bg">
        <AuditClient
          initialEntries={entries}
          initialTotal={total}
          stats={stats}
          distribution={distribution}
          anomalyAlerts={anomalyAlerts}
          jobs={jobs}
        />
      </main>
    </>
  );
}
