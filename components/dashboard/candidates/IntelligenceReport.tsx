"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Download,
  Share2,
  Quote,
  Clock,
  Calendar,
  Sparkles,
  Loader2,
  Lock,
  Globe,
  Send,
  ThumbsUp,
  ThumbsDown,
  UserCheck,
} from "lucide-react";
import {
  addCandidateNote,
  updateCandidateStageFromProfile,
} from "@/app/actions/candidates";
import type { NoteItem } from "./CandidateProfile";
import type { ReportCandidateData, InterviewHighlight } from "@/app/actions/report";

// ── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function avatarColor(name: string) {
  const colors = ["bg-indigo-500","bg-violet-500","bg-emerald-500","bg-amber-500","bg-rose-500","bg-cyan-500"];
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % colors.length;
  return colors[h];
}

function fmt(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function scoreRingColor(score: number) {
  if (score >= 70) return { stroke: "#10b981", text: "text-emerald-600" };
  if (score >= 40) return { stroke: "#f59e0b", text: "text-amber-600" };
  return { stroke: "#ef4444", text: "text-red-600" };
}

function recommendationConfig(rec: string | null, score: number | null) {
  const s = score ?? 0;
  const key = rec ?? (s >= 80 ? "strongly_recommend" : s >= 60 ? "recommend" : s >= 40 ? "review_further" : "do_not_recommend");
  const map: Record<string, { label: string; bg: string; text: string; border: string; icon: React.ReactNode }> = {
    strongly_recommend: { label: "Strongly Recommend", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: <ThumbsUp className="w-4 h-4" /> },
    recommend: { label: "Recommend", bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200", icon: <ThumbsUp className="w-4 h-4" /> },
    review_further: { label: "Review Further", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", icon: <AlertCircle className="w-4 h-4" /> },
    do_not_recommend: { label: "Do Not Recommend", bg: "bg-red-50", text: "text-red-700", border: "border-red-200", icon: <ThumbsDown className="w-4 h-4" /> },
  };
  return map[key] ?? map.review_further;
}

function tagConfig(tag: InterviewHighlight["tag"]) {
  return {
    Positive: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
    Neutral: { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200" },
    Concern: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  }[tag];
}

// ── ScoreRing ─────────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const r = 80;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  const { stroke, text } = scoreRingColor(score);

  return (
    <div className="relative w-52 h-52 flex-shrink-0 print:w-40 print:h-40">
      <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
        <circle cx="100" cy="100" r={r} fill="none" stroke="#e2e8f0" strokeWidth="12" />
        <circle
          cx="100" cy="100" r={r} fill="none"
          stroke={stroke} strokeWidth="12"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.2s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-5xl font-extrabold ${text} print:text-4xl`}>{score}</span>
        <span className="text-slate-400 text-sm font-medium">/100</span>
      </div>
    </div>
  );
}

// ── SkillBar ──────────────────────────────────────────────────────────────────

function SkillBar({ label, value, animate }: { label: string; value: number; animate: boolean }) {
  const color =
    value >= 70 ? "bg-indigo-500" : value >= 40 ? "bg-amber-500" : "bg-red-400";
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-slate-700 font-medium">{label}</span>
        <span className="text-sm font-bold text-slate-800">{value}%</span>
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-700 ease-out`}
          style={{ width: animate ? `${value}%` : "0%" }}
        />
      </div>
    </div>
  );
}

// ── HighlightCard ─────────────────────────────────────────────────────────────

function HighlightCard({ highlight }: { highlight: InterviewHighlight }) {
  const cfg = tagConfig(highlight.tag);
  return (
    <div className="bg-white border border-brand-border rounded-2xl p-5 print-no-break">
      <p className="text-xs text-slate-400 font-medium mb-3 leading-relaxed">{highlight.question}</p>
      <div className="flex gap-3">
        <Quote className="w-6 h-6 text-indigo-200 flex-shrink-0 mt-0.5" />
        <p className="text-slate-700 italic text-sm leading-relaxed flex-1">"{highlight.excerpt}"</p>
      </div>
      <div className="mt-4">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
          {highlight.tag === "Positive" && <CheckCircle2 className="w-3 h-3" />}
          {highlight.tag === "Concern" && <AlertTriangle className="w-3 h-3" />}
          {highlight.tag}
        </span>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function IntelligenceReport({
  candidate,
  notes,
}: {
  candidate: ReportCandidateData;
  notes: NoteItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const interview = candidate.interviews?.[0] ?? null;
  const responses = interview?.responses ?? [];

  // All analysis comes from interviews table, not candidates
  const analysisReady = !!interview?.ai_analyzed_at;
  const score = interview?.ai_score ?? 0;
  const skillBreakdown = interview?.ai_skill_breakdown ?? null;
  const highlights = interview?.ai_interview_highlights ?? null;
  const risks = interview?.ai_risks ?? null;

  // Skill bars animation
  const skillsRef = useRef<HTMLDivElement>(null);
  const [barsVisible, setBarsVisible] = useState(false);

  // Note form
  const [noteBody, setNoteBody] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [submittingNote, setSubmittingNote] = useState(false);
  const [localNotes, setLocalNotes] = useState<NoteItem[]>(notes);

  // Stage action feedback
  const [stageMsg, setStageMsg] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState(false);

  const recCfg = recommendationConfig(interview?.ai_recommendation ?? null, score);
  const { text: scoreText } = scoreRingColor(score);
  const job = candidate.jobs;

  // Intersection observer for skill bars
  useEffect(() => {
    const el = skillsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setBarsVisible(true); }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [skillBreakdown]);

  const handleAddNote = async () => {
    if (!noteBody.trim() || submittingNote) return;
    setSubmittingNote(true);
    await addCandidateNote(candidate.id, noteBody.trim(), isPrivate);
    setLocalNotes((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        body: noteBody.trim(),
        is_private: isPrivate,
        created_at: new Date().toISOString(),
        author: { full_name: "You" },
      },
    ]);
    setNoteBody("");
    setSubmittingNote(false);
  };

  const handleStage = (stage: "recommended" | "rejected") => {
    startTransition(async () => {
      await updateCandidateStageFromProfile(candidate.id, stage);
      setStageMsg(stage === "recommended" ? "Candidate recommended" : "Candidate rejected");
      setRejectModal(false);
      router.refresh();
      setTimeout(() => setStageMsg(null), 3000);
    });
  };

  const handlePrint = () => window.print();

  const handleShare = () => {
    const url = `${window.location.origin}/dashboard/candidates/${candidate.id}/report`;
    navigator.clipboard.writeText(url).then(() => {
      setStageMsg("Report link copied to clipboard");
      setTimeout(() => setStageMsg(null), 3000);
    });
  };

  return (
    <div className="flex-1 overflow-auto bg-slate-50">
      {/* Breadcrumb — matches CandidateProfile style */}
      <div className="px-4 sm:px-6 py-3 bg-white border-b border-slate-100 print:hidden">
        <nav className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/dashboard/jobs" className="hover:text-indigo-600 transition-colors">Jobs</Link>
          <span className="text-slate-300">›</span>
          {job && (
            <>
              <Link href={`/dashboard/pipeline?job=${candidate.job_id}`} className="hover:text-indigo-600 transition-colors">{job.title}</Link>
              <span className="text-slate-300">›</span>
            </>
          )}
          <Link href={`/dashboard/candidates/${candidate.id}`} className="hover:text-indigo-600 transition-colors">{candidate.full_name}</Link>
          <span className="text-slate-300">›</span>
          <span className="font-medium text-slate-800">Intelligence Report</span>
        </nav>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 p-4 sm:p-6 items-start max-w-screen-xl mx-auto print:p-0">
        {/* ── LEFT MAIN COLUMN ─────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* Section 1: Header */}
          <div className="bg-white border border-brand-border rounded-2xl p-6 print-no-break">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-full ${avatarColor(candidate.full_name)} flex items-center justify-center flex-shrink-0 print:w-10 print:h-10`}>
                  <span className="text-white font-extrabold text-lg print:text-base">{initials(candidate.full_name)}</span>
                </div>
                <div>
                  <h1 className="text-xl font-extrabold text-slate-900">{candidate.full_name}</h1>
                  <p className="text-slate-500 text-sm mt-0.5">
                    Interview Report for: <span className="font-semibold text-slate-700">{job?.title ?? "—"}</span>
                    {job?.company && <span className="text-slate-400"> · {job.company}</span>}
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      Interview: {fmt(interview?.completed_at ?? interview?.started_at ?? null)}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      Report generated: {fmt(new Date().toISOString())}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-full">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                    <span className="text-white font-extrabold text-xs">C</span>
                  </div>
                  <span className="text-xs font-semibold text-indigo-700">Generated by Carl AI</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Score + Recommendation (hero) */}
          <div className="bg-white border border-brand-border rounded-2xl p-6 print-no-break">
            {!analysisReady ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <Clock className="w-8 h-8 text-slate-300" />
                <p className="text-slate-600 font-semibold">Analysis pending</p>
                <p className="text-slate-400 text-sm">The report will appear here once the candidate completes their interview.</p>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-8">
                <ScoreRing score={score} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Overall Assessment</p>
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold mb-4 ${recCfg.bg} ${recCfg.text} ${recCfg.border}`}>
                    {recCfg.icon}
                    {recCfg.label}
                  </div>
                  {interview?.ai_summary && (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                      <p className="text-xs font-semibold text-indigo-600 mb-2 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> Carl's Assessment
                      </p>
                      <p className="text-slate-600 text-sm leading-relaxed italic">"{interview.ai_summary}"</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Strengths & Weaknesses */}
          {(interview?.ai_strengths?.length || interview?.ai_weaknesses?.length) ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {interview?.ai_strengths?.length ? (
                <div className="bg-white border border-brand-border rounded-2xl p-5 print-no-break">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Strengths</p>
                  <ul className="space-y-2.5">
                    {interview.ai_strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-700 leading-relaxed">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {interview?.ai_weaknesses?.length ? (
                <div className="bg-white border border-brand-border rounded-2xl p-5 print-no-break">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Areas for Development</p>
                  <ul className="space-y-2.5">
                    {interview.ai_weaknesses.map((w, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-700 leading-relaxed">{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Section 4: Risk Indicators (conditional) */}
          {risks && risks.length > 0 && (
            <div className="bg-white border border-brand-border rounded-2xl p-5 print-no-break">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Risk Indicators</p>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4">
                <p className="text-xs text-amber-600">These are observations, not disqualifying factors. Use them as conversation starters.</p>
              </div>
              <ul className="space-y-2.5">
                {risks.map((risk, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Section 5: Skill Breakdown */}
          <div className="bg-white border border-brand-border rounded-2xl p-6 print-no-break" ref={skillsRef}>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-5">Skill Breakdown</p>
            {skillBreakdown ? (
              <div className="space-y-4">
                {Object.entries(skillBreakdown).map(([label, value]) => (
                  <SkillBar key={label} label={label} value={value} animate={barsVisible} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No skill data available yet.</p>
            )}
          </div>

          {/* Section 6: Interview Highlights */}
          {highlights && highlights.length > 0 && (
            <div className="bg-white border border-brand-border rounded-2xl p-6">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-5">Interview Highlights</p>
              <div className="space-y-4">
                {highlights.map((h, i) => (
                  <HighlightCard key={i} highlight={h} />
                ))}
              </div>
            </div>
          )}

          {/* Team Notes */}
          <div className="bg-white border border-brand-border rounded-2xl p-6 print-no-break">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Team Notes</p>
            {localNotes.length === 0 && (
              <p className="text-sm text-slate-400 mb-4">No notes yet.</p>
            )}
            {localNotes.length > 0 && (
              <div className="space-y-3 mb-5">
                {localNotes.map((note) => (
                  <div key={note.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-indigo-600 text-xs font-bold">
                        {(note.author?.full_name ?? "?").charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-slate-700">{note.author?.full_name ?? "Team member"}</span>
                        {note.is_private ? <Lock className="w-3 h-3 text-slate-400" /> : <Globe className="w-3 h-3 text-slate-400" />}
                        <span className="text-xs text-slate-400">{fmt(note.created_at)}</span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{note.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="print:hidden">
              <textarea
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                placeholder="Add a team note…"
                rows={3}
                className="w-full border border-brand-border rounded-xl px-3 py-2.5 text-sm text-slate-700 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <div className="flex items-center justify-between mt-2">
                <button
                  onClick={() => setIsPrivate((p) => !p)}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
                >
                  {isPrivate ? <Lock className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
                  {isPrivate ? "Private" : "Visible to team"}
                </button>
                <button
                  onClick={handleAddNote}
                  disabled={!noteBody.trim() || submittingNote}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                  {submittingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Add Note
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT SIDEBAR ─────────────────────────────────────────── */}
        <div className="w-full lg:w-72 flex-shrink-0 print:hidden">
          <div className="lg:sticky lg:top-6 space-y-4">

            {/* Toast */}
            {stageMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium px-4 py-3 rounded-xl text-center">
                {stageMsg}
              </div>
            )}

            {/* Decision card */}
            <div className="bg-white border border-brand-border rounded-2xl p-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Your Decision</p>
              <div className="space-y-2.5">
                <button
                  onClick={() => handleStage("recommended")}
                  disabled={isPending}
                  className="w-full flex items-center justify-center gap-2 border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 font-semibold text-sm py-2.5 rounded-xl transition-colors disabled:opacity-50"
                >
                  <UserCheck className="w-4 h-4" /> Recommend Candidate
                </button>
                <button
                  onClick={() => router.push(`/dashboard/candidates/${candidate.id}`)}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors"
                >
                  View Full Profile
                </button>
                <button
                  onClick={() => setRejectModal(true)}
                  disabled={isPending}
                  className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 font-semibold text-sm py-2.5 rounded-xl transition-colors disabled:opacity-50"
                >
                  Reject Candidate
                </button>
              </div>
            </div>

            {/* Report actions */}
            <div className="bg-white border border-brand-border rounded-2xl p-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Report Actions</p>
              <div className="space-y-2">
                <button
                  onClick={handlePrint}
                  className="w-full flex items-center gap-2.5 text-slate-700 hover:text-slate-900 hover:bg-slate-50 text-sm font-medium px-3 py-2.5 rounded-xl transition-colors"
                >
                  <Download className="w-4 h-4 text-slate-400" /> Download PDF
                </button>
                <button
                  onClick={handleShare}
                  className="w-full flex items-center gap-2.5 text-slate-700 hover:text-slate-900 hover:bg-slate-50 text-sm font-medium px-3 py-2.5 rounded-xl transition-colors"
                >
                  <Share2 className="w-4 h-4 text-slate-400" /> Share Report Link
                </button>
              </div>
            </div>

            {/* Candidate summary card */}
            <div className="bg-white border border-brand-border rounded-2xl p-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Quick Facts</p>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Mode</span>
                  <span className="font-medium text-slate-800 capitalize">{interview?.mode ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Responses</span>
                  <span className="font-medium text-slate-800">{responses.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Started</span>
                  <span className="font-medium text-slate-800">{fmt(interview?.started_at ?? null)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Completed</span>
                  <span className="font-medium text-slate-800">{fmt(interview?.completed_at ?? null)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Overall Score</span>
                  <span className={`font-bold ${analysisReady ? scoreText : "text-slate-400"}`}>
                    {analysisReady ? `${score}/100` : "Pending"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reject confirm modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4 print:hidden">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-base font-bold text-slate-900 mb-2">Reject Candidate</h2>
            <p className="text-sm text-slate-500 mb-5">This will move <strong>{candidate.full_name}</strong> to the Rejected stage. This action can be undone from the pipeline.</p>
            <div className="flex gap-3">
              <button onClick={() => setRejectModal(false)} className="flex-1 border border-slate-200 text-slate-600 text-sm font-semibold py-2.5 rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={() => handleStage("rejected")} disabled={isPending} className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
                {isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
