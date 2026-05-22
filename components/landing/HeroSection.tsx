"use client";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen bg-slate-900 overflow-hidden flex items-center">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "4000ms" }} />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "6000ms", animationDelay: "1000ms" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-900/30 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 w-full">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

          {/* Left: copy */}
          <div className="flex-1 text-center lg:text-left max-w-2xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-indigo-600/20 border border-indigo-500/30 rounded-full px-4 py-1.5 mb-6">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
              <span className="text-indigo-300 text-xs font-semibold tracking-wide uppercase">AI Talent Intelligence Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight mb-6">
              Hire Smarter.<br />
              Interview at Scale.<br />
              <span className="gradient-text">Let Carl Handle It.</span>
            </h1>

            <p className="text-slate-400 text-lg lg:text-xl leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
              Hiventra is the AI Talent Intelligence Platform that automates resume screening,
              conducts adaptive AI interviews, and delivers deep candidate intelligence —
              so your team spends time on decisions, not administration.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-6">
              <a
                href="/signin"
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold px-8 py-4 rounded-full shadow-btn hover:-translate-y-0.5 transition-all duration-200 text-base"
              >
                Start Free Trial →
              </a>
              <a
                href="#"
                className="flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white font-semibold px-8 py-4 rounded-full hover:bg-white/15 transition-all duration-200 text-base"
              >
                <span className="text-indigo-300">▶</span> Watch Demo
              </a>
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap gap-x-5 gap-y-2 justify-center lg:justify-start text-sm text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="text-emerald-400">✓</span> No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-emerald-400">✓</span> Up to 50 resumes per upload
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-emerald-400">✓</span> Carl ready in minutes
              </span>
            </div>
          </div>

          {/* Right: product UI mockup (desktop only) */}
          <div className="flex-1 hidden lg:flex items-center justify-center">
            <div className="relative" style={{ width: "520px", height: "440px" }}>

              {/* Ambient glow */}
              <div className="absolute inset-12 bg-indigo-600/8 rounded-3xl blur-3xl pointer-events-none" />

              {/* Status pill — top-right gutter (above the card) */}
              <div className="absolute right-6 top-0 z-20 animate-float" style={{ animationDelay: "0.8s" }}>
                <div className="bg-slate-800/95 border border-indigo-500/30 rounded-full px-3.5 py-1.5 flex items-center gap-2 shadow-lg">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-slate-200 text-[11px] font-medium">3 interviews live right now</span>
                </div>
              </div>

              {/* Main dashboard card */}
              <div
                className="absolute inset-x-0 top-9 bottom-9 bg-slate-800/95 border border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl"
                style={{ transform: "perspective(1600px) rotateX(4deg) rotateY(-6deg)" }}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700/70 bg-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold">H</span>
                    </div>
                    <span className="text-white text-sm font-semibold">HR Dashboard</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-emerald-400 text-[10px] font-medium">Live</span>
                  </div>
                </div>

                {/* KPI row */}
                <div className="grid grid-cols-3 divide-x divide-slate-700/50 border-b border-slate-700/70">
                  {[
                    { v: "12", l: "Active Jobs" },
                    { v: "48", l: "Interviews" },
                    { v: "7",  l: "Hired" },
                  ].map((k) => (
                    <div key={k.l} className="py-4 text-center">
                      <div className="text-indigo-400 font-bold text-xl">{k.v}</div>
                      <div className="text-slate-500 text-[10px] mt-0.5">{k.l}</div>
                    </div>
                  ))}
                </div>

                {/* Carl interviewing banner */}
                <div className="mx-4 mt-4 mb-3 bg-indigo-600/10 border border-indigo-500/20 rounded-xl p-3 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shrink-0">
                    <span className="text-white text-[10px] font-bold">C</span>
                  </div>
                  <div>
                    <div className="text-indigo-300 text-[9px] font-bold uppercase tracking-widest mb-1">
                      Carl AI · Interviewing Alex Kim
                    </div>
                    <div className="text-white text-[11px] italic leading-snug">
                      &ldquo;Walk me through resolving a critical production incident.&rdquo;
                    </div>
                  </div>
                </div>

                {/* Candidate list */}
                <div className="px-4 space-y-1.5">
                  {[
                    { name: "Maria Santos", role: "Backend Engineer", score: 92, tag: "Recommended", color: "emerald" },
                    { name: "Alex Kim",      role: "Full Stack Dev",   score: 78, tag: "Interviewing", color: "indigo"  },
                    { name: "Jamie Torres",  role: "DevOps Engineer",  score: 85, tag: "Completed",    color: "indigo"  },
                  ].map((c) => (
                    <div key={c.name} className="flex items-center justify-between bg-slate-700/40 rounded-xl px-3 py-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-indigo-600/25 flex items-center justify-center shrink-0">
                          <span className="text-indigo-300 text-[9px] font-bold">
                            {c.name.split(" ").map((n) => n[0]).join("")}
                          </span>
                        </div>
                        <div>
                          <div className="text-white text-[11px] font-medium">{c.name}</div>
                          <div className="text-slate-500 text-[9px]">{c.role}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.score >= 85 ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
                          {c.score}
                        </span>
                        <span className={`text-[9px] font-medium px-2 py-0.5 rounded-full ${
                          c.color === "emerald"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-indigo-500/15 text-indigo-400"
                        }`}>
                          {c.tag}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status pill — bottom-left gutter (below the card) */}
              <div className="absolute left-6 bottom-0 z-20 animate-float" style={{ animationDelay: "1.8s" }}>
                <div className="bg-white rounded-full px-3.5 py-1.5 flex items-center gap-2 shadow-hover border border-slate-100">
                  <span className="text-emerald-500 text-xs font-bold">✓</span>
                  <span className="text-slate-700 text-[11px] font-medium">AI Report Ready · Maria Santos</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
