import { CheckCircle } from "lucide-react";

const portalFeatures = [
  "Personal portal with real-time application status",
  "Clear progress tracker — from Applied to Decision",
  "Interview with Carl at their own pace — no scheduling required",
  "Text, voice, or video interview — candidates choose their comfort zone",
  "Document upload for portfolio, certifications, and cover letters",
  "Clean, mobile-first experience — accessible from any device",
];

export default function CandidateSection() {
  return (
    <section className="py-20 lg:py-28 bg-slate-900 relative overflow-hidden" id="candidates">
      {/* Background orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-14 lg:gap-20">

          {/* Left: copy */}
          <div className="flex-1 max-w-xl">
            <span className="inline-block text-indigo-400 text-xs font-bold tracking-widest uppercase mb-4">
              The Candidate Side
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-[1.1] tracking-tight mb-5">
              Your Candidates Deserve{" "}
              <span className="gradient-text">a Great Experience Too.</span>
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed mb-8">
              Hiventra gives every candidate their own professional portal —
              with clear communication, structured interviews, and the confidence
              that their application is being taken seriously.
            </p>

            <ul className="space-y-3 mb-8">
              {portalFeatures.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-slate-300 text-sm leading-relaxed">{f}</span>
                </li>
              ))}
            </ul>

            {/* Candidate quote */}
            <div className="bg-slate-800/60 border border-indigo-500/20 rounded-2xl p-6">
              <p className="text-slate-300 text-base italic leading-relaxed mb-4">
                "I've done 12 job applications this year. The Hiventra interview was the only one that
                actually felt like someone — or something — was paying attention to me."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-600/30 flex items-center justify-center">
                  <span className="text-indigo-300 text-sm font-bold">MS</span>
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">Maria Santos</p>
                  <p className="text-slate-400 text-xs">Candidate · Backend Engineering Role</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: candidate portal mockup (phone) */}
          <div className="flex-1 flex justify-center">
            <div className="relative">
              {/* Phone frame */}
              <div className="w-64 bg-slate-800 rounded-[2rem] border-4 border-slate-700 overflow-hidden shadow-2xl">
                {/* Status bar */}
                <div className="bg-slate-900 px-4 py-2 flex items-center justify-between">
                  <span className="text-white text-[10px] font-medium">9:41</span>
                  <div className="flex gap-1">
                    <div className="w-3 h-1.5 bg-white/60 rounded-sm" />
                    <div className="w-1 h-1.5 bg-white/40 rounded-sm" />
                  </div>
                </div>

                {/* App content */}
                <div className="bg-white min-h-[480px] p-4">
                  {/* Welcome */}
                  <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl p-3 mb-3 border border-indigo-100">
                    <p className="text-slate-400 text-[9px] mb-1">Welcome back</p>
                    <p className="text-slate-900 text-sm font-bold">Maria Santos</p>
                    <p className="text-slate-500 text-[10px]">Backend Engineer · TechNova Inc.</p>
                  </div>

                  {/* Progress */}
                  <div className="mb-3">
                    <p className="text-slate-500 text-[9px] font-semibold uppercase mb-2">Application Progress</p>
                    <div className="flex gap-1">
                      {["Applied", "Reviewed", "Interview", "Decision"].map((s, i) => (
                        <div key={s} className="flex-1 text-center">
                          <div className={`w-5 h-5 rounded-full mx-auto mb-1 flex items-center justify-center ${i < 2 ? "bg-emerald-500" : i === 2 ? "bg-indigo-600 ring-2 ring-indigo-200" : "bg-slate-200"}`}>
                            {i < 2 && <span className="text-white text-[8px]">✓</span>}
                          </div>
                          <p className={`text-[7px] ${i === 2 ? "text-indigo-600 font-bold" : "text-slate-400"}`}>{s}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Interview card */}
                  <div className="bg-indigo-600 rounded-xl p-3 mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold">C</span>
                      </div>
                      <div>
                        <p className="text-white text-[10px] font-bold">Your Interview with Carl</p>
                        <p className="text-indigo-200 text-[9px]">💬 Text · ~30 min</p>
                      </div>
                    </div>
                    <div className="w-full h-1 bg-white/20 rounded-full mb-1.5">
                      <div className="h-full bg-white rounded-full" style={{ width: "40%" }} />
                    </div>
                    <p className="text-indigo-100 text-[9px] mb-2">4 of 10 questions completed</p>
                    <button className="w-full bg-white text-indigo-600 text-[10px] font-bold py-1.5 rounded-lg">
                      Continue Interview
                    </button>
                  </div>

                  {/* Documents */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-slate-500 text-[9px] font-semibold uppercase mb-2">Documents</p>
                    <div className="space-y-1.5">
                      {["resume_maria.pdf", "portfolio.pdf"].map((f) => (
                        <div key={f} className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-red-100 rounded flex items-center justify-center">
                            <span className="text-red-500 text-[7px] font-bold">PDF</span>
                          </div>
                          <span className="text-slate-600 text-[9px]">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative glow */}
              <div className="absolute inset-0 rounded-[2rem] bg-indigo-600/10 blur-2xl -z-10" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
