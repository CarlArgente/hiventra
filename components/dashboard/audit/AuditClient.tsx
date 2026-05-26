"use client";

import { useState, useTransition, useCallback } from "react";
import {
  Lock,
  ChevronDown,
  ChevronRight,
  Download,
  AlertTriangle,
  CheckCircle,
  ShieldCheck,
  Search,
  Filter,
  TrendingUp,
  Star,
  FileSearch,
  RefreshCw,
  Info,
} from "lucide-react";
import {
  getAuditLog,
  markAlertReviewed,
} from "@/app/actions/audit";
import type {
  AuditEntry,
  AnomalyAlert,
  AuditStats,
  JobScoreDistribution,
  AuditFilters,
} from "@/app/actions/audit";

// ── helpers ─────────────────────────────────────────────────────────────────

const EVENT_LABELS: Record<string, string> = {
  resume_scored: "Resume Scored",
  interview_analyzed: "Interview Analyzed",
  stage_changed: "Stage Changed",
};

const REC_LABELS: Record<string, string> = {
  strongly_recommend: "Strongly Recommend",
  recommend: "Recommend",
  review_further: "Review Further",
  do_not_recommend: "Do Not Recommend",
};

const REC_COLORS: Record<string, string> = {
  strongly_recommend: "bg-emerald-100 text-emerald-700",
  recommend: "bg-green-100 text-green-700",
  review_further: "bg-amber-100 text-amber-700",
  do_not_recommend: "bg-red-100 text-red-700",
};

const SEVERITY_COLORS: Record<string, string> = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-blue-100 text-blue-700 border-blue-200",
};

