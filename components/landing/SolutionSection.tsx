import { CheckCircle } from "lucide-react";

const points = [
  "Upload 50 resumes at once — parsed, scored, and profiled in minutes",
  "Carl interviews every candidate — adaptively, fairly, and at any scale",
  "AI-generated candidate intelligence reports — ready before your next meeting",
  "Full team collaboration — from first screen to final hire",
  "Built-in fairness and transparency — every decision is explainable",
];

export default function SolutionSection() {
  return (
    <section className="py-20 lg:py-28 bg-white" id="product">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-14 lg:gap-20">

          {/* Left: copy */}
          <div className="flex-1 max-w-xl">
            <span className="inline-block text-indigo-600 text-xs font-bold tracking-widest uppercase mb-4 bg-indigo-50 px-4 py-1.5 rounded-full">
              The Hiventra Way
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-5">
              One Platform.{" "}
              <span className="gradient-text">Every Step of Hiring.</span>{" "}
              Handled Intelligently.
            </h2>
            <p className="text-slate-500 text-lg leading-relaxed mb-8">
              Hiventra brings AI intelligence to every layer of your talent acquisition process.
              From the moment a resume is uploaded to the moment a hire is made —
              Hiventra automates the work, surfaces the insights, and keeps your team aligned.
              <br /><br />
              No more manual screening. No more scheduling chaos. No more gut-feel decisions.
              Just clean, fast, intelligent hiring — powered by <span className="text-indigo-600 font-semibold">Carl</span>, your AI interviewer.
            </p>

            <ul className="space-y-3 mb-8">
              {points.map((pt) => (
                <li key={pt} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
                  <span className="text-slate-700 text-sm leading-relaxed">{pt}</span>
                </li>
              ))}
            </ul>

            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold px-7 py-3.5 rounded-full shadow-btn hover:-translate-y-0.5 transition-all duration-200"
            >
              See How It Works →
            </a>
          </div>

          {/* Right: dashboard mockup */}
          <div className="flex-1 w-full max-w-lg">
            <div
              className="relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl"
              style={{ transform: "perspective(1600px) rotateY(-6deg) rotateX(2deg)" }}
            >
              {/* Top bar */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700/80 bg-slate-800/60">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
                    <span className="text-white text-[9px] font-bold">H</span>
                  </div>
                  <span className="text-white text-xs font-semibold">Candidate Pipeline</span>
                </div>
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-slate-600" />
                  <div className="w-2 h-2 rounded-full bg-slate-600" />
                  <div className="w-2 h-2 rounded-full bg-slate-600" />
                </div>
              </div>

              {/* Content */}
              <div className="p-5 space-y-3">
                {[
                  { name: "Maria Santos", role: "Backend Engineer", score: 92, stage: "Recommended", stageColor: "bg-emerald-500/20 text-emerald-400" },
                  { name: "Alex Kim", role: "Full Stack Dev", score: 78, stage: "Completed", stageColor: "bg-indigo-500/20 text-indigo-400" },
                  { name: "Jamie Torres", role: "DevOps Engineer", score: 85, stage: "Completed", stageColor: "bg-indigo-500/20 text-indigo-400" },
                  { name: "Priya Mehta", role: "Backend Engineer", score: 63, stage: "Screened", stageColor: "bg-amber-500/20 text-amber-400" },
                ].map((c) => (
                  <div key={c.name} className="flex items-center justify-between bg-slate-800/50 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center">
                        <span className="text-indigo-300 text-xs font-bold">{c.name.split(" ").map(n => n[0]).join("")}</span>
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{c.name}</p>
                        <p className="text-slate-400 text-xs">{c.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${c.score >= 80 ? "bg-emerald-500/20 text-emerald-400" : c.score >= 65 ? "bg-amber-500/20 text-amber-400" : "bg-rose-500/20 text-rose-400"}`}>
                        {c.score}/100
                      </span>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${c.stageColor}`}>
                        {c.stage}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Bottom action */}
                <div className="pt-1">
                  <div className="bg-gradient-to-r from-indigo-600/20 to-violet-600/20 border border-indigo-500/20 rounded-xl px-4 py-3 flex items-center justify-between">
                    <span className="text-indigo-300 text-xs font-medium">Carl has completed 4 interviews today</span>
                    <span className="text-indigo-400 text-xs">View Reports →</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
