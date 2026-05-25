const kpis = [
  { value: "18 Days", label: "Average Time to Hire", trend: "↓ down from 36 days", good: true },
  { value: "89%", label: "AI Recommendation Accuracy", trend: "↑ +4% this quarter", good: true },
  { value: "76%", label: "Interview Completion Rate", trend: "↑ +12% vs last period", good: true },
  { value: "67%", label: "Top Skill Gap: Cloud Architecture", trend: "Most common missing skill", good: false, neutral: true },
];

const analyticsFeatures = [
  "Candidate Funnel Visualization — see where candidates drop off",
  "Time-to-Hire Trend Lines — track hiring velocity over time",
  "AI vs Human Score Alignment — understand where AI and teams diverge",
  "Resume Acceptance Rate — measure screening effectiveness",
  "Skill Gap Heatmap — know exactly what talent your market lacks",
  "Export as CSV or PDF — for executive reporting and board decks",
];

export default function AnalyticsSection() {
  return (
    <section className="py-20 lg:py-28 bg-slate-50" id="analytics">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-block text-indigo-600 text-xs font-bold tracking-widest uppercase mb-3 bg-indigo-50 px-4 py-1.5 rounded-full">
            Hiring Intelligence
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-4">
            Stop Guessing.{" "}
            <span className="gradient-text">Start Measuring.</span>
          </h2>
          <p className="text-slate-500 text-lg leading-relaxed">
            Hiventra's analytics dashboard gives HR leaders real-time visibility into hiring performance,
            pipeline health, and talent gaps — so every decision is backed by data, not instinct.
          </p>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-soft hover:shadow-hover hover:-translate-y-1 transition-all duration-200">
              <p className={`text-3xl font-extrabold mb-1 ${kpi.neutral ? "text-slate-700" : "gradient-text"}`}>
                {kpi.value}
              </p>
              <p className="text-slate-600 text-sm font-semibold mb-2">{kpi.label}</p>
              <p className={`text-xs font-medium ${kpi.good ? "text-emerald-600" : "text-amber-600"}`}>
                {kpi.trend}
              </p>
            </div>
          ))}
        </div>

        {/* Mock analytics dashboard */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden mb-10">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-slate-900 font-bold">Analytics Dashboard</p>
              <p className="text-slate-400 text-xs mt-0.5">Last 30 days · All Jobs</p>
            </div>
            <div className="flex gap-2">
              {["7d", "30d", "90d"].map((d, i) => (
                <button key={d} className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${i === 1 ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {/* Funnel */}
            <div className="mb-8">
              <p className="text-slate-700 font-semibold text-sm mb-4">Candidate Funnel</p>
              <div className="flex items-end gap-1 h-20">
                {[
                  { stage: "Uploaded", count: 500, pct: 100 },
                  { stage: "Screened", count: 420, pct: 84 },
                  { stage: "Invited", count: 310, pct: 62 },
                  { stage: "Started", count: 248, pct: 50 },
                  { stage: "Completed", count: 201, pct: 40 },
                  { stage: "Recommended", count: 87, pct: 17 },
                  { stage: "Hired", count: 24, pct: 5 },
                ].map((s, i, arr) => (
                  <div key={s.stage} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-slate-600 text-[9px] font-bold">{s.count}</span>
                    <div
                      className="w-full rounded-t-lg"
                      style={{
                        height: `${s.pct * 0.6}px`,
                        background: `rgba(79, 70, 229, ${0.3 + i * 0.1})`,
                      }}
                    />
                    <span className="text-slate-400 text-[9px] truncate w-full text-center hidden sm:block">{s.stage}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Skill gaps */}
            <div>
              <p className="text-slate-700 font-semibold text-sm mb-4">Top Skill Gaps</p>
              <div className="space-y-3">
                {[
                  { skill: "Cloud Architecture", pct: 67 },
                  { skill: "System Design", pct: 54 },
                  { skill: "Leadership Experience", pct: 49 },
                  { skill: "DevOps / CI/CD", pct: 41 },
                ].map((s, i) => (
                  <div key={s.skill} className="flex items-center gap-3">
                    <span className="text-slate-400 text-xs w-4">{i + 1}</span>
                    <span className="text-slate-700 text-sm w-40 shrink-0">{s.skill}</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                        style={{ width: `${s.pct}%` }}
                      />
                    </div>
                    <span className="text-slate-500 text-xs w-8 text-right">{s.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Features list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {analyticsFeatures.map((f) => (
            <div key={f} className="flex items-start gap-2.5 bg-white rounded-xl px-4 py-3 border border-slate-100">
              <span className="text-indigo-500 font-bold mt-0.5">→</span>
              <span className="text-slate-600 text-sm leading-relaxed">{f}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
