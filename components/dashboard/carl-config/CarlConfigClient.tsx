"use client";

import { useState, useTransition } from "react";
import { Check, ChevronDown, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { saveCarlConfig, type JobSummary } from "@/app/actions/jobs";

// ── Data ─────────────────────────────────────────────────────────────────────

const MODES = [
  { id: "text", emoji: "💬", label: "Text Interview", desc: "Async text-based Q&A at the candidate's own pace" },
  { id: "voice", emoji: "🎙️", label: "Voice Interview", desc: "Real-time spoken conversation with Carl" },
  { id: "video", emoji: "🎥", label: "Video Interview", desc: "Face-to-face video session with AI analysis" },
] as const;

const PERSONALITIES = [
  { id: "friendly", emoji: "😊", label: "Friendly", desc: "Warm, encouraging tone. Makes candidates feel at ease and comfortable sharing." },
  { id: "professional", emoji: "🎯", label: "Professional", desc: "Polished, structured approach. Balanced and objective throughout." },
  { id: "strict", emoji: "⚡", label: "Strict", desc: "High-pressure style. Probes deeply with challenging follow-ups." },
  { id: "executive", emoji: "👔", label: "Executive", desc: "Strategic, big-picture focus. Evaluates leadership thinking and vision." },
  { id: "technical", emoji: "🔬", label: "Technical Deep Dive", desc: "Rigorous technical exploration. Tests depth, trade-offs, and real-world application." },
] as const;

const DURATIONS = [15, 30, 45, 60] as const;

const ALL_TOPICS = [
  "Skills", "Experience", "Culture Fit", "Situational",
  "Technical", "Behavioral", "Leadership", "Problem Solving",
] as const;

const ROLE_TYPES = [
  { value: "developer", label: "Developer" },
  { value: "sales", label: "Sales" },
  { value: "hr", label: "HR" },
  { value: "executive", label: "Executive" },
  { value: "support", label: "Support" },
  { value: "finance", label: "Finance" },
  { value: "other", label: "Other" },
];

// ── Sample questions lookup ────────────────────────────────────────────────

const SAMPLE_QUESTIONS: Record<string, Record<string, string>> = {
  friendly: {
    developer: "What's a project you're genuinely proud of, and what made it special to you?",
    sales: "Tell me about a deal you're proud of closing — what made the process enjoyable?",
    hr: "What's a hiring win you're proud of? Walk me through how you found the right person.",
    executive: "What's a strategic decision you made that you feel really good about, and why?",
    support: "Tell me about a customer interaction that went really well. What did you do?",
    finance: "What's a financial challenge you tackled that you're proud of solving?",
    other: "Tell me about a recent success you're proud of and what you learned from it.",
  },
  professional: {
    developer: "Walk me through the most complex system you've architected and the key design decisions you made.",
    sales: "Describe your most significant deal — what was your strategy and how did you close it?",
    hr: "How do you structure your sourcing strategy for a high-priority, hard-to-fill role?",
    executive: "How do you approach building and communicating a long-term organizational strategy?",
    support: "How do you prioritize and resolve competing high-severity customer issues simultaneously?",
    finance: "Walk me through how you'd approach a complex financial model for a new business unit.",
    other: "Describe a significant project you led from inception to completion and your approach.",
  },
  strict: {
    developer: "Your last major system failed under load. Walk me through every decision that led to that failure and what you'd do differently.",
    sales: "You've missed quota two quarters in a row. What exactly went wrong and how do you fix it?",
    hr: "A critical hire you championed left after 3 months. What did you miss in the process?",
    executive: "Your last strategic initiative didn't deliver results. Be specific about what failed and why.",
    support: "A customer churned after repeated escalations you owned. What failed and how do you prevent it?",
    finance: "Your financial forecast was off by 30%. Explain exactly what you missed and how you correct it.",
    other: "Describe a significant failure you were responsible for. What specifically went wrong?",
  },
  executive: {
    developer: "How do you think about the long-term technical strategy for an engineering organization, and how do you align it with business objectives?",
    sales: "How do you build a go-to-market strategy from scratch, and how do you measure if it's working?",
    hr: "How do you design a people strategy that scales the organization through a period of rapid growth?",
    executive: "Walk me through how you'd approach a major organizational transformation with significant resistance.",
    support: "How would you redesign a customer success function to become a revenue driver, not just a cost center?",
    finance: "How do you align financial strategy with long-term business objectives during market uncertainty?",
    other: "How do you set organizational priorities and ensure alignment across a large, complex team?",
  },
  technical: {
    developer: "Compare event sourcing vs. CQRS in a high-throughput distributed system — when would you use each, and what are the consistency trade-offs?",
    sales: "Walk me through your exact sales methodology, every stage, the metrics you track, and how you coach your team on it.",
    hr: "Explain how you'd design a structured interview process with calibrated rubrics to reduce bias across a large hiring team.",
    executive: "Walk me through the specific metrics and leading indicators you use to assess organizational health.",
    support: "How do you instrument a support workflow to identify systemic product issues before they escalate?",
    finance: "Walk me through how you'd construct a three-statement financial model from scratch for a SaaS business.",
    other: "Walk me through the most technical or complex problem in your domain that you've solved recently.",
  },
};

function getSampleQuestion(personality: string, roleType: string): string {
  return (
    SAMPLE_QUESTIONS[personality]?.[roleType] ??
    SAMPLE_QUESTIONS["professional"]?.["developer"] ??
    "Tell me about yourself and your background."
  );
}

// ── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULTS = {
  mode: "text" as const,
  personality: "professional",
  duration: 30 as const,
  maxQuestions: 10,
  topics: ["Skills", "Experience", "Behavioral"],
  roleType: "developer",
};

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  jobs: JobSummary[];
}

