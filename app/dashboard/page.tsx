import Topbar from "@/components/dashboard/Topbar";
import { Briefcase, Upload, Users, TrendingUp, ArrowUpRight, Clock, CheckCircle, Star } from "lucide-react";

const kpis = [
  { label: "Active Jobs", value: "12", trend: "+2", up: true, icon: Briefcase, color: "indigo" },
  { label: "Resumes Uploaded", value: "248", trend: "+34", up: true, icon: Upload, color: "violet" },
  { label: "Interviews Completed", value: "91", trend: "+18", up: true, icon: CheckCircle, color: "emerald" },
  { label: "Recommended", value: "37", trend: "+5", up: true, icon: Star, color: "amber" },
];

const recentJobs = [
  { title: "Senior Backend Engineer", dept: "Engineering", count: 48, status: "Active" },
  { title: "Product Manager", dept: "Product", count: 32, status: "Active" },
  { title: "UX Designer", dept: "Design", count: 19, status: "Draft" },
  { title: "Sales Lead", dept: "Sales", count: 27, status: "Active" },
];

const activity = [
  { action: "Interview completed", detail: "Maria Santos — Backend Engineer", time: "2m ago" },
  { action: "Resume uploaded", detail: "12 resumes for Sales Lead", time: "18m ago" },
  { action: "Report ready", detail: "Alex Kim — Intelligence Report", time: "1h ago" },
  { action: "Candidate hired", detail: "Jamie Torres — DevOps Engineer", time: "3h ago" },
];

const pipelineStages = [
  { label: "Uploaded", count: 248 },
  { label: "Screened", count: 201 },
  { label: "Invited", count: 134 },
  { label: "Started", count: 107 },
  { label: "Completed", count: 91 },
  { label: "Recommended", count: 37 },
  { label: "Hired", count: 11 },
];

const statusColor: Record<string, string> = {
  Active: "bg-emerald-100 text-emerald-700",
  Draft: "bg-amber-100 text-amber-700",
  Closed: "bg-slate-100 text-slate-500",
};

export default function DashboardPage() {
  return (
    <>
      <Topbar title="HR Dashboard" subtitle="Welcome back, Carl" />
      <main className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {kpis.map((k) => {
            const Icon = k.icon;
            return (
              <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-indigo-600" />
                  </div>
                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                    <TrendingUp className="w-3 h-3" /> {k.trend}
                  </span>
                </div>
                <div className="text-3xl font-extrabold text-slate-900">{k.value}</div>
                <div className="text-sm text-slate-500 mt-0.5">{k.label}</div>
              </div>
            );
          })}
        </div>

        {/* Two-column content */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
          {/* Active Jobs */}
          <div className="xl:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">Active Jobs</h2>
              <a href="/dashboard/jobs" className="text-xs text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-1">
                View all <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
            <div className="divide-y divide-slate-100">
              {recentJobs.map((job) => (
                <div key={job.title} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{job.title}</p>
                    <p className="text-xs text-slate-500">{job.dept}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Users className="w-3 h-3" /> {job.count}
                    </span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor[job.status]}`}>
                      {job.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">Recent Activity</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {activity.map((a, i) => (
                <div key={i} className="px-5 py-3.5">
                  <p className="text-sm font-medium text-slate-900">{a.action}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{a.detail}</p>
                  <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {a.time}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pipeline Snapshot */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="font-bold text-slate-900 mb-4">Pipeline Snapshot</h2>
          <div className="flex items-end gap-2 overflow-x-auto pb-1">
            {pipelineStages.map((stage, i) => {
              const pct = Math.round((stage.count / 248) * 100);
              return (
                <div key={stage.label} className="flex flex-col items-center gap-2 min-w-[72px]">
                  <span className="text-sm font-bold text-slate-900">{stage.count}</span>
                  <div className="w-full rounded-t-lg" style={{ height: `${Math.max(pct * 1.2, 8)}px`, background: `rgba(79,70,229,${1 - i * 0.12})` }} />
                  <span className="text-[10px] text-slate-500 text-center leading-tight">{stage.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Create Job", icon: Briefcase, href: "/dashboard/jobs/new" },
            { label: "Upload Resumes", icon: Upload, href: "/dashboard/upload" },
            { label: "View Candidates", icon: Users, href: "/dashboard/pipeline" },
            { label: "Analytics", icon: TrendingUp, href: "/dashboard/analytics" },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <a
                key={action.label}
                href={action.href}
                className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center gap-2 shadow-sm hover:-translate-y-1 hover:border-indigo-200 hover:shadow-md transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-indigo-600" />
                </div>
                <span className="text-xs font-semibold text-slate-700">{action.label}</span>
              </a>
            );
          })}
        </div>
      </main>
    </>
  );
}
