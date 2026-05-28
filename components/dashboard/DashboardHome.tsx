"use client";

import {
  Briefcase,
  Upload,
  CheckCircle,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Clock,
  Plus,
  BarChart2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { DashboardData } from "@/app/actions/dashboard";
import Link from "next/link";

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const EVENT_LABELS: Record<string, { label: string; color: string }> = {
  resume_scored: { label: "Resume scored", color: "bg-indigo-100 text-indigo-700" },
  interview_analyzed: { label: "Interview analyzed", color: "bg-emerald-100 text-emerald-700" },
  stage_changed: { label: "Stage updated", color: "bg-amber-100 text-amber-700" },
};

const STATUS_COLOR: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  draft: "bg-amber-100 text-amber-700",
  closed: "bg-slate-100 text-slate-500",
  archived: "bg-slate-100 text-slate-400",
};

const PIPELINE_COLORS = [
  "#6366f1", "#7c3aed", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#ede9fe",
];

interface KPICardProps {
  label: string;
  value: number;
  delta: number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  suffix?: string;
}

function KPICard({ label, value, delta, icon: Icon, iconBg, iconColor, suffix }: KPICardProps) {
  const up = delta >= 0;
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <span className={`flex items-center gap-1 text-xs font-semibold ${up ? "text-emerald-600" : "text-red-500"}`}>
          {up ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
          {up ? "+" : ""}{delta}{suffix ?? ""}
        </span>
      </div>
      <div className="text-3xl font-extrabold text-slate-900">{value}</div>
      <div className="text-sm text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}

export default function DashboardHome({ data }: { data: DashboardData }) {
  const { userName, kpis, jobs, activity, pipeline } = data;

  return (
    <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {greeting()}, {userName} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{formatDate()}</p>
          <p className="text-xs text-slate-400 mt-1">Here&apos;s what&apos;s happening with your hiring pipeline today.</p>
        </div>
        <Link
          href="/jobs"
          className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold px-4 py-2.5 rounded-full shadow-sm hover:-translate-y-0.5 transition-all duration-200 text-sm"
        >
          <Plus className="w-4 h-4" /> New Job
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          label="Active Jobs"
          value={kpis.activeJobs}
          delta={kpis.activeJobsDelta}
          icon={Briefcase}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
        />
        <KPICard
          label="Resumes Uploaded"
          value={kpis.resumesUploaded}
          delta={kpis.resumesDelta}
          icon={Upload}
          iconBg="bg-violet-50"
          iconColor="text-violet-600"
          suffix=" vs last 30d"
        />
        <KPICard
          label="Interviews Completed"
          value={kpis.interviewsCompleted}
          delta={kpis.interviewsDelta}
          icon={CheckCircle}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          suffix=" vs last 30d"
        />
        <KPICard
          label="Recommended"
          value={kpis.recommended}
          delta={kpis.recommendedDelta}
          icon={Star}
          iconBg="bg-amber-50"
          iconColor="text-amber-500"
        />
      </div>

      {/* Pipeline Snapshot */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-bold text-slate-900">Pipeline Snapshot</h2>
            <p className="text-xs text-slate-400 mt-0.5">All candidates across all jobs</p>
          </div>
          <Link href="/pipeline" className="text-xs text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-1">
            View pipeline <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={pipeline} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ fill: "rgba(99,102,241,0.06)" }}
              contentStyle={{
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
                fontSize: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
              formatter={(value) => [value ?? 0, "Candidates"]}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={56}>
              {pipeline.map((_, i) => (
                <Cell key={i} fill={PIPELINE_COLORS[i % PIPELINE_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Active Jobs + Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">

        {/* Active Jobs */}
        <div className="xl:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900">Active Jobs</h2>
            <Link href="/jobs" className="text-xs text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-1">
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          {jobs.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-400">No jobs yet. Create one to get started.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {jobs.slice(0, 5).map((job) => (
                <Link
                  key={job.id}
                  href={`/pipeline?job=${job.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{job.title}</p>
                    <p className="text-xs text-slate-500">{job.department ?? "—"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Users className="w-3 h-3" /> {job.applicantCount}
                    </span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_COLOR[job.status] ?? "bg-slate-100 text-slate-500"}`}>
                      {job.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900">Recent Activity</h2>
          </div>
          {activity.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-400">No activity yet.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {activity.slice(0, 5).map((a) => {
                const ev = EVENT_LABELS[a.eventType] ?? { label: a.eventType, color: "bg-slate-100 text-slate-600" };
                return (
                  <div key={a.id} className="px-5 py-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${ev.color}`}>
                        {ev.label}
                      </span>
                      <span className="text-[11px] text-slate-400 shrink-0 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {timeAgo(a.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-900 mt-1.5">{a.candidateName}</p>
                    <p className="text-xs text-slate-500">{a.jobTitle}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Create Job", icon: Briefcase, href: "/jobs" },
          { label: "Upload Resumes", icon: Upload, href: "/upload" },
          { label: "View Candidates", icon: Users, href: "/pipeline" },
          { label: "Analytics", icon: BarChart2, href: "/analytics" },
        ].map(({ label, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center gap-2 shadow-sm hover:-translate-y-1 hover:border-indigo-200 hover:shadow-md transition-all duration-200"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Icon className="w-5 h-5 text-indigo-600" />
            </div>
            <span className="text-xs font-semibold text-slate-700">{label}</span>
          </Link>
        ))}
      </div>

      {/* Quick Actions — Reports row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          href="/analytics"
          className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl p-4 flex items-center gap-4 shadow-sm hover:-translate-y-0.5 transition-all duration-200"
        >
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <BarChart2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">View Analytics</p>
            <p className="text-xs text-indigo-200 mt-0.5">Hiring metrics, trends, and performance insights</p>
          </div>
          <ArrowUpRight className="w-4 h-4 text-white/60 ml-auto shrink-0" />
        </Link>
        <Link
          href="/audit"
          className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 shadow-sm hover:-translate-y-0.5 hover:border-indigo-200 transition-all duration-200"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
            <BarChart2 className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">AI Transparency Audit</p>
            <p className="text-xs text-slate-500 mt-0.5">Review AI decisions and override history</p>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400 ml-auto shrink-0" />
        </Link>
      </div>

    </main>
  );
}
