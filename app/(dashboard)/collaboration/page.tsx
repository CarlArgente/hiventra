import Link from "next/link";
import { getJobsForCollaboration } from "@/app/actions/collaboration";
import {
  Users2,
  ArrowRight,
  Briefcase,
  Archive,
  Layers,
  Building2,
} from "lucide-react";

const DEPT_PALETTE: Record<string, { bg: string; icon: string; bar: string }> = {
  Engineering: { bg: "bg-indigo-50", icon: "text-indigo-500", bar: "from-indigo-500 to-violet-500" },
  Operations:  { bg: "bg-emerald-50", icon: "text-emerald-500", bar: "from-emerald-400 to-teal-500" },
  Finance:     { bg: "bg-amber-50",   icon: "text-amber-500",   bar: "from-amber-400 to-orange-400" },
  Marketing:   { bg: "bg-pink-50",    icon: "text-pink-500",    bar: "from-pink-400 to-rose-500" },
  Sales:       { bg: "bg-cyan-50",    icon: "text-cyan-500",    bar: "from-cyan-400 to-sky-500" },
  HR:          { bg: "bg-violet-50",  icon: "text-violet-500",  bar: "from-violet-400 to-purple-500" },
};

function deptStyle(dept: string | null) {
  if (dept) {
    for (const [key, val] of Object.entries(DEPT_PALETTE)) {
      if (dept.toLowerCase().includes(key.toLowerCase())) return val;
    }
  }
  return { bg: "bg-slate-50", icon: "text-slate-400", bar: "from-indigo-500 to-violet-500" };
}

export default async function CollaborationIndexPage() {
  const jobs = await getJobsForCollaboration();

  const activeJobs = jobs.filter((j) => j.status === "active");
  const inactiveJobs = jobs.filter((j) => j.status !== "active");

  return (
    <div className="flex flex-col min-h-full">
      {/* Hero header */}
      <div className="bg-white border-b border-slate-100 px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
              <Users2 className="w-3.5 h-3.5" />
              Collaboration Hub
            </div>
            <h1 className="text-2xl font-black text-slate-900 leading-tight">Team Workspaces</h1>
            <p className="text-slate-500 mt-1.5 text-sm max-w-md">
              Open a workspace to review candidates, run approvals, and align your hiring team.
            </p>
          </div>
          {/* Stats */}
          <div className="flex items-stretch gap-3 shrink-0">
            <div className="flex flex-col items-center justify-center bg-indigo-50 rounded-2xl px-5 py-3 min-w-[72px]">
              <span className="text-2xl font-black text-indigo-600 tabular-nums">{activeJobs.length}</span>
              <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider mt-0.5">Active</span>
            </div>
            <div className="flex flex-col items-center justify-center bg-slate-50 rounded-2xl px-5 py-3 min-w-[72px]">
              <span className="text-2xl font-black text-slate-700 tabular-nums">{jobs.length}</span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">Total</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto bg-brand-bg p-4 sm:p-6">
        <div className="space-y-10">

          {jobs.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 px-6 py-16 text-center shadow-soft">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
                <Layers className="w-5 h-5 text-slate-300" />
              </div>
              <p className="text-slate-400 text-sm font-medium">No jobs found.</p>
              <p className="text-slate-300 text-xs mt-1">Create a job first to open a workspace.</p>
            </div>
          )}

          {/* Active jobs */}
          {activeJobs.length > 0 && (
            <section>
              <div className="flex items-center gap-2.5 mb-5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Jobs</p>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5">
                  {activeJobs.length}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {activeJobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            </section>
          )}

          {/* Archived jobs */}
          {inactiveJobs.length > 0 && (
            <section>
              <div className="flex items-center gap-2.5 mb-5">
                <Archive className="w-3.5 h-3.5 text-slate-400" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Archived / Inactive</p>
                <span className="text-xs font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded-full px-2.5 py-0.5">
                  {inactiveJobs.length}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-65">
                {inactiveJobs.map((job) => (
                  <JobCard key={job.id} job={job} inactive />
                ))}
              </div>
            </section>
          )}

        </div>
      </main>
    </div>
  );
}

function JobCard({
  job,
  inactive = false,
}: {
  job: { id: string; title: string; company: string; department: string | null; status: string };
  inactive?: boolean;
}) {
  const palette = deptStyle(job.department);

  return (
    <Link
      href={`/collaboration/${job.id}`}
      className="group relative block bg-white rounded-2xl border border-slate-100 hover:border-indigo-200 shadow-soft hover:shadow-lg transition-all duration-200 overflow-hidden"
    >
      {/* Gradient top bar */}
      <div
        className={`h-1 bg-gradient-to-r ${inactive ? "from-slate-200 to-slate-300" : palette.bar}`}
      />

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          {/* Icon */}
          <div className={`w-11 h-11 rounded-xl ${palette.bg} flex items-center justify-center shrink-0`}>
            <Briefcase className={`w-5 h-5 ${inactive ? "text-slate-400" : palette.icon}`} />
          </div>

          {/* Status badge */}
          {!inactive ? (
            <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Active
            </span>
          ) : (
            <span className="shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-400 capitalize">
              {job.status}
            </span>
          )}
        </div>

        {/* Title */}
        <p
          className={`font-bold text-base leading-snug mt-4 ${
            inactive ? "text-slate-500" : "text-slate-800 group-hover:text-indigo-700"
          } transition-colors`}
        >
          {job.title}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <div className="inline-flex items-center gap-1 text-xs text-slate-400">
            <Building2 className="w-3 h-3 shrink-0" />
            {job.company}
          </div>
          {job.department && (
            <>
              <span className="text-slate-200">·</span>
              <span className="text-xs font-medium text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full">
                {job.department}
              </span>
            </>
          )}
        </div>

        {/* Footer CTA */}
        <div className="mt-5 pt-4 border-t border-slate-50 flex items-center justify-end">
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-semibold transition-all ${
              inactive
                ? "text-slate-400"
                : "text-indigo-600 group-hover:text-indigo-800"
            }`}
          >
            Open workspace
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>
    </Link>
  );
}
