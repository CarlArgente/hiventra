"use client";

import { Brain, RefreshCw, Target } from "lucide-react";

const capabilities = [
  {
    icon: Brain,
    title: "Context-Aware",
    body: "Carl analyzes both the job requirements and the candidate's actual resume before generating a single question. No templates. No guesswork.",
  },
  {
    icon: RefreshCw,
    title: "Dynamically Adaptive",
    body: "Strong answer? Carl increases depth. Weak answer? Carl probes further. Every interview evolves in real time — just like a great human interviewer would.",
  },
  {
    icon: Target,
    title: "Role-Calibrated",
    body: "Engineering candidate? Carl goes technical. Sales candidate? Carl tests negotiation and resilience. Leadership candidate? Carl thinks strategically.",
  },
];

const GRID_CELL = "1 / 1";

export default function MeetCarlSection() {
  return (
    <section className="py-20 lg:py-28 bg-slate-900 relative overflow-hidden" id="meet-carl">
      {/* Ambient bg blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-600/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-violet-600/8 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── 2-column: orb LEFT, text RIGHT ─────────────────────── */}
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-20 mb-20">

          {/* LEFT: Carl orb */}
          <div className="flex-shrink-0 flex items-center justify-center">
            <div
              style={{
                display: "grid",
                placeItems: "center",
                width: 440,
                height: 440,
              }}
            >
              {/* Single very faint outer ring */}
              <div
                className="rounded-full bg-indigo-500/[0.02] animate-ping"
                style={{ gridArea: GRID_CELL, width: 380, height: 380, animationDuration: "4.5s", animationDelay: "0s" }}
              />

              {/* Soft glow halo */}
              <div
                className="rounded-full animate-pulse"
                style={{
                  gridArea: GRID_CELL,
                  width: 300,
                  height: 300,
                  background: "radial-gradient(circle, rgba(79,70,229,0.3) 0%, rgba(124,58,237,0.15) 50%, transparent 75%)",
                  filter: "blur(32px)",
                  animationDuration: "3s",
                }}
              />

              {/* Orbiting dot — clockwise */}
              <div
                className="animate-spin"
                style={{ gridArea: GRID_CELL, width: 310, height: 310, position: "relative", animationDuration: "9s" }}
              >
                <div
                  className="absolute rounded-full bg-indigo-400"
                  style={{ width: 12, height: 12, top: 0, left: "50%", transform: "translate(-50%, -50%)", boxShadow: "0 0 14px rgba(99,102,241,0.95)" }}
                />
              </div>

              {/* Orbiting dot — counter-clockwise */}
              <div
                className="animate-spin"
                style={{ gridArea: GRID_CELL, width: 260, height: 260, position: "relative", animationDuration: "14s", animationDirection: "reverse" }}
              >
                <div
                  className="absolute rounded-full bg-violet-300"
                  style={{ width: 8, height: 8, top: 0, left: "50%", transform: "translate(-50%, -50%)", boxShadow: "0 0 10px rgba(167,139,250,0.95)" }}
                />
              </div>

              {/* Core orb — 220px, Siri-style wave lines */}
              <div
                className="rounded-full overflow-hidden animate-orb"
                style={{
                  gridArea: GRID_CELL,
                  width: 220,
                  height: 220,
                  background: "linear-gradient(135deg, #3730a3 0%, #6d28d9 55%, #4c1d95 100%)",
                  zIndex: 10,
                  flexShrink: 0,
                }}
              >
                {/*
                  Period = 220px. wave-flow keyframe translates -220px per cycle.
                  Paths span 4 periods (-440 to 440) so the loop is always seamless.
                  Control points at 40% and 60% of each 220px segment (88 and 132).
                */}
                <svg viewBox="0 0 220 220" width="220" height="220" style={{ display: "block" }}>
                  {[
                    { cy: 110, amp: 26, dur: "2.0s", delay: "0s",    color: "#a5b4fc", w: 4,   op: 1    },
                    { cy: 108, amp: 15, dur: "2.8s", delay: "-0.8s", color: "#ddd6fe", w: 3,   op: 0.75 },
                    { cy: 112, amp: 38, dur: "3.4s", delay: "-1.6s", color: "#818cf8", w: 3,   op: 0.45 },
                    { cy: 110, amp: 9,  dur: "1.6s", delay: "-0.4s", color: "#e0e7ff", w: 2.5, op: 0.6  },
                  ].map(({ cy, amp, dur, delay, color, w, op }, i) => {
                    const d = [
                      `M -440,${cy}`,
                      `C -352,${cy - amp} -308,${cy + amp} -220,${cy}`,
                      `C -132,${cy - amp}  -88,${cy + amp}    0,${cy}`,
                      `C   88,${cy - amp}  132,${cy + amp}  220,${cy}`,
                      `C  308,${cy - amp}  352,${cy + amp}  440,${cy}`,
                    ].join(" ");
                    return (
                      <path
                        key={i}
                        d={d}
                        fill="none"
                        stroke={color}
                        strokeWidth={w}
                        strokeLinecap="round"
                        opacity={op}
                        style={{ animation: `wave-flow ${dur} linear infinite`, animationDelay: delay }}
                      />
                    );
                  })}
                </svg>
              </div>
            </div>
          </div>

          {/* RIGHT: text */}
          <div className="flex-1 text-center lg:text-left">
            <span className="inline-flex items-center gap-2 text-indigo-400 text-xs font-bold tracking-widest uppercase bg-indigo-600/10 border border-indigo-500/20 rounded-full px-4 py-1.5 mb-6">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
              Meet Your AI Interviewer
            </span>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-[1.1] tracking-tight mb-6">
              Meet Carl.{" "}
              <span className="gradient-text">He Never Misses an Interview.</span>
            </h2>

            <p className="text-slate-400 text-lg leading-relaxed mb-8">
              Carl is Hiventra&apos;s adaptive AI interviewer — built to conduct intelligent,
              role-specific interviews for every candidate, at any time, at any scale.
              <br /><br />
              Carl reads the job description. He reads the resume. He asks the right
              questions. And when the answers need probing — he goes deeper.
            </p>

            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold px-7 py-3.5 rounded-full shadow-btn hover:-translate-y-0.5 transition-all duration-200"
            >
              See Carl in Action →
            </a>
          </div>
        </div>

        {/* ── Capability cards ─────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {capabilities.map((cap) => {
            const Icon = cap.icon;
            return (
              <div
                key={cap.title}
                className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-7 hover:border-indigo-500/40 hover:-translate-y-1 transition-all duration-200"
              >
                <div className="w-11 h-11 bg-indigo-600/20 rounded-xl flex items-center justify-center mb-5">
                  <Icon className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{cap.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{cap.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
