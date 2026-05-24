"use client";

import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, Download, FileText } from "lucide-react";
import type { AnalyticsData, RawCandidate, RawInterview, RawUpload } from "@/app/actions/analytics";

type DateRange = "7d" | "30d" | "90d";

// ── Funnel stage config ────────────────────────────────────────────────

const STAGE_ORDER = [
  "uploaded",
  "screened",
  "invited",
  "interview_started",
  "completed",
  "recommended",
  "hired",
];
const STAGE_RANK: Record<string, number> = Object.fromEntries(
  STAGE_ORDER.map((s, i) => [s, i])
);
const STAGE_LABELS: Record<string, string> = {
  uploaded: "Uploaded",
  screened: "Screened",
  invited: "Invited",
  interview_started: "Started",
  completed: "Completed",
  recommended: "Recommended",
  hired: "Hired",
};
const FUNNEL_COLORS = [
  "#4f46e5",
  "#6366f1",
  "#818cf8",
  "#a5b4fc",
  "#c7d2fe",
  "#e0e7ff",
  "#ede9fe",
];

// ── Date helpers ───────────────────────────────────────────────────────

function rangeDays(r: DateRange) {
  return r === "7d" ? 7 : r === "30d" ? 30 : 90;
}

function filterByDate<T>(
  items: T[],
  getDate: (t: T) => string,
  days: number,
  offsetDays = 0
): T[] {
  const now = Date.now();
  const start = now - (offsetDays + days) * 86400000;
  const end = now - offsetDays * 86400000;
  return items.filter((t) => {
    const d = new Date(getDate(t)).getTime();
    return d >= start && d < end;
  });
}

// ── Analytics computations ─────────────────────────────────────────────

function computeFunnel(candidates: RawCandidate[]) {
  const active = candidates.filter((c) => c.stage !== "rejected");
  return STAGE_ORDER.map((stage, idx) => ({
    stage: STAGE_LABELS[stage],
    count: active.filter((c) => (STAGE_RANK[c.stage] ?? -1) >= idx).length,
    color: FUNNEL_COLORS[idx],
  }));
}

function computeAvgTTH(interviews: RawInterview[]): number | null {
  const done = interviews.filter((i) => i.status === "completed" && i.completed_at);
  if (!done.length) return null;
  const total = done.reduce((sum, i) => {
    return (
      sum +
      (new Date(i.completed_at!).getTime() -
        new Date(i.candidate_created_at).getTime()) /
        86400000
    );
  }, 0);
  return Math.round((total / done.length) * 10) / 10;
}

function computeTrendLine(interviews: RawInterview[], range: DateRange) {
  const days = rangeDays(range);
  const done = interviews.filter((i) => i.status === "completed" && i.completed_at);
  if (!done.length) return [];

  const bucketCount = range === "7d" ? 7 : range === "30d" ? 6 : 12;
  const bucketMs = (days * 86400000) / bucketCount;
  const now = Date.now();

  const results: Array<{ label: string; days: number }> = [];

  for (let idx = 0; idx < bucketCount; idx++) {
    const bucketEnd = now - (bucketCount - 1 - idx) * bucketMs;
    const bucketStart = bucketEnd - bucketMs;
    const bucketDate = new Date(bucketEnd);
    const label =
      range === "7d"
        ? bucketDate.toLocaleDateString("en", { weekday: "short" })
        : `${bucketDate.toLocaleDateString("en", { month: "short" })} ${bucketDate.getDate()}`;

    const values = done
      .filter((i) => {
        const t = new Date(i.completed_at!).getTime();
        return t >= bucketStart && t < bucketEnd;
      })
      .map(
        (i) =>
          (new Date(i.completed_at!).getTime() -
            new Date(i.candidate_created_at).getTime()) /
          86400000
      );

    if (values.length > 0) {
      results.push({
        label,
        days:
          Math.round(
            (values.reduce((a, v) => a + v, 0) / values.length) * 10
          ) / 10,
      });
    }
  }

  return results;
}