function fmt(date: string) {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtShort(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function exportCSV(entries: AuditEntry[]) {
  const headers = [
    "Date",
    "Candidate",
    "Job",
    "Event",
    "AI Score",
    "AI Recommendation",
    "Human Action",
    "Action By",
    "Override?",
  ];
  const rows = entries.map((e) => [
    fmt(e.created_at),
    e.candidate_name,
    e.job_title,
    EVENT_LABELS[e.event_type] ?? e.event_type,
    e.ai_score ?? "",
    REC_LABELS[e.ai_recommendation ?? ""] ?? e.ai_recommendation ?? "",
    e.human_action ?? "",
    e.human_action_by_name ?? "",
    e.is_override ? "Yes" : "No",
  ]);
  const csv = [headers, ...rows]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `hiventra-audit-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Score bar ────────────────────────────────────────────────────────────────

function ScoreBar({ value, max }: { value: number; max: number }) {
  const pct = Math.round((value / Math.max(max, 1)) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-indigo-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-slate-600 w-6 text-right">{value}</span>
    </div>
  );
}

// ── Props ────────────────────────────────────────────────────────────────────

interface Props {
  initialEntries: AuditEntry[];
  initialTotal: number;
  stats: AuditStats;
  distribution: JobScoreDistribution[];
  anomalyAlerts: AnomalyAlert[];
  jobs: Array<{ id: string; title: string }>;
}

// ── Main component ───────────────────────────────────────────────────────────

export default function AuditClient({
  initialEntries,
  initialTotal,
  stats,
  distribution,
  anomalyAlerts: initialAlerts,
  jobs,
}: Props) {
  // ── Audit log state
  const [entries, setEntries] = useState(initialEntries);
  const [total, setTotal] = useState(initialTotal);
  const [filters, setFilters] = useState<AuditFilters>({});
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, startLoading] = useTransition();

  // ── Fairness state
  const [alerts, setAlerts] = useState(initialAlerts);
  const [reviewingId, startReviewing] = useTransition();

  const totalPages = Math.max(1, Math.ceil(total / 25));

  // ── Filter / paginate
  const applyFilters = useCallback(
    (newFilters: AuditFilters, newPage = 1) => {
      startLoading(async () => {
        const result = await getAuditLog({ ...newFilters, page: newPage });
        setEntries(result.entries);
        setTotal(result.total);
        setPage(newPage);
        setExpandedId(null);
      });
    },
    []
  );

  const updateFilter = (key: keyof AuditFilters, value: string | boolean | undefined) => {
    const next = { ...filters, [key]: value || undefined };
    setFilters(next);
    applyFilters(next, 1);
  };

  // ── Mark alert reviewed
  const handleReviewAlert = (id: string) => {
    startReviewing(async () => {
      await markAlertReviewed(id);
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, status: "reviewed" as const } : a
        )
      );
    });
  };

  const openAlerts = alerts.filter((a) => a.status === "open");
  const hasAnomaly = openAlerts.length > 0;

  return (
    <div className="p-4 sm:p-6 space-y-6">

      {/* ── Stats bar ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total AI Decisions", value: stats.total_decisions, icon: ShieldCheck, color: "text-indigo-600" },
          { label: "Override Count", value: stats.override_count, icon: AlertTriangle, color: "text-amber-600" },
          { label: "Avg Resume Score", value: stats.avg_resume_score !== null ? `${stats.avg_resume_score}/100` : "—", icon: TrendingUp, color: "text-emerald-600" },
          { label: "Avg Interview Score", value: stats.avg_interview_score !== null ? `${stats.avg_interview_score}/100` : "—", icon: Star, color: "text-violet-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500">{label}</p>
              <p className="text-lg font-bold text-slate-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Two-column body ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_480px] gap-6 items-start">

      {/* ── LEFT: Audit Log ─────────────────────────────────────────────── */}
      <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-400" />
            <h2 className="font-semibold text-slate-800">Audit Log</h2>
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-mono">
              Immutable Record
            </span>
            <span className="text-xs text-slate-400">{total} entries</span>
          </div>
          <button
            onClick={() => exportCSV(entries)}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>

        {/* Filter bar */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex flex-wrap gap-3 items-center">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />

          <select
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            value={filters.job_id ?? ""}
            onChange={(e) => updateFilter("job_id", e.target.value)}
          >
            <option value="">All Jobs</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>{j.title}</option>
            ))}
          </select>

          <input
            type="date"
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            value={filters.date_from ?? ""}
            onChange={(e) => updateFilter("date_from", e.target.value)}
            placeholder="From"
          />
          <input
            type="date"
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            value={filters.date_to ?? ""}
            onChange={(e) => updateFilter("date_to", e.target.value)}
            placeholder="To"
          />

          <select
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            value={filters.recommendation ?? ""}
            onChange={(e) => updateFilter("recommendation", e.target.value)}
          >
            <option value="">All Recommendations</option>
            <option value="strongly_recommend">Strongly Recommend</option>
            <option value="recommend">Recommend</option>
            <option value="review_further">Review Further</option>
            <option value="do_not_recommend">Do Not Recommend</option>
          </select>

          <select
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            value={filters.is_override === undefined ? "" : String(filters.is_override)}
            onChange={(e) =>
              updateFilter(
                "is_override",
                e.target.value === "" ? undefined : e.target.value === "true"
              )
            }
          >
            <option value="">All Actions</option>
            <option value="true">Overrides Only</option>
            <option value="false">No Override</option>
          </select>

          {(filters.job_id || filters.date_from || filters.date_to || filters.recommendation || filters.is_override !== undefined) && (
            <button
              onClick={() => {
                setFilters({});
                applyFilters({}, 1);
              }}
              className="text-xs text-indigo-600 hover:underline"
            >
              Clear filters
            </button>
          )}

          {loading && <RefreshCw className="w-3.5 h-3.5 text-slate-400 animate-spin ml-auto" />}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 text-[10px] text-slate-500 font-medium uppercase tracking-wide">
                <th className="px-3 py-2.5 text-left w-4" />
                <th className="px-3 py-2.5 text-left">Date</th>
                <th className="px-3 py-2.5 text-left">Candidate</th>
                <th className="px-3 py-2.5 text-left">Job</th>
                <th className="px-3 py-2.5 text-left">Event</th>
                <th className="px-3 py-2.5 text-center">AI Score</th>
                <th className="px-3 py-2.5 text-left">Recommendation</th>
                <th className="px-3 py-2.5 text-left">Human Action</th>
                <th className="px-3 py-2.5 text-left">Action By</th>
                <th className="px-3 py-2.5 text-center">Override?</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-3 py-12 text-center text-slate-400 text-xs">
                    No audit entries found.
                  </td>
                </tr>
              )}
              {entries.map((entry) => {
                const isExpanded = expandedId === entry.id;
                return [
                  <tr
                    key={entry.id}
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    {/* Expand toggle */}
                    <td className="px-3 py-2.5 text-slate-400">
                      {isExpanded ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                    </td>
                    {/* Date */}
                    <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Lock className="w-2.5 h-2.5 text-slate-300 shrink-0" />
                        {fmtShort(entry.created_at)}
                      </div>
                    </td>
                    {/* Candidate */}
                    <td className="px-3 py-2.5 font-medium text-slate-800 whitespace-nowrap">
                      {entry.candidate_name}
                    </td>
                    {/* Job */}
                    <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">
                      {entry.job_title}
                    </td>
                    {/* Event */}
                    <td className="px-3 py-2.5">
                      <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                        {EVENT_LABELS[entry.event_type] ?? entry.event_type}
                      </span>
                    </td>
                    {/* AI Score */}
                    <td className="px-3 py-2.5 text-center">
                      {entry.ai_score !== null ? (
                        <span className="font-semibold text-slate-800">{entry.ai_score}</span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    {/* Recommendation */}
                    <td className="px-3 py-2.5">
                      {entry.ai_recommendation ? (
                        <span className={`px-2 py-0.5 rounded-full font-medium ${REC_COLORS[entry.ai_recommendation] ?? "bg-slate-100 text-slate-600"}`}>
                          {REC_LABELS[entry.ai_recommendation] ?? entry.ai_recommendation}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    {/* Human Action */}
                    <td className="px-3 py-2.5 text-slate-600">
                      {entry.human_action
                        ? entry.human_action.replace(/_/g, " ")
                        : <span className="text-slate-300">—</span>}
                    </td>
                    {/* Action By */}
                    <td className="px-3 py-2.5 text-slate-500">
                      {entry.human_action_by_name ?? <span className="text-slate-300">—</span>}
                    </td>
                    {/* Override badge */}
                    <td className="px-3 py-2.5 text-center">
                      {entry.is_override ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" />
                          Override
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" />
                          Followed
                        </span>
                      )}
                    </td>
                  </tr>,
                  isExpanded && (
                    <tr key={`${entry.id}-expand`} className="bg-slate-50">
                      <td colSpan={10} className="px-10 py-4">
                        <div className="flex items-start gap-2">
                          <FileSearch className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-slate-600 mb-1">
                              AI Justification
                            </p>
                            <p className="text-sm text-slate-700 leading-relaxed max-w-3xl">
                              {entry.ai_justification ?? (
                                <span className="text-slate-400 italic">
                                  No justification recorded for this event.
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-slate-400 mt-2">
                              Generated: {fmt(entry.created_at)} · ID:{" "}
                              <span className="font-mono">{entry.id}</span>
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ),
                ];
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Page {page} of {totalPages} · {total} entries
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1 || loading}
                onClick={() => applyFilters(filters, page - 1)}
                className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages || loading}
                onClick={() => applyFilters(filters, page + 1)}
                className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ── RIGHT column ────────────────────────────────────────────────── */}
      <div className="space-y-6">

      {/* Fairness Monitoring */}
      <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Fairness Monitoring</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Statistical oversight of AI scoring patterns across jobs
          </p>
        </div>

        <div className="p-5 space-y-5">
          {/* Disclaimer */}
          <div className="flex gap-3 bg-sky-50 border border-sky-200 rounded-xl p-4">
            <Info className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
            <p className="text-sm text-sky-800">
              <strong>Hiventra does not use demographic data in scoring.</strong>{" "}
              This panel monitors proxy signals only — score variance, distribution
              anomalies, and outlier detection across job postings.
            </p>
          </div>

          {/* Anomaly status banner */}
          {hasAnomaly ? (
            <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-xl p-4 items-start">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                <strong>{openAlerts.length} open anomaly alert{openAlerts.length > 1 ? "s" : ""}</strong>{" "}
                detected. Review the alerts below.
              </p>
            </div>
          ) : (
            <div className="flex gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-4 items-center">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <p className="text-sm text-emerald-800">
                No statistically significant anomaly detected across current job postings.
              </p>
            </div>
          )}

          {/* Score Distribution */}
          {distribution.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">
                Score Distribution by Job
              </h3>
              <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
                {distribution.map((d) => (
                  <div
                    key={d.job_title}
                    className="border border-slate-200 rounded-xl p-4"
                  >
                    <p className="text-sm font-medium text-slate-800 mb-3 truncate">
                      {d.job_title}
                    </p>
                    <div className="space-y-2 text-xs">
                      {[
                        { label: "Min", value: d.min },
                        { label: "Avg", value: d.avg },
                        { label: "Median", value: d.median },
                        { label: "Max", value: d.max },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <div className="flex justify-between text-slate-500 mb-1">
                            <span>{label}</span>
                          </div>
                          <ScoreBar value={value} max={100} />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-3">
                      {d.scores.length} scored candidate{d.scores.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Anomaly Alert log */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">
              Anomaly Alert Log
            </h3>
            {alerts.length === 0 ? (
              <p className="text-sm text-slate-400 py-4">No alerts recorded.</p>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {alerts.map((alert) => (
                  <div key={alert.id} className="px-4 py-3 flex flex-col gap-2">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full border self-start ${SEVERITY_COLORS[alert.severity]}`}
                    >
                      {alert.severity.toUpperCase()}
                    </span>
                    <div>
                      <p className="text-sm text-slate-700">{alert.description}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Detected {fmtShort(alert.detected_at)}
                        {alert.job_title && ` · ${alert.job_title}`}
                        {alert.status === "reviewed" && alert.reviewer_name && ` · Reviewed by ${alert.reviewer_name}`}
                      </p>
                    </div>
                    {alert.status === "open" ? (
                      <button
                        onClick={() => handleReviewAlert(alert.id)}
                        className="text-xs text-indigo-600 border border-indigo-200 rounded-lg px-3 py-1.5 hover:bg-indigo-50 transition-colors self-start"
                      >
                        Mark Reviewed
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-600 flex items-center gap-1 self-start">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Reviewed
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      </div>{/* end right column */}
      </div>{/* end two-column body */}
    </div>
  );
}

