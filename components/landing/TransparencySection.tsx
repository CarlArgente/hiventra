import { FileText, History, ShieldCheck, UserCheck, Search } from "lucide-react";

const trustPoints = [
  {
    icon: FileText,
    title: "Scoring Explanations",
    body: "Every AI score includes plain-English rationale — not a black-box number. HR teams and candidates can see exactly why a score was generated.",
  },
  {
    icon: History,
    title: "Full Audit Trail",
    body: "Immutable, timestamped logs of every AI decision, human override, and approval action — exportable for compliance review at any time.",
  },
  {
    icon: ShieldCheck,
    title: "Fairness Monitoring",
    body: "Hiventra monitors AI scoring patterns for statistical anomalies. No demographic data is used in scoring — ever.",
  },
  {
    icon: UserCheck,
    title: "Human-in-the-Loop by Design",
    body: "AI recommendations inform. Humans decide. Every hire requires explicit human approval — Carl never hires alone.",
  },
  {
    icon: Search,
    title: "Decision Transparency",
    body: "Every candidate report links the recommendation back to specific resume data points and interview answers. No mysteries.",
  },
];

const badges = ["SOC 2 Type II", "GDPR Compliant", "CCPA Compliant", "AES-256 Encrypted"];

export default function TransparencySection() {
  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-14 lg:gap-20">

          {/* Left: copy */}
          <div className="flex-1 max-w-xl">
            <span className="inline-block text-emerald-600 text-xs font-bold tracking-widest uppercase mb-4 bg-emerald-50 px-4 py-1.5 rounded-full">
              Responsible AI
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-5">
              AI That Explains Itself.{" "}
              <span className="text-emerald-600">Hiring You Can Defend.</span>
            </h2>
            <p className="text-slate-500 text-lg leading-relaxed mb-8">
              Hiventra is built on the principle that AI-driven hiring must be transparent,
              auditable, and demonstrably fair. Every score comes with a reason.
              Every decision leaves a record. Your legal team will sleep soundly.
            </p>

            <ul className="space-y-5 mb-8">
              {trustPoints.map((tp) => {
                const Icon = tp.icon;
                return (
                  <li key={tp.title} className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-slate-900 font-semibold text-sm mb-0.5">{tp.title}</p>
                      <p className="text-slate-500 text-sm leading-relaxed">{tp.body}</p>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-2">
              {badges.map((b) => (
                <span key={b} className="bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold px-3 py-1.5 rounded-full">
                  🔒 {b}
                </span>
              ))}
            </div>
          </div>

          {/* Right: audit log mock */}
          <div className="flex-1 w-full max-w-lg">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden">
              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-slate-900 font-bold text-sm">AI Audit Log</p>
                  <p className="text-slate-400 text-xs mt-0.5">All AI decisions — immutable record</p>
                </div>
                <span className="bg-amber-50 text-amber-600 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-200">Admin Only</span>
              </div>

              {/* Log entries */}
              <div className="divide-y divide-slate-50">
                {[
                  { name: "Maria Santos", action: "AI Scored", score: 92, rec: "Strongly Recommend", override: false, time: "2m ago" },
                  { name: "Alex Kim", action: "AI Scored", score: 78, rec: "Recommend", override: true, time: "15m ago" },
                  { name: "Jamie Torres", action: "Interview Complete", score: 85, rec: "Recommend", override: false, time: "1h ago" },
                  { name: "Priya Mehta", action: "AI Scored", score: 63, rec: "Review Further", override: false, time: "3h ago" },
                ].map((entry) => (
                  <div key={entry.name} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-indigo-600 text-[10px] font-bold">{entry.name.split(" ").map(n => n[0]).join("")}</span>
                      </div>
                      <div>
                        <p className="text-slate-800 text-xs font-semibold">{entry.name}</p>
                        <p className="text-slate-400 text-[10px]">{entry.action}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${entry.score >= 80 ? "bg-emerald-50 text-emerald-600" : entry.score >= 65 ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"}`}>
                        {entry.score}
                      </span>
                      {entry.override ? (
                        <span className="text-[10px] font-bold bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full">Override</span>
                      ) : (
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">Followed AI</span>
                      )}
                      <span className="text-slate-300 text-[10px]">{entry.time}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-slate-400 text-xs flex items-center gap-1.5">
                  <span>🔒</span> Immutable Record
                </span>
                <button className="text-indigo-600 text-xs font-semibold hover:underline">Export CSV</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
