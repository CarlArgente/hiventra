import PlaceholderPage from "@/components/dashboard/PlaceholderPage";
import { MessageSquare } from "lucide-react";

export default function CandidateInterviewPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-5">
          <MessageSquare className="w-7 h-7 text-indigo-600" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 mb-2">Interview Room</h2>
        <p className="text-slate-500 text-sm leading-relaxed">
          The live interview experience with Carl. Answer questions at your own pace — Carl adapts dynamically based on your responses.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-full px-4 py-2">
          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
          <span className="text-xs font-semibold text-indigo-600">Coming soon</span>
        </div>
      </div>
    </div>
  );
}