export default function CarlConfigClient({ jobs }: Props) {
  const [selectedJobId, setSelectedJobId] = useState<string>(jobs[0]?.id ?? "");
  const [mode, setMode] = useState<string>(jobs[0]?.carl_mode ?? DEFAULTS.mode);
  const [personality, setPersonality] = useState<string>(jobs[0]?.carl_personality ?? DEFAULTS.personality);
  const [duration, setDuration] = useState<number>(jobs[0]?.carl_duration ?? DEFAULTS.duration);
  const [maxQuestions, setMaxQuestions] = useState<number>(jobs[0]?.carl_max_questions ?? DEFAULTS.maxQuestions);
  const [topics, setTopics] = useState<string[]>(jobs[0]?.carl_topics?.length ? jobs[0].carl_topics : DEFAULTS.topics);
  const [roleType, setRoleType] = useState<string>(jobs[0]?.carl_role_type ?? DEFAULTS.roleType);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const selectedJob = jobs.find((j) => j.id === selectedJobId);

  function loadJob(id: string) {
    const job = jobs.find((j) => j.id === id);
    if (!job) return;
    setSelectedJobId(id);
    setMode(job.carl_mode ?? DEFAULTS.mode);
    setPersonality(job.carl_personality ?? DEFAULTS.personality);
    setDuration(job.carl_duration ?? DEFAULTS.duration);
    setMaxQuestions(job.carl_max_questions ?? DEFAULTS.maxQuestions);
    setTopics(job.carl_topics?.length ? job.carl_topics : DEFAULTS.topics);
    setRoleType(job.carl_role_type ?? DEFAULTS.roleType);
    setSaved(false);
  }

  function restoreDefaults() {
    setMode(DEFAULTS.mode);
    setPersonality(DEFAULTS.personality);
    setDuration(DEFAULTS.duration);
    setMaxQuestions(DEFAULTS.maxQuestions);
    setTopics(DEFAULTS.topics);
    setRoleType(DEFAULTS.roleType);
    setSaved(false);
  }

  function toggleTopic(topic: string) {
    setTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
    setSaved(false);
  }

  function handleSave() {
    if (!selectedJobId) return;
    startTransition(async () => {
      await saveCarlConfig(selectedJobId, {
        carl_mode: mode,
        carl_personality: personality,
        carl_duration: duration,
        carl_max_questions: maxQuestions,
        carl_topics: topics,
        carl_role_type: roleType,
      });
      setSaved(true);
    });
  }

  const excludedTopics = ALL_TOPICS.filter((t) => !topics.includes(t));
  const sampleQuestion = getSampleQuestion(personality, roleType);
  const personalityLabel = PERSONALITIES.find((p) => p.id === personality)?.label ?? personality;
  const modeLabel = MODES.find((m) => m.id === mode)?.label ?? mode;

  if (jobs.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 text-sm">No jobs found.</p>
          <p className="text-slate-400 text-xs mt-1">Create a job first to configure Carl.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Job selector */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Configuring for job
          </label>
          <div className="relative inline-block">
            <select
              value={selectedJobId}
              onChange={(e) => loadJob(e.target.value)}
              className="appearance-none bg-white border border-slate-200 rounded-lg px-3 py-2 pr-8 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} — {j.company}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Two-column layout */}
        <div className="flex gap-6 items-start">
          {/* LEFT — Config form */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* Section 1 — Interview Mode */}
            <section className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-sm font-bold text-slate-800 mb-4">Interview Mode</h2>
              <div className="grid grid-cols-3 gap-3">
                {MODES.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => { setMode(m.id); setSaved(false); }}
                    className={cn(
                      "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-all duration-150",
                      mode === m.id
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    {mode === m.id && (
                      <span className="absolute top-2 right-2 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </span>
                    )}
                    <span className="text-2xl">{m.emoji}</span>
                    <span className="text-xs font-bold text-slate-800">{m.label}</span>
                    <span className="text-[10px] text-slate-500 leading-tight">{m.desc}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Section 2 — Carl Personality */}
            <section className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-sm font-bold text-slate-800 mb-4">Carl Personality</h2>
              <div className="grid grid-cols-2 gap-3">
                {PERSONALITIES.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setPersonality(p.id); setSaved(false); }}
                    className={cn(
                      "flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all duration-150",
                      personality === p.id
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5",
                      personality === p.id ? "border-indigo-500 bg-indigo-500" : "border-slate-300"
                    )}>
                      {personality === p.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-base">{p.emoji}</span>
                        <span className="text-xs font-bold text-slate-800">{p.label}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-snug">{p.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Section 3 — Duration & Questions */}
            <section className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-sm font-bold text-slate-800 mb-4">Duration & Questions</h2>
              <div className="flex flex-col gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2">Interview Duration</label>
                  <div className="flex gap-1.5">
                    {DURATIONS.map((d) => (
                      <button
                        key={d}
                        onClick={() => { setDuration(d); setSaved(false); }}
                        className={cn(
                          "px-4 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150",
                          duration === d
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                        )}
                      >
                        {d} min
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2">Max Questions</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => { setMaxQuestions((q) => Math.max(5, q - 1)); setSaved(false); }}
                      className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-10 text-center text-sm font-bold text-slate-800">{maxQuestions}</span>
                    <button
                      onClick={() => { setMaxQuestions((q) => Math.min(20, q + 1)); setSaved(false); }}
                      className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] text-slate-400">Range: 5–20</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 4 — Topics */}
            <section className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-sm font-bold text-slate-800 mb-4">Topics</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2">Topics to Include</label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_TOPICS.map((t) => (
                      <button
                        key={t}
                        onClick={() => toggleTopic(t)}
                        className={cn(
                          "px-3 py-1 rounded-full text-xs font-medium border transition-all duration-150",
                          topics.includes(t)
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2">Topics to Exclude</label>
                  {excludedTopics.length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic">All topics selected for inclusion.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {excludedTopics.map((t) => (
                        <span
                          key={t}
                          className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Section 5 — Role Type */}
            <section className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-sm font-bold text-slate-800 mb-1">Role Type</h2>
              <p className="text-[11px] text-slate-500 mb-3">Carl will interview as if hiring for a:</p>
              <div className="relative inline-block">
                <select
                  value={roleType}
                  onChange={(e) => { setRoleType(e.target.value); setSaved(false); }}
                  className="appearance-none bg-white border border-slate-200 rounded-lg px-3 py-2 pr-8 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {ROLE_TYPES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              {selectedJob && (
                <p className="text-[10px] text-slate-400 italic mt-2">
                  Auto-detected from job title: <span className="font-medium">{selectedJob.title}</span>
                </p>
              )}
            </section>

            {/* Footer */}
            <div className="flex items-center justify-between pb-6">
              <button
                onClick={restoreDefaults}
                className="text-xs text-slate-500 hover:text-indigo-600 underline underline-offset-2 transition-colors"
              >
                Restore Defaults
              </button>
              <button
                onClick={handleSave}
                disabled={isPending || !selectedJobId}
                className={cn(
                  "px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-150",
                  saved
                    ? "bg-emerald-500 text-white"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm",
                  (isPending || !selectedJobId) && "opacity-60 cursor-not-allowed"
                )}
              >
                {isPending ? "Saving…" : saved ? "✓ Saved" : "Save Configuration"}
              </button>
            </div>
          </div>

          {/* RIGHT — Sticky preview */}
          <div className="w-72 shrink-0 sticky top-6">
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5">
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-md shrink-0">
                  <span className="text-white font-extrabold text-sm">C</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Carl Preview</p>
                  <p className="text-[10px] text-slate-500">Live sample based on settings</p>
                </div>
              </div>

              {/* Sample question */}
              <div className="bg-white rounded-xl border border-indigo-100 p-4 mb-4">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Sample Opening Question
                </p>
                <blockquote className="text-xs text-slate-700 italic leading-relaxed">
                  "{sampleQuestion}"
                </blockquote>
              </div>

              {/* Summary badges */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-100 text-indigo-700">
                  {personalityLabel}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-100 text-indigo-700">
                  {modeLabel}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-100 text-indigo-700">
                  {duration} min
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-100 text-indigo-700">
                  {maxQuestions} questions
                </span>
              </div>

              {/* Topics summary */}
              {topics.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {topics.map((t) => (
                    <span key={t} className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-white border border-indigo-200 text-indigo-600">
                      {t}
                    </span>
                  ))}
                </div>
              )}

              <p className="text-[9px] text-slate-400 leading-relaxed">
                Carl generates all questions dynamically — this is a sample.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