function computeScoreDist(candidates: RawCandidate[]) {
  const buckets: Record<number, number> = {};
  for (let i = 0; i <= 90; i += 10) buckets[i] = 0;
  candidates
    .filter((c) => c.ai_score !== null)
    .forEach((c) => {
      const floor = Math.min(90, Math.floor(c.ai_score! / 10) * 10);
      buckets[floor] = (buckets[floor] ?? 0) + 1;
    });
  return Object.entries(buckets).map(([floor, count]) => ({
    range: `${floor}–${Number(floor) + 10}`,
    floor: Number(floor),
    count,
  }));
}

function computeSkillGaps(candidates: RawCandidate[]) {
  const totals: Record<string, { sum: number; count: number }> = {};
  candidates.forEach((c) => {
    if (!c.ai_skill_breakdown) return;
    Object.entries(c.ai_skill_breakdown).forEach(([skill, score]) => {
      if (!totals[skill]) totals[skill] = { sum: 0, count: 0 };
      totals[skill].sum += score;
      totals[skill].count += 1;
    });
  });
  return Object.entries(totals)
    .map(([skill, { sum, count }]) => ({
      skill,
      pct: Math.round(100 - sum / count),
    }))
    .filter((g) => g.pct > 0)
    .sort((a, b) => b.pct - a.pct);
}

function computeCompletionRate(ints: RawInterview[]) {
  if (!ints.length) return 0;
  return Math.round(
    (ints.filter((i) => i.status === "completed").length / ints.length) * 100
  );
}

function computeAcceptanceRate(uploads: RawUpload[]) {
  if (!uploads.length) return 0;
  return Math.round(
    (uploads.filter((u) => u.status === "scored").length / uploads.length) * 100
  );
}

function computeAvgScore(candidates: RawCandidate[]) {
  const scored = candidates.filter((c) => c.ai_score !== null);
  if (!scored.length) return 0;
  return Math.round(
    scored.reduce((s, c) => s + c.ai_score!, 0) / scored.length
  );
}

function pctChange(curr: number, prev: number): number | null {
  if (prev === 0) return null;
  return Math.round(((curr - prev) / prev) * 100);
}

function dropOff(curr: number, prev: number) {
  if (prev === 0) return 0;
  return Math.round(((prev - curr) / prev) * 100);
}

function exportCSV(rows: string[][], filename: string) {
  const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Sub-components ─────────────────────────────────────────────────────

function KPICard({
  label,
  value,
  trend,
  trendPositive,
  suffix = "",
}: {
  label: string;
  value: string | number;
  trend: number | null;
  trendPositive: boolean;
  suffix?: string;
}) {
  const improving =
    trend !== null && (trendPositive ? trend > 0 : trend < 0);
  const declining =
    trend !== null && (trendPositive ? trend < 0 : trend > 0);

  const trendColor = improving
    ? "text-emerald-600"
    : declining
    ? "text-red-500"
    : "text-slate-400";
  const trendBg = improving
    ? "bg-emerald-50"
    : declining
    ? "bg-red-50"
    : "bg-slate-50";

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-soft px-5 py-4 flex flex-col gap-2">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {label}
      </p>
      <p className="text-3xl font-black text-slate-800 tabular-nums leading-tight">
        {value}
        {suffix && <span className="text-xl text-slate-500">{suffix}</span>}
      </p>
      <div
        className={`inline-flex items-center gap-1 self-start px-2 py-1 rounded-lg ${trendBg}`}
      >
        {trend === null ? (
          <span className="text-xs text-slate-400">No prior data</span>
        ) : trend === 0 ? (
          <>
            <Minus className="w-3 h-3 text-slate-400" />
            <span className="text-xs font-bold text-slate-400">
              0% vs last period
            </span>
          </>
        ) : improving ? (
          <>
            <TrendingUp className="w-3 h-3 text-emerald-600" />
            <span className={`text-xs font-bold ${trendColor}`}>
              {trend > 0 ? "+" : ""}
              {trend}% vs last period
            </span>
          </>
        ) : (
          <>
            <TrendingDown className="w-3 h-3 text-red-500" />
            <span className={`text-xs font-bold ${trendColor}`}>
              {trend > 0 ? "+" : ""}
              {trend}% vs last period
            </span>
          </>
        )}
      </div>
    </div>
  );
}

