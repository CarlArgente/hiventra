import Link from "next/link";
import Topbar from "@/components/dashboard/Topbar";
import { getJobsForCollaboration } from "@/app/actions/collaboration";
import { Users2, ChevronRight, Briefcase } from "lucide-react";

export default async function CollaborationIndexPage() {
  const jobs = await getJobsForCollaboration();

  return (
    <>
      <Topbar
        title="Team Collaboration"
        subtitle="Select a job to open the collaboration workspace"
      />
      <main className="flex-1 overflow-y-auto bg-brand-bg p-4 sm:p-6">
        <div className="max-w-2xl">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
            Jobs
          </p>

          {jobs.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 px-6 py-12 text-center text-slate-400 text-sm shadow-soft">
              No jobs found. Create a job first.
            </div>
          )}

          <div className="flex flex-col gap-3">
            {jobs.map((job) => (
              <Link
                key={job.id}
                href={`/collaboration/${job.id}`}
                className="flex items-center justify-between bg-white rounded-2xl border border-slate-100 px-5 py-4 shadow-soft hover:border-indigo-200 hover:shadow-hover transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                    <Briefcase className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{job.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {job.company}
                      {job.department ? ` · ${job.department}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 hidden sm:block group-hover:text-indigo-500 transition-colors">
                    Open workspace
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
