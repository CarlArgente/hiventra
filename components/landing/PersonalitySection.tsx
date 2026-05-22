"use client";

import { useState } from "react";

const personalities = [
  {
    emoji: "😊",
    name: "Friendly",
    tagline: "Warm and encouraging",
    color: "text-teal-600",
    border: "border-teal-400",
    bg: "bg-teal-50",
    activeBg: "bg-teal-600",
    desc: "Puts candidates at ease. Uses conversational language. Ideal for junior roles, high-volume screening, and culture-first hiring.",
    sample: '"That\'s a great starting point! Can you tell me more about how you handled that situation day-to-day?"',
  },
  {
    emoji: "💼",
    name: "Professional",
    tagline: "Structured and respectful",
    color: "text-indigo-600",
    border: "border-indigo-400",
    bg: "bg-indigo-50",
    activeBg: "bg-indigo-600",
    desc: "Direct, neutral, and businesslike. The standard enterprise interview feel — neither cold nor casual.",
    sample: '"Can you walk me through your approach to managing competing priorities in a fast-moving environment?"',
  },
  {
    emoji: "📐",
    name: "Strict",
    tagline: "High expectations, no shortcuts",
    color: "text-slate-600",
    border: "border-slate-400",
    bg: "bg-slate-50",
    activeBg: "bg-slate-700",
    desc: "Minimal affirmation. Expects specifics. Will re-ask vague answers with targeted follow-ups.",
    sample: '"That answer is fairly general. Can you give me a specific example with measurable outcomes?"',
  },
  {
    emoji: "🏛️",
    name: "Executive",
    tagline: "Peer-level, strategic thinking",
    color: "text-purple-600",
    border: "border-purple-400",
    bg: "bg-purple-50",
    activeBg: "bg-purple-700",
    desc: "Assumes seniority. Focuses on vision, organizational impact, and leadership philosophy.",
    sample: '"How do you approach building alignment across departments when you don\'t have direct authority?"',
  },
  {
    emoji: "⚙️",
    name: "Technical Deep Dive",
    tagline: "No surface-level answers accepted",
    color: "text-cyan-600",
    border: "border-cyan-400",
    bg: "bg-cyan-50",
    activeBg: "bg-cyan-700",
    desc: "Probes implementation details, architectural trade-offs, and edge cases. Built for senior engineers and specialists.",
    sample: '"Walk me through how you\'d design the data consistency layer for a distributed system handling 10M events per day."',
  },
];

export default function PersonalitySection() {
  const [active, setActive] = useState(1);

  return (
    <section className="py-20 lg:py-28 bg-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-block text-indigo-600 text-xs font-bold tracking-widest uppercase mb-3 bg-indigo-50 px-4 py-1.5 rounded-full">
            Carl's Personality Modes
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-4">
            Carl Adapts to Every Role.{" "}
            <span className="gradient-text">You Set the Tone.</span>
          </h2>
          <p className="text-slate-500 text-lg leading-relaxed">
            Choose how Carl conducts each interview. Whether you're screening a junior support agent
            or a C-suite executive, Carl adjusts his tone, depth, and questioning style to match.
          </p>
        </div>

        {/* Cards row — horizontal scroll on mobile */}
        <div className="flex gap-4 overflow-x-auto pb-4 md:grid md:grid-cols-5 md:overflow-visible scrollbar-hide">
          {personalities.map((p, i) => (
            <button
              key={p.name}
              onClick={() => setActive(i)}
              className={`shrink-0 w-52 md:w-auto flex flex-col gap-2 rounded-2xl p-5 border-2 text-left transition-all duration-200 hover:-translate-y-1 group ${
                active === i
                  ? `border-current ${p.color} bg-white shadow-hover`
                  : "border-slate-200 bg-white hover:border-slate-300 shadow-soft"
              }`}
              style={active === i ? { borderColor: "currentColor" } : {}}
            >
              <span className="text-2xl">{p.emoji}</span>
              <div>
                <p className={`font-bold text-sm ${active === i ? p.color : "text-slate-800"}`}>
                  {p.name}
                </p>
                <p className="text-slate-400 text-xs mt-0.5">{p.tagline}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Active card detail */}
        {personalities[active] && (
          <div className="mt-8 bg-white rounded-2xl p-8 border border-slate-200 shadow-soft flex flex-col md:flex-row gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{personalities[active].emoji}</span>
                <div>
                  <h3 className={`font-bold text-xl ${personalities[active].color}`}>
                    {personalities[active].name}
                  </h3>
                  <p className="text-slate-400 text-sm">{personalities[active].tagline}</p>
                </div>
              </div>
              <p className="text-slate-600 leading-relaxed">{personalities[active].desc}</p>
            </div>
            <div className={`flex-1 ${personalities[active].bg} rounded-xl p-6 border border-dashed ${personalities[active].border}`}>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-3">Carl sample question</p>
              <p className={`italic text-base leading-relaxed font-medium ${personalities[active].color}`}>
                {personalities[active].sample}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
