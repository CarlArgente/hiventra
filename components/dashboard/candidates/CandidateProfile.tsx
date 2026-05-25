"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  Phone,
  FileText,
  Download,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Lock,
  Globe,
  Send,
  RefreshCw,
  BarChart3,
  ChevronDown,
  X,
  Loader2,
  AlertCircle,
  File,
  Pencil,
  Check,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";
import {
  PIPELINE_STAGES,
  STAGE_LABELS,
  type PipelineStage,
} from "@/components/dashboard/pipeline/pipeline-types";
import {
  updateCandidateStageFromProfile,
  sendInterviewInvite,
  addCandidateNote,
  updateCandidateInfo,
} from "@/app/actions/candidates";
import { getResumeSignedUrl } from "@/app/actions/storage";

// ── Types ────────────────────────────────────────────────────────────────────

type Interview = {
  id: string;
  mode: string | null;
  status: string | null;
  invited_at: string | null;
  started_at: string | null;
  completed_at: string | null;
};

type Job = {
  id: string;
  title: string;
  department: string | null;
  status: string;
  company: string;
  carl_mode?: string | null;
};

export type NoteItem = {
  id: string;
  body: string;
  is_private: boolean;
  created_at: string;
  author: { full_name: string | null } | null;
};

export type CandidateProfileData = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  stage: string;
  ai_score: number | null;
  ai_recommendation: string | null;
  ai_summary: string | null;
  ai_strengths: string[] | null;
  ai_weaknesses: string[] | null;
  resume_url: string | null;
  resume_filename: string | null;
  created_at: string;
  updated_at: string;
  job_id: string;
  jobs: Job | null;
  interviews: Interview[];
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function avatarColor(name: string) {
  const colors = [
    "bg-indigo-500",
    "bg-violet-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-cyan-500",
    "bg-orange-500",
    "bg-teal-500",
  ];
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % colors.length;
  return colors[h];
}

function stageBadgeClass(stage: string) {
  const map: Record<string, string> = {
    uploaded: "bg-slate-100 text-slate-600 border-slate-200",
    screened: "bg-blue-100 text-blue-700 border-blue-200",
    invited: "bg-indigo-100 text-indigo-700 border-indigo-200",
    interview_started: "bg-violet-100 text-violet-700 border-violet-200",
    completed: "bg-sky-100 text-sky-700 border-sky-200",
    recommended: "bg-emerald-100 text-emerald-700 border-emerald-200",
    rejected: "bg-red-100 text-red-600 border-red-200",
    hired: "bg-teal-100 text-teal-700 border-teal-200",
  };
  return map[stage] ?? "bg-slate-100 text-slate-600 border-slate-200";
}

function recommendationLabel(r: string) {
  const map: Record<string, string> = {
    strongly_recommend: "Highly Recommended",
    recommend: "Recommended",
    review_further: "Review Further",
    not_recommend: "Not Recommended",
  };
  return map[r] ?? r;
}

function recommendationClass(r: string) {
  const map: Record<string, string> = {
    strongly_recommend: "bg-emerald-100 text-emerald-700 border-emerald-200",
    recommend: "bg-teal-100 text-teal-700 border-teal-200",
    review_further: "bg-amber-100 text-amber-700 border-amber-200",
    not_recommend: "bg-red-100 text-red-600 border-red-200",
  };
  return map[r] ?? "bg-slate-100 text-slate-600 border-slate-200";
}

const SCORE_CATEGORIES = [
  "Skill Match",
  "Years of Experience",
  "Industry Fit",
  "Leadership Fit",
  "Communication Signals",
];

