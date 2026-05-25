import Topbar from "@/components/dashboard/Topbar";

export default function JobsLoading() {
  return (
    <>
      <Topbar title="Job Management" subtitle="Create, manage, and track all job postings" />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
          <div className="h-9 w-36 bg-slate-200 rounded-lg animate-pulse" />
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
            <div className="h-9 w-48 bg-slate-100 rounded-lg animate-pulse" />
            <div className="flex gap-1 flex-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-7 w-14 bg-slate-100 rounded-lg animate-pulse" />
              ))}
            </div>
            <div className="h-9 w-32 bg-slate-100 rounded-lg animate-pulse" />
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                {["", "Job", "Type", "Location", "Created", "Applicants", "Status", ""].map((h, i) => (
                  <th key={i} className="px-4 py-3 text-left">
                    <div className="h-3 w-14 bg-slate-200 rounded animate-pulse" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-3.5 w-10"><div className="h-4 w-4 bg-slate-100 rounded animate-pulse" /></td>
                  <td className="px-4 py-3.5">
                    <div className="h-4 w-40 bg-slate-200 rounded animate-pulse mb-1.5" />
                    <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
                  </td>
                  <td className="px-4 py-3.5"><div className="h-6 w-20 bg-slate-100 rounded-full animate-pulse" /></td>
                  <td className="px-4 py-3.5"><div className="h-4 w-28 bg-slate-100 rounded animate-pulse" /></td>
                  <td className="px-4 py-3.5"><div className="h-4 w-20 bg-slate-100 rounded animate-pulse" /></td>
                  <td className="px-4 py-3.5"><div className="h-4 w-8 bg-slate-100 rounded animate-pulse" /></td>
                  <td className="px-4 py-3.5"><div className="h-6 w-16 bg-slate-100 rounded-full animate-pulse" /></td>
                  <td className="px-4 py-3.5 w-12" />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
