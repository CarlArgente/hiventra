import { CheckCircle, Clock, Circle, Bot, Calendar, FileText, ChevronRight } from "lucide-react";

const stages = [
  { label: "Applied", status: "done" },
  { label: "Resume Reviewed", status: "done" },
  { label: "Interview", status: "current" },
  { label: "Decision", status: "upcoming" },
];

export default function PortalHomePage() {
  return (
    <div className="space-y-5">
      {/* Welcome */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h1 className="text-2xl font-extrabold text-slate-900">Welcome back, Candidate</h1>
        <p className="text-slate-500 mt-1 text-sm">Senior Backend Engineer at Hiventra</p>
        <p className="text-slate-400 text-xs mt-2">Your application is being reviewed by our team.</p>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="font-bold text-slate-900 mb-5">Application Progress</h2>
        <div className="flex items-center gap-0">
          {stages.map((stage, i) => (
            <div key={stage.label} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  stage.status === "done" ? "bg-emerald-500" :
                  stage.status === "current" ? "bg-indigo-600" : "bg-slate-200"
                }`}>
                  {stage.status === "done" ? (
                    <CheckCircle className="w-4 h-4 text-white" />
                  ) : stage.status === "current" ? (
                    <Clock className="w-4 h-4 text-white" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <span className={`text-[11px] font-medium whitespace-nowrap ${
                  stage.status === "current" ? "text-indigo-600" :
                  stage.status === "done" ? "text-emerald-600" : "text-slate-400"
                }`}>
                  {stage.label}
                </span>
              </div>
              {i < stages.length - 1 && (
                <div className={`h-0.5 flex-1 mx-1 mb-5 ${stage.status === "done" ? "bg-emerald-300" : "bg-slate-200"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Interview Card */}
      <div className="bg-white rounded-xl border border-indigo-200 shadow-sm p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-slate-900">Your Interview with Carl</p>
              <p className="text-xs text-slate-500">Text Interview · ~30 minutes · 10 questions</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 mb-5">Your interview is ready. Take it at your own pace — Carl will guide you through each question.</p>
          <a
            href="/portal/interview"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold px-6 py-3 rounded-full shadow-lg hover:-translate-y-0.5 transition-all duration-200 text-sm"
          >
            Start Interview with Carl <ChevronRight className="w-4 h-4" />
          </a>
          <p className="text-xs text-slate-400 mt-3">Interview link expires in 7 days</p>
        </div>
      </div>

      {/* Schedule & Documents */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <h3 className="font-bold text-slate-900 text-sm">Interview Window</h3>
          </div>
          <p className="text-sm text-slate-600">Available May 22 – June 1, 2026</p>
          <p className="text-xs text-slate-400 mt-3">Complete your interview within this window.</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-indigo-500" />
            <h3 className="font-bold text-slate-900 text-sm">Documents</h3>
          </div>
          <p className="text-sm text-slate-500">No documents uploaded yet.</p>
          <button className="mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
            + Upload portfolio or certifications
          </button>
        </div>
      </div>
    </div>
  );
}