function deriveBreakdown(score: number, candidateId: string) {
  let h = 0;
  for (const c of candidateId) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return SCORE_CATEGORIES.map((label, i) => {
    const nibble = (h >> (i * 3)) & 7;
    const offset = (nibble - 3) * 5;
    return { label, score: Math.min(100, Math.max(0, score + offset)) };
  });
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtDatetime(d: string) {
  return new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ── Score gauge ───────────────────────────────────────────────────────────────

function ScoreGauge({ score }: { score: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const [dash, setDash] = useState(0);
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";

  useEffect(() => {
    const t = setTimeout(() => setDash((score / 100) * circ), 50);
    return () => clearTimeout(t);
  }, [score, circ]);

  return (
    <svg viewBox="0 0 120 120" className="w-36 h-36">
      <circle cx="60" cy="60" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
      <circle
        cx="60"
        cy="60"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 60 60)"
        style={{ transition: "stroke-dasharray 1s ease-out" }}
      />
      <text
        x="60"
        y="54"
        textAnchor="middle"
        dominantBaseline="middle"
        style={{ fontSize: "26px", fontWeight: "700", fill: "#0f172a" }}
      >
        {score}
      </text>
      <text
        x="60"
        y="74"
        textAnchor="middle"
        style={{ fontSize: "11px", fill: "#64748b" }}
      >
        / 100
      </text>
    </svg>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-xs font-semibold text-slate-700">{value}</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const card = "bg-white rounded-xl border border-slate-100 shadow-sm";

export default function CandidateProfile({
  candidate,
  notes: initialNotes,
}: {
  candidate: CandidateProfileData;
  notes: NoteItem[];
}) {
  const router = useRouter();
  const [stage, setStage] = useState(candidate.stage as PipelineStage);
  const [notes, setNotes] = useState(initialNotes);
  const [noteBody, setNoteBody] = useState("");
  const [notePrivate, setNotePrivate] = useState(false);
  const [noteLoading, setNoteLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(candidate.full_name);
  const [editEmail, setEditEmail] = useState(candidate.email);
  const [editPhone, setEditPhone] = useState(candidate.phone ?? "");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState(candidate.full_name);
  const [displayEmail, setDisplayEmail] = useState(candidate.email);
  const [displayPhone, setDisplayPhone] = useState(candidate.phone ?? "");

  async function openResumePreview() {
    setPreviewOpen(true);
    setPreviewUrl(null);
    setPreviewLoading(true);
    if (candidate.resume_url) {
      const url = await getResumeSignedUrl(candidate.resume_url);
      setPreviewUrl(url);
    }
    setPreviewLoading(false);
  }

  async function handleResumeDownload() {
    if (!candidate.resume_url) return;
    const url = await getResumeSignedUrl(candidate.resume_url);
    if (!url) return;
    const res = await fetch(url);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = candidate.resume_filename ?? "resume";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  const interview = Array.isArray(candidate.interviews)
    ? (candidate.interviews[0] ?? null)
    : null;
  const job = candidate.jobs;
  const breakdown =
    candidate.ai_score != null
      ? deriveBreakdown(candidate.ai_score, candidate.id)
      : null;

  function startEdit() {
    setEditName(displayName);
    setEditEmail(displayEmail);
    setEditPhone(displayPhone);
    setEditError(null);
    setIsEditing(true);
  }

  function cancelEdit() {
    setIsEditing(false);
    setEditError(null);
  }

  async function saveEdit() {
    if (!editName.trim() || !editEmail.trim()) {
      setEditError("Name and email are required.");
      return;
    }
    setEditLoading(true);
    setEditError(null);
    const result = await updateCandidateInfo(candidate.id, {
      full_name: editName.trim(),
      email: editEmail.trim(),
      phone: editPhone.trim() || null,
    });
    setEditLoading(false);
    if (result && "error" in result) {
      setEditError(result.error ?? "Failed to save");
      return;
    }
    setDisplayName(editName.trim());
    setDisplayEmail(editEmail.trim());
    setDisplayPhone(editPhone.trim());
    setIsEditing(false);
    router.refresh();
  }

  async function handleStageChange(newStage: PipelineStage) {
    setStage(newStage);
    setActionLoading(true);
    await updateCandidateStageFromProfile(candidate.id, newStage);
    setActionLoading(false);
    router.refresh();
  }

  async function handleSendInvite() {
    if (!job) return;
    setActionLoading(true);
    await sendInterviewInvite(
      candidate.id,
      job.id,
      job.carl_mode ?? "text"
    );
    setActionLoading(false);
    router.refresh();
  }

  async function handleAddNote() {
    if (!noteBody.trim() || noteLoading) return;
    setNoteLoading(true);
    const body = noteBody.trim();
    const optimistic: NoteItem = {
      id: `opt-${Date.now()}`,
      body,
      is_private: notePrivate,
      created_at: new Date().toISOString(),
      author: { full_name: "You" },
    };
    setNotes((prev) => [...prev, optimistic]);
    setNoteBody("");
    await addCandidateNote(candidate.id, body, notePrivate);
    setNoteLoading(false);
  }

  const activityEvents = [
    { label: "Resume Uploaded", date: candidate.created_at },
    ...(candidate.ai_score != null
      ? [{ label: "AI Score Generated", date: candidate.updated_at }]
      : []),
    ...(interview?.invited_at
      ? [{ label: "Interview Invitation Sent", date: interview.invited_at }]
      : []),
    ...(interview?.started_at
      ? [{ label: "Interview Started", date: interview.started_at }]
      : []),
    ...(interview?.completed_at
      ? [{ label: "Interview Completed", date: interview.completed_at }]
      : []),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const ivStatus = interview?.status ?? null;
  type PrimaryAction = {
    label: string;
    icon: React.ReactNode;
    action: () => void;
    disabled?: boolean;
  };
  let primaryAction: PrimaryAction | null = null;
  if (!interview || ivStatus === "pending") {
    primaryAction = {
      label: "Send Interview Invite",
      icon: <Send className="w-4 h-4" />,
      action: handleSendInvite,
    };
  } else if (ivStatus === "invited") {
    primaryAction = {
      label: "Resend Invite",
      icon: <RefreshCw className="w-4 h-4" />,
      action: handleSendInvite,
    };
  } else if (ivStatus === "started") {
    primaryAction = {
      label: "Interview In Progress",
      icon: <BarChart3 className="w-4 h-4" />,
      action: () => {},
      disabled: true,
    };
  } else if (ivStatus === "completed") {
    primaryAction = {
      label: "View Intelligence Report",
      icon: <BarChart3 className="w-4 h-4" />,
      action: () => router.push(`/candidates/${candidate.id}/report`),
    };
  }

  return (
    <div className="flex-1 overflow-auto bg-slate-50">
      {/* Breadcrumb */}
      <div className="px-4 sm:px-6 py-3 bg-white border-b border-slate-100">
        <nav className="flex items-center gap-2 text-sm text-slate-500">
          <Link
            href="/jobs"
            className="hover:text-indigo-600 transition-colors"
          >
            Jobs
          </Link>
          <span className="text-slate-300">›</span>
          {job && (
            <>
              <Link
                href={`/pipeline?job=${candidate.job_id}`}
                className="hover:text-indigo-600 transition-colors"
              >
                {job.title}
              </Link>
              <span className="text-slate-300">›</span>
            </>
          )}
          <span className="font-medium text-slate-800">{displayName}</span>
        </nav>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 p-4 sm:p-6 items-start max-w-screen-xl mx-auto">
        {/* ── LEFT COLUMN ───────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* Card 1 — Header */}
          <div className={cn(card, "p-6")}>
            <div className="flex items-start gap-5">
              <div
                className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0",
                  avatarColor(displayName)
                )}
              >
                {initials(displayName)}
              </div>
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Full Name</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Email</label>
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Phone</label>
                        <input
                          type="tel"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          placeholder="Optional"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                    {editError && (
                      <p className="text-xs text-red-500">{editError}</p>
                    )}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={saveEdit}
                        disabled={editLoading}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-semibold disabled:opacity-50 hover:-translate-y-0.5 transition-all duration-200 shadow-sm"
                      >
                        {editLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                        {editLoading ? "Saving…" : "Save"}
                      </button>
                      <button
                        onClick={cancelEdit}
                        disabled={editLoading}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors"
                      >
                        <X className="w-3 h-3" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2">
                          <h1 className="text-2xl font-bold text-slate-900 leading-tight">
                            {displayName}
                          </h1>
                          <button
                            onClick={startEdit}
                            className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Edit candidate info"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {job && (
                          <p className="text-sm text-slate-500 mt-0.5">
                            Applied for:{" "}
                            <span className="font-semibold text-slate-700">
                              {job.title}
                            </span>
                            {job.department && (
                              <span className="text-slate-400">
                                {" "}
                                · {job.department}
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                      <span
                        className={cn(
                          "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border",
                          stageBadgeClass(stage)
                        )}
                      >
                        {STAGE_LABELS[stage] ?? stage}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 mt-3">
                      <a
                        href={`mailto:${displayEmail}`}
                        className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-indigo-600 transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        {displayEmail}
                      </a>
                      {displayPhone && (
                        <a
                          href={`tel:${displayPhone}`}
                          className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-indigo-600 transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          {displayPhone}
                        </a>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Card 2 — AI Resume Summary */}
          {candidate.ai_summary && (
            <div className={cn(card, "p-6 border-l-4 border-l-indigo-400")}>
              <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                AI Resume Summary
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                {candidate.ai_summary}
              </p>
            </div>
          )}

          {/* Card 3 — AI Match Score */}
          {candidate.ai_score != null && (
            <div className={cn(card, "p-6")}>
              <h2 className="text-sm font-semibold text-slate-700 mb-5">
                AI Match Score
              </h2>
              <div className="flex flex-col items-center mb-6">
                <ScoreGauge score={candidate.ai_score} />
                {candidate.ai_recommendation && (
                  <span
                    className={cn(
                      "mt-3 px-4 py-1.5 rounded-full text-xs font-semibold border",
                      recommendationClass(candidate.ai_recommendation)
                    )}
                  >
                    {recommendationLabel(candidate.ai_recommendation)}
                  </span>
                )}
              </div>

              {breakdown && (
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                    Score Breakdown
                  </p>
                  {breakdown.map(({ label, score }) => (
                    <div key={label}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-slate-600 font-medium">
                          {label}
                        </span>
                        <span className="text-xs font-bold text-slate-700">
                          {score}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          style={{
                            width: mounted ? `${score}%` : "0%",
                            transition: "width 0.7s ease-out",
                          }}
                          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Card 4 — Strengths & Weaknesses */}
          {((candidate.ai_strengths?.length ?? 0) > 0 ||
            (candidate.ai_weaknesses?.length ?? 0) > 0) && (
            <div className={cn(card, "p-6")}>
              <h2 className="text-sm font-semibold text-slate-700 mb-4">
                Strengths & Weaknesses
              </h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2.5">
                    Strengths
                  </p>
                  <ul className="space-y-2">
                    {(candidate.ai_strengths ?? []).map((s, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-slate-700"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2.5">
                    Areas to Improve
                  </p>
                  <ul className="space-y-2">
                    {(candidate.ai_weaknesses ?? []).map((w, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-slate-700"
                      >
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Card 5 — Resume */}
          {candidate.resume_filename && (
            <div className={cn(card, "p-6")}>
              <h2 className="text-sm font-semibold text-slate-700 mb-4">
                Original Resume
              </h2>
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {candidate.resume_filename}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Uploaded {fmtDate(candidate.created_at)}
                  </p>
                </div>
                {candidate.resume_url && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={openResumePreview}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View
                    </button>
                    <button
                      onClick={handleResumeDownload}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-semibold hover:-translate-y-0.5 transition-all duration-200 shadow-sm"
                    >
                      <Download className="w-3 h-3" />
                      Download
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Card 6 — Team Notes */}
          <div className={cn(card, "p-6")}>
            <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-slate-400" />
              Team Notes
            </h2>

            {notes.length === 0 && (
              <p className="text-sm text-slate-400 italic mb-4">
                No notes yet. Add the first one below.
              </p>
            )}

            <div className="space-y-3 mb-4">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="p-3 bg-slate-50 rounded-lg border border-slate-100"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-semibold text-slate-700">
                      {note.author?.full_name ?? "You"}
                    </span>
                    <div className="flex items-center gap-2">
                      {note.is_private && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">
                          <Lock className="w-2.5 h-2.5" /> Private
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400">
                        {fmtDate(note.created_at)}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600">{note.body}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-100">
              <textarea
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                placeholder="Add a note about this candidate..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setNotePrivate(!notePrivate)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                    notePrivate
                      ? "bg-slate-800 text-white border-slate-800"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  )}
                >
                  {notePrivate ? (
                    <Lock className="w-3 h-3" />
                  ) : (
                    <Globe className="w-3 h-3" />
                  )}
                  {notePrivate ? "Private Note" : "Public Comment"}
                </button>
                <button
                  onClick={handleAddNote}
                  disabled={!noteBody.trim() || noteLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-semibold disabled:opacity-50 hover:-translate-y-0.5 transition-all duration-200 shadow-sm"
                >
                  {noteLoading ? "Posting…" : "Post Note"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT SIDEBAR ─────────────────────────────────────────────── */}
        <div className="w-full lg:w-[300px] shrink-0 space-y-5 lg:sticky lg:top-6">

          {/* Action Card */}
          <div className={cn(card, "p-5")}>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
              Actions
            </p>

            {primaryAction && (
              <button
                onClick={primaryAction.action}
                disabled={primaryAction.disabled || actionLoading}
                className="w-full mb-3 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-all duration-200 shadow-md disabled:opacity-50 disabled:translate-y-0"
              >
                {primaryAction.icon}
                {primaryAction.label}
              </button>
            )}

            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="w-full mb-2 py-2 px-4 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <span>Move to Stage</span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="start"
                  sideOffset={4}
                  className="w-56 bg-white rounded-xl shadow-xl border border-slate-100 p-1 z-50 animate-in fade-in-0 zoom-in-95 duration-150"
                >
                  {PIPELINE_STAGES.filter(
                    (s) => s !== stage && s !== "rejected" && s !== "hired"
                  ).map((s) => (
                    <DropdownMenu.Item
                      key={s}
                      onSelect={() => handleStageChange(s)}
                      className="px-3 py-2 rounded-lg text-sm text-slate-700 cursor-pointer hover:bg-indigo-50 hover:text-indigo-700 outline-none"
                    >
                      {STAGE_LABELS[s]}
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>

            <button
              onClick={() => handleStageChange("hired")}
              disabled={stage === "hired" || actionLoading}
              className="w-full mb-2 py-2 px-4 rounded-xl border border-emerald-200 text-sm font-medium text-emerald-700 flex items-center justify-center hover:bg-emerald-50 transition-colors disabled:opacity-40"
            >
              Mark as Hired
            </button>

            <button
              onClick={() => handleStageChange("rejected")}
              disabled={stage === "rejected" || actionLoading}
              className="w-full py-2 px-4 rounded-xl border border-red-200 text-sm font-medium text-red-600 flex items-center justify-center hover:bg-red-50 transition-colors disabled:opacity-40"
            >
              Reject Candidate
            </button>
          </div>

          {/* Interview Status */}
          <div className={cn(card, "p-5")}>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
              Interview Status
            </p>

            {interview ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {interview.mode === "voice"
                      ? "🎙️"
                      : interview.mode === "video"
                      ? "🎥"
                      : "💬"}
                  </span>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                      Mode
                    </p>
                    <p className="text-sm font-semibold text-slate-800 capitalize">
                      {interview.mode ?? "Text"}
                    </p>
                  </div>
                </div>
                <div className="pt-3 space-y-2.5 border-t border-slate-100">
                  <StatusRow
                    label="Status"
                    value={
                      ivStatus === "invited"
                        ? "Invited"
                        : ivStatus === "started"
                        ? "In Progress"
                        : ivStatus === "completed"
                        ? "Completed"
                        : "Pending"
                    }
                  />
                  {interview.invited_at && (
                    <StatusRow
                      label="Invited on"
                      value={fmtDate(interview.invited_at)}
                    />
                  )}
                  {interview.started_at && (
                    <StatusRow
                      label="Started on"
                      value={fmtDate(interview.started_at)}
                    />
                  )}
                  {interview.completed_at && (
                    <StatusRow
                      label="Completed on"
                      value={fmtDate(interview.completed_at)}
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-slate-400">No interview scheduled</p>
                <p className="text-xs text-slate-300 mt-1">
                  Send an invite to get started
                </p>
              </div>
            )}
          </div>

          {/* Activity Log */}
          <div className={cn(card, "p-5")}>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
              Activity Log
            </p>
            <div className="space-y-3">
              {activityEvents.map((ev, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-slate-700">
                      {ev.label}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {fmtDatetime(ev.date)}
                    </p>
                  </div>
                </div>
              ))}
              {activityEvents.length === 0 && (
                <p className="text-xs text-slate-400">No activity yet</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Resume Preview Drawer ── */}
      {previewOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          onClick={() => setPreviewOpen(false)}
        />
      )}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-[680px] max-w-[90vw] bg-white shadow-2xl flex flex-col",
          "transform transition-transform duration-300 ease-in-out",
          previewOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Drawer header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-4 shrink-0">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0 bg-red-50 text-red-500">
            <FileText className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">
              {candidate.resume_filename}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Resume Preview</p>
          </div>
          {previewUrl && (
            <button
              onClick={async () => {
                const res = await fetch(previewUrl);
                const blob = await res.blob();
                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = blobUrl;
                a.download = candidate.resume_filename ?? "resume";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(blobUrl);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors flex-shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
          )}
          <button
            onClick={() => setPreviewOpen(false)}
            className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer body */}
        <div className="flex-1 overflow-hidden">
          {previewLoading && (
            <div className="flex items-center justify-center h-full gap-3 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-sm">Loading preview…</span>
            </div>
          )}
          {!previewLoading && candidate.resume_filename?.toLowerCase().endsWith(".pdf") && previewUrl && (
            <iframe src={previewUrl} className="w-full h-full border-none" title="Resume Preview" />
          )}
          {!previewLoading && !candidate.resume_filename?.toLowerCase().endsWith(".pdf") && previewUrl && (
            <div className="flex flex-col items-center justify-center h-full gap-4 px-6">
              <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center">
                <File className="w-10 h-10 text-blue-400" />
              </div>
              <div className="text-center">
                <p className="text-slate-700 font-semibold">DOCX files can&apos;t be previewed in browser</p>
                <p className="text-slate-400 text-sm mt-1">Download the file to view its contents</p>
              </div>
              <button
                onClick={async () => {
                  const res = await fetch(previewUrl);
                  const blob = await res.blob();
                  const blobUrl = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = blobUrl;
                  a.download = candidate.resume_filename ?? "resume";
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(blobUrl);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold shadow-[0_4px_14px_0_rgba(79,70,229,0.3)] hover:-translate-y-0.5 transition-all duration-200"
              >
                <Download className="w-4 h-4" />
                Download {candidate.resume_filename}
              </button>
            </div>
          )}
          {!previewLoading && !previewUrl && previewOpen && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
              <AlertCircle className="w-8 h-8" />
              <p className="text-sm">Preview not available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
