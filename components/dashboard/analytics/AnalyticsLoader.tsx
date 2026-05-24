"use client";

import dynamic from "next/dynamic";
import type { AnalyticsData } from "@/app/actions/analytics";

const AnalyticsDashboard = dynamic(() => import("./AnalyticsDashboard"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center py-24">
      <p className="text-slate-400 text-sm">Loading analytics…</p>
    </div>
  ),
});

export default function AnalyticsLoader({ data }: { data: AnalyticsData }) {
  return <AnalyticsDashboard data={data} />;
}
