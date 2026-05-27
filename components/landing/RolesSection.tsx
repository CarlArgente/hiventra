"use client";

import { useState } from "react";
import { CheckCircle } from "lucide-react";

const roles = [
  {
    label: "HR or Interviewer",
    headline: "For HR & Interviewers",
    sub: "You own the process from start to finish. Hiventra gives you the command center to manage it all.",
    points: [
      "Create and publish jobs in minutes",
      "Upload 50 resumes at once — scored before you finish your coffee",
      "Send Carl to interview every candidate automatically",
      "Track every candidate across 8 pipeline stages in real time",
      "Collaborate with your team without chasing anyone on Slack",
    ],
  },
  {
    label: "Hiring Manager",
    headline: "For Hiring Managers",
    sub: "You need the best candidate for your team — fast. Hiventra puts the intelligence in front of you, not the admin work.",
    points: [
      "Review AI-generated Intelligence Reports per candidate",
      "See skill breakdowns, interview highlights, and risk indicators",
      "Compare top candidates side-by-side",
      "Run your approval decision without attending a single meeting",
      "Leave comments and decisions — whenever works for you",
    ],
  },
  {
    label: "Department Head",
    headline: "For Department Heads",
    sub: "You care about the outcome, not the process. Hiventra keeps you informed and in control at the right moments.",
    points: [
      "Review final candidate recommendations before hire decisions",
      "See AI scores alongside your team's assessments",
      "Approve or request further review in one click",
      "Access analytics on hiring performance across your department",
      "Never be the bottleneck — async approvals work around your schedule",
    ],
  },
  {
    label: "Admin",
    headline: "For Admins",
    sub: "You keep the platform running and the team aligned. Hiventra's admin tools give you full control without the headaches.",
    points: [
      "Manage users, roles, and permissions with granular RBAC",
      "Configure Carl's default personality and interview settings",
      "Set scoring thresholds for your organization's standards",
      "Connect ATS, calendar, and SSO integrations",
      "Access the full AI audit trail and fairness monitoring reports",
    ],
  },
];

export default function RolesSection() {
  const [active, setActive] = useState(0);
  const role = roles[active];

  return (
    <section className="py-20 lg:py-28 bg-white" id="roles">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-block text-indigo-600 text-xs font-bold tracking-widest uppercase mb-3 bg-indigo-50 px-4 py-1.5 rounded-full">
            Built for Your Whole Team
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-4">
            One Platform.{" "}
            <span className="gradient-text">Every Stakeholder.</span>{" "}
            No Learning Curve.
          </h2>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl max-w-xl mx-auto mb-10">
          {roles.map((r, i) => (
            <button
              key={r.label}
              onClick={() => setActive(i)}
              className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                active === i
                  ? "bg-white text-indigo-600 shadow-soft"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex flex-col lg:flex-row gap-10 items-start">
          <div className="flex-1 max-w-lg">
            <h3 className="text-2xl font-extrabold text-slate-900 mb-3">{role.headline}</h3>
            <p className="text-slate-500 text-base leading-relaxed mb-6">{role.sub}</p>
            <ul className="space-y-3">
              {role.points.map((pt) => (
                <li key={pt} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  <span className="text-slate-700 text-sm">{pt}</span>
                </li>
              ))}
            </ul>
            <a
              href="#"
              className="mt-8 inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold px-7 py-3.5 rounded-full shadow-btn hover:-translate-y-0.5 transition-all duration-200"
            >
              Start Now →
            </a>
          </div>

          {/* Mock UI panel */}
          <div className="flex-1 w-full">
            <div className="bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700/80 bg-slate-800/60">
                <span className="text-white text-sm font-semibold">{role.headline}</span>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                </div>
              </div>
              <div className="p-5 space-y-3 min-h-48">
                {role.points.map((pt, i) => (
                  <div key={i} className="flex items-start gap-3 bg-slate-800/50 rounded-xl px-4 py-3">
                    <div className="w-5 h-5 rounded-full bg-indigo-600/30 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-indigo-400 text-[10px] font-bold">{i + 1}</span>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">{pt}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