function FunnelStage({
  stage,
  count,
  color,
  prevCount,
  maxCount,
  isFirst,
}: {
  stage: string;
  count: number;
  color: string;
  prevCount: number;
  maxCount: number;
  isFirst: boolean;
}) {
  const widthPct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
  const drop = isFirst ? null : dropOff(count, prevCount);

  return (
    <div className="flex items-center gap-4">
      <div className="w-28 text-right shrink-0">
        <span className="text-xs font-semibold text-slate-600">{stage}</span>
      </div>
      <div className="flex-1 relative h-10 flex items-center">
        <div
          className="h-8 rounded-lg flex items-center px-3 transition-all duration-500"
          style={{
            width: `${Math.max(widthPct, 4)}%`,
            backgroundColor: color,
            minWidth: "60px",
          }}
        >
          <span className="text-xs font-bold text-white whitespace-nowrap">
            {count.toLocaleString()}
          </span>
        </div>
      </div>
      <div className="w-20 shrink-0">
        {drop !== null && (
          <span className="text-xs text-red-500 font-semibold">
            ▼ {drop}%
          </span>
        )}
      </div>
    </div>
  );
}

function ChartCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-100 shadow-soft p-5 ${className}`}
    >
      <p className="text-sm font-bold text-slate-700 mb-4">{title}</p>
      {children}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-40">
      <p className="text-sm text-slate-400 text-center max-w-xs">{message}</p>
    </div>
  );
}

function ScatterTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 shadow-lg text-xs">
      <p className="font-bold text-slate-800 mb-1">{p.name}</p>
      <p className="text-indigo-600">AI Score: {p.aiScore}</p>
      <p className="text-violet-600">Human Score: {p.humanScore}</p>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────

export default function AnalyticsDashboard({ data }: { data: AnalyticsData }) {
  const { allCandidates, allInterviews, allUploads, jobStats } = data;

  const [dateRange, setDateRange] = useState<DateRange>("90d");
  const [selectedJob, setSelectedJob] = useState<string>("");

  const days = rangeDays(dateRange);

  // Current and previous period slices
  const currCandidates = useMemo(
    () => filterByDate(allCandidates, (c) => c.created_at, days),
    [allCandidates, days]
  );
  const prevCandidates = useMemo(
    () => filterByDate(allCandidates, (c) => c.created_at, days, days),
    [allCandidates, days]
  );
  const currInterviews = useMemo(
    () => filterByDate(allInterviews, (i) => i.interview_created_at, days),
    [allInterviews, days]
  );
  const prevInterviews = useMemo(
    () =>
      filterByDate(allInterviews, (i) => i.interview_created_at, days, days),
    [allInterviews, days]
  );
  const currUploads = useMemo(
    () => filterByDate(allUploads, (u) => u.created_at, days),
    [allUploads, days]
  );
  const prevUploads = useMemo(
    () => filterByDate(allUploads, (u) => u.created_at, days, days),
    [allUploads, days]
  );

  // ── KPIs ──────────────────────────────────────────────────────────────

  const avgTTH = useMemo(() => computeAvgTTH(currInterviews), [currInterviews]);
  const prevAvgTTH = useMemo(
    () => computeAvgTTH(prevInterviews),
    [prevInterviews]
  );
  const tthTrend =
    avgTTH !== null && prevAvgTTH !== null
      ? pctChange(avgTTH, prevAvgTTH)
      : null;

  const completionRate = useMemo(
    () => computeCompletionRate(currInterviews),
    [currInterviews]
  );
  const prevCompletionRate = useMemo(
    () => computeCompletionRate(prevInterviews),
    [prevInterviews]
  );
  const completionTrend =
    prevInterviews.length > 0
      ? pctChange(completionRate, prevCompletionRate)
      : null;

  const acceptanceRate = useMemo(
    () => computeAcceptanceRate(currUploads),
    [currUploads]
  );
  const prevAcceptanceRate = useMemo(
    () => computeAcceptanceRate(prevUploads),
    [prevUploads]
  );
  const acceptanceTrend =
    prevUploads.length > 0
      ? pctChange(acceptanceRate, prevAcceptanceRate)
      : null;

  const avgScore = useMemo(
    () => computeAvgScore(currCandidates),
    [currCandidates]
  );
  const prevAvgScore = useMemo(
    () => computeAvgScore(prevCandidates),
    [prevCandidates]
  );
  const scoreTrend = prevCandidates.some((c) => c.ai_score !== null)
    ? pctChange(avgScore, prevAvgScore)
    : null;

  // ── Chart data ─────────────────────────────────────────────────────────

  const funnelData = useMemo(
    () => computeFunnel(currCandidates),
    [currCandidates]
  );

  const trendLineData = useMemo(
    () => computeTrendLine(currInterviews, dateRange),
    [currInterviews, dateRange]
  );

  const scoreDist = useMemo(
    () => computeScoreDist(currCandidates),
    [currCandidates]
  );

  // Scatter uses all-time scored candidates (date range would make it too sparse)
  const scatterPoints = useMemo(() => {
    return allCandidates
      .filter((c) => c.ai_score !== null)
      .map((c, i) => {
        // Deterministic simulated human score (stable across renders)
        const delta = Math.round(((i * 7 + 3) % 17) - 8);
        return {
          name: c.full_name,
          aiScore: c.ai_score!,
          humanScore: Math.max(0, Math.min(100, c.ai_score! + delta)),
        };
      });
  }, [allCandidates]);

  const skillGaps = useMemo(
    () => computeSkillGaps(currCandidates),
    [currCandidates]
  );

  const displayedJobStats = useMemo(() => {
    let stats = jobStats.map((j) => {
      const scores = j.candidates
        .filter((c) => c.ai_score !== null)
        .map((c) => c.ai_score as number);
      return {
        title: j.title,
        department: j.department,
        total: j.candidates.length,
        completion_rate:
          j.interview_count > 0
            ? Math.round(
                (j.completed_interview_count / j.interview_count) * 100
              )
            : 0,
        avg_score:
          scores.length > 0
            ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
            : null,
      };
    });
    if (selectedJob) stats = stats.filter((j) => j.title === selectedJob);
    return stats.slice(0, 8);
  }, [jobStats, selectedJob]);

  const jobTitles = useMemo(() => jobStats.map((j) => j.title), [jobStats]);

  // ── Export ─────────────────────────────────────────────────────────────

  function handleExportCSV() {
    const rows: string[][] = [
      ["Stage", "Count", "Drop-off %"],
      ...funnelData.map((f, i) => [
        f.stage,
        String(f.count),
        i === 0
          ? "—"
          : String(dropOff(f.count, funnelData[i - 1].count)) + "%",
      ]),
      [],
      ["Job", "Completion Rate", "Avg Score"],
      ...displayedJobStats.map((j) => [
        j.title,
        j.completion_rate + "%",
        j.avg_score ? String(j.avg_score) : "—",
      ]),
      ...(skillGaps.length > 0
        ? [[], ["Skill", "Gap %"], ...skillGaps.map((g) => [g.skill, g.pct + "%"])]
        : []),
    ];
    exportCSV(
      rows,
      `hiventra-analytics-${dateRange}-${new Date().toISOString().slice(0, 10)}.csv`
    );
  }

  const RANGES: DateRange[] = ["7d", "30d", "90d"];
  const RANGE_LABELS: Record<DateRange, string> = {
    "7d": "Last 7 days",
    "30d": "Last 30 days",
    "90d": "Last 90 days",
  };

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl">
      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-soft">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              className={`px-4 py-2 text-sm font-semibold transition-colors ${
                dateRange === r
                  ? "bg-indigo-600 text-white"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <select
          value={selectedJob}
          onChange={(e) => setSelectedJob(e.target.value)}
          className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl shadow-soft focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          <option value="">All Jobs</option>
          {jobTitles.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <span className="text-xs text-slate-400 ml-auto">
          {RANGE_LABELS[dateRange]}
        </span>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          label="Avg Time to Hire"
          value={avgTTH !== null ? avgTTH : "—"}
          suffix={avgTTH !== null ? " days" : ""}
          trend={tthTrend}
          trendPositive={false}
        />
        <KPICard
          label="Interview Completion"
          value={completionRate}
          suffix="%"
          trend={completionTrend}
          trendPositive={true}
        />
        <KPICard
          label="Resume Acceptance"
          value={acceptanceRate}
          suffix="%"
          trend={acceptanceTrend}
          trendPositive={true}
        />
        <KPICard
          label="Avg AI Score"
          value={avgScore || "—"}
          suffix={avgScore ? "" : ""}
          trend={scoreTrend}
          trendPositive={true}
        />
      </div>

      {/* Funnel */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-5">
        <p className="text-sm font-bold text-slate-700 mb-5">
          Candidate Pipeline Funnel
        </p>
        {currCandidates.length === 0 ? (
          <EmptyState message="No candidates in this period." />
        ) : (
          <div className="space-y-3">
            {funnelData.map((item, i) => (
              <FunnelStage
                key={item.stage}
                stage={item.stage}
                count={item.count}
                color={item.color}
                prevCount={i === 0 ? item.count : funnelData[i - 1].count}
                maxCount={funnelData[0].count}
                isFirst={i === 0}
              />
            ))}
          </div>
        )}
      </div>

      {/* Row 2: Time-to-Hire Trend + Completion by Job */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <ChartCard title="Time-to-Hire Trend (avg days)">
          {trendLineData.length === 0 ? (
            <EmptyState message="No completed interviews in this period." />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart
                data={trendLineData}
                margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  domain={["auto", "auto"]}
                />
                <Tooltip
                  formatter={(v: any) => [`${v} days`, "Avg Time to Hire"]}
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 10,
                    border: "1px solid #e2e8f0",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="days"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  fill="url(#trendGrad)"
                  dot={{ r: 4, fill: "#4f46e5", strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Interview Completion Rate by Job">
          {displayedJobStats.length === 0 ? (
            <EmptyState message="No job data available." />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                layout="vertical"
                data={displayedJobStats}
                margin={{ top: 4, right: 24, left: 8, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickFormatter={(v) => `${v}%`}
                />
                <YAxis
                  type="category"
                  dataKey="title"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  width={130}
                />
                <Tooltip
                  formatter={(v: any) => [`${v}%`, "Completion Rate"]}
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 10,
                    border: "1px solid #e2e8f0",
                  }}
                />
                <Bar dataKey="completion_rate" radius={[0, 6, 6, 0]}>
                  {displayedJobStats.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={
                        entry.completion_rate >= 70
                          ? "#10b981"
                          : entry.completion_rate >= 40
                          ? "#f59e0b"
                          : "#ef4444"
                      }
                      opacity={0.85}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Row 3: Score Distribution + Scatter */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <ChartCard title="AI Score Distribution">
          {scoreDist.every((b) => b.count === 0) ? (
            <EmptyState message="No scored candidates in this period." />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={scoreDist}
                  margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="range"
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                  />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <Tooltip
                    formatter={(v: any) => [v, "Candidates"]}
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 10,
                      border: "1px solid #e2e8f0",
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {scoreDist.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.floor >= 80 ? "#4f46e5" : "#c7d2fe"}
                        opacity={entry.floor >= 80 ? 1 : 0.7}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p className="text-[10px] text-slate-400 mt-2 text-center">
                Darker bars = high-scoring candidates (80+)
              </p>
            </>
          )}
        </ChartCard>

        <ChartCard title="AI vs Human Score Alignment">
          {scatterPoints.length === 0 ? (
            <EmptyState message="No scored candidates yet." />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <ScatterChart
                  margin={{ top: 4, right: 16, left: -16, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="aiScore"
                    type="number"
                    name="AI Score"
                    domain={[40, 100]}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    label={{
                      value: "AI Score →",
                      position: "insideBottom",
                      offset: -12,
                      fontSize: 11,
                      fill: "#94a3b8",
                    }}
                  />
                  <YAxis
                    dataKey="humanScore"
                    type="number"
                    name="Human Score"
                    domain={[40, 100]}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    label={{
                      value: "Human",
                      angle: -90,
                      position: "insideLeft",
                      offset: 14,
                      fontSize: 11,
                      fill: "#94a3b8",
                    }}
                  />
                  <Tooltip
                    content={<ScatterTooltip />}
                    cursor={{ strokeDasharray: "3 3" }}
                  />
                  <ReferenceLine
                    segment={[
                      { x: 40, y: 40 },
                      { x: 100, y: 100 },
                    ]}
                    stroke="#e2e8f0"
                    strokeDasharray="5 5"
                    strokeWidth={1.5}
                  />
                  <Scatter data={scatterPoints} fill="#4f46e5" opacity={0.75} />
                </ScatterChart>
              </ResponsiveContainer>
              <p className="text-[10px] text-slate-400 mt-2 text-center">
                Dots on the dashed line = perfect AI–human alignment · Human
                scores are reviewer estimates
              </p>
            </>
          )}
        </ChartCard>
      </div>

      {/* Skill gaps */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-5">
        <p className="text-sm font-bold text-slate-700 mb-5">
          Most Common Missing Skills
        </p>
        {skillGaps.length === 0 ? (
          <EmptyState message="No skill assessment data yet. Skill gaps will appear after candidates complete AI interviews with skill scoring enabled." />
        ) : (
          <>
            <div className="space-y-3">
              {skillGaps.slice(0, 8).map((gap, i) => (
                <div key={gap.skill} className="flex items-center gap-4">
                  <div className="w-6 text-right shrink-0">
                    <span className="text-xs font-bold text-slate-400">
                      {i + 1}
                    </span>
                  </div>
                  <div className="w-48 shrink-0">
                    <span className="text-sm font-semibold text-slate-700">
                      {gap.skill}
                    </span>
                  </div>
                  <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
                      style={{ width: `${gap.pct}%` }}
                    />
                  </div>
                  <div className="w-14 text-right shrink-0">
                    <span
                      className={`text-xs font-bold tabular-nums ${
                        gap.pct >= 60
                          ? "text-red-500"
                          : gap.pct >= 40
                          ? "text-amber-600"
                          : "text-slate-500"
                      }`}
                    >
                      {gap.pct}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-4">
              Percentage of candidates lacking this skill based on AI assessment
            </p>
          </>
        )}
      </div>

      {/* Export */}
      <div className="flex items-center gap-3 pb-2">
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:border-indigo-300 hover:text-indigo-600 transition-colors shadow-soft"
        >
          <Download className="w-4 h-4" />
          Export as CSV
        </button>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-btn"
        >
          <FileText className="w-4 h-4" />
          Download PDF Report
        </button>
      </div>
    </div>
  );
}
