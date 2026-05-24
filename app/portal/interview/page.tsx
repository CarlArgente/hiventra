import { getCandidateInterview } from "@/app/actions/interviews";
import InterviewRoom from "@/components/portal/InterviewRoom";

export default async function CandidateInterviewPage() {
  const interview = await getCandidateInterview();

  if (!interview || !interview.candidate || !interview.job) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-5 shadow-lg">
            <span className="text-white font-extrabold text-xl">C</span>
          </div>
          <p className="text-white text-lg font-bold mb-2">No interview assigned yet</p>
          <p className="text-slate-500 text-sm">Your recruiter will send you an invitation when it&apos;s ready.</p>
        </div>
      </div>
    );
  }

  return <InterviewRoom interview={interview} />;
}
