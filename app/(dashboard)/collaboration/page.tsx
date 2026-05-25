import Link from "next/link";
import Topbar from "@/components/dashboard/Topbar";
import { getJobsForCollaboration } from "@/app/actions/collaboration";
import { Users2, ChevronRight, Briefcase, Archive } from "lucide-react";

export default async function CollaborationIndexPage() {
  const jobs = await getJobsForCollaboration();

  const activeJobs = jobs.filter((j) => j.status === "active");
  const inactiveJobs = jobs.filter((j) => j.status !== "active");

  return (
    <>
      <Topbar
        title="Team Collaboration"
        subtitle="Select a job to open the collaboration workspace"
      />
      <main className="flex-1 overflow-y-auto bg-brand-bg p-4 sm:p-6">
        <div className="max-w-2xl space-y-8">

          {jobs.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 px-6 py-12 text-center text-slate-400 text-sm shadow-soft">
              No jobs found. Create a job first.
            </div>
          )}

          {/* Active jobs */}
          {activeJobs.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Active Jobs
                </p>
                <span className="ml-1 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">
                  {activeJobs.length}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {activeJobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            </section>
          )}

          {/* Inactive / archived jobs */}
          {inactiveJobs.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Archive className="w-3.5 h-3.5 text-slate-400" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Archived / Inactive
                </p>
                <span className="ml-1 text-xs font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded-full px-2 py-0.5">
                  {inactiveJobs.length}
                </span>
              </div>
              <div className="flex flex-col gap-3 opacity-70">
                {inactiveJobs.map((job) => (
                  <JobCard key={job.id} job={job} inactive />
                ))}
              </div>
            </section>
          )}

        </div>
      </main>
    </>
  );
}

function JobCard({
  job,
  inactive = false,
}: {
  job: { id: string; title: string; company: string; department: string | null; status: string };
  inactive?: boolean;
}) {
  return (
    <Link
      href={`/collaboration/${job.id}`}
      className={
        "flex items-center justify-between bg-white rounded-2xl border px-5 py-4 shadow-soft transition-all group " +
        (inactive
          ? "border-slate-100 hover:border-slate-200 hover:shadow-hover"
          : "border-slate-100 hover:border-indigo-200 hover:shadow-hover")
      }
    >
      <div className="flex items-center gap-4">
        <div
          className={
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 " +
            (inactive ? "bg-slate-50" : "bg-indigo-50")
          }
        >
          <Briefcase
            className={
              "w-5 h-5 " + (inactive ? "text-slate-400" : "text-indigo-500")
            }
          />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className={
              "font-bold " + (inactive ? "text-slate-500" : "text-slate-800")
            }>
              {job.title}
            </p>
            {!inactive && (
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-1.5 py-0.5 leading-none">
                Active
              </span>
            )}
            {inactive && (
              <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded-full px-1.5 py-0.5 leading-none capitalize">
                {job.status}
              </span>
            )}
          </div>
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
  );
}
