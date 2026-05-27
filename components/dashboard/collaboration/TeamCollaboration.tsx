"use client";

import { useState, useMemo, useEffect, useTransition, Fragment } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  UserCheck,
  MessageSquare,
  BarChart2,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  CheckCircle2,
  Clock,
  Circle,
  Lock,
  Send,
  Eye,
  AlertTriangle,
  Trash2,
  Star,
  XCircle,
  X,
  FileText,
  Mic,
} from "lucide-react";
import type {
  CollaborationCandidate,
  CollaborationJob,
  TeamMemberRow,
  CommentRow,
  ApprovalRow,
  InterviewHighlight,
} from "@/app/actions/collaboration";
import {
  addComment,
  deleteComment,
  upsertApproval,
  updateCandidateStage,
} from "@/app/actions/collaboration";

// ── Types ──────────────────────────────────────────────────────────────────────

type Tab = "comparison" | "approval" | "comments" | "alignment";
type SortKey =
  | "full_name"
  | "ai_score"
  | "skill_match"
  | "experience"
  | "communication"
  | "culture_fit"
  | "ai_recommendation"
  | "stage";
type ApprovalStatus = "done" | "pending" | "waiting" | "rejected";

interface ApprovalStage {
  label: string;
  status: ApprovalStatus;
  owner: string;
  approvedBy?: string;
  approvedAt?: string;
  rating?: number | null;
  comment?: string | null;
  recommendation?: string | null;
}

interface CandidateApproval {
  candidateId: string;
  stages: [ApprovalStage, ApprovalStage, ApprovalStage];
}

interface Reply {
  id: string;
  authorId: string;
  authorName: string | null;
  authorRole: string;
  text: string;
  timestamp: string;
}

interface Comment {
  id: string;
  authorId: string;
  authorName: string | null;
  authorRole: string;
  text: string;
  timestamp: string;
  isPrivate: boolean;
  replies: Reply[];
}

interface CandidateComments {
  candidateId: string;
  comments: Comment[];
}

interface CandidateSkills {
  skillMatch: number | null;
  experience: number | null;
  communication: number | null;
  cultureFit: number | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "bg-violet-500",
  "bg-indigo-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-teal-500",
  "bg-blue-500",
];

function avatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    " · " +
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  );
}

function scoreBarCls(v: number | null) {
  if (v === null) return "bg-slate-200";
  if (v >= 80) return "bg-emerald-500";
  if (v >= 60) return "bg-amber-400";
  return "bg-red-400";
}

function scoreTextCls(v: number | null) {
  if (v === null) return "text-slate-400";
  if (v >= 80) return "text-emerald-600";
  if (v >= 60) return "text-amber-600";
  return "text-red-500";
}

function recBadge(rec: string | null): { label: string; cls: string } {
  const map: Record<string, { label: string; cls: string }> = {
    strongly_recommend: { label: "Strong Hire", cls: "bg-emerald-100 text-emerald-700" },
    recommend: { label: "Hire", cls: "bg-indigo-100 text-indigo-700" },
    review_further: { label: "Review", cls: "bg-amber-100 text-amber-700" },
    do_not_recommend: { label: "No Hire", cls: "bg-red-100 text-red-700" },
  };
  return map[rec ?? ""] ?? { label: "Pending", cls: "bg-slate-100 text-slate-500" };
}

function stageLbl(stage: string) {
  const map: Record<string, string> = {
    recommended: "Recommended",
    completed: "Completed",
    interview_started: "Interviewing",
    invited: "Invited",
    applied: "Applied",
    new: "New",
  };
  return map[stage] ?? stage;
}

function stageCls(stage: string) {
  const map: Record<string, string> = {
    recommended: "bg-emerald-100 text-emerald-700",
    completed: "bg-indigo-100 text-indigo-700",
    interview_started: "bg-amber-100 text-amber-700",
    invited: "bg-blue-100 text-blue-700",
    applied: "bg-slate-100 text-slate-600",
    new: "bg-slate-100 text-slate-500",
  };
  return map[stage] ?? "bg-slate-100 text-slate-500";
}

function pickSkill(bd: Record<string, number> | null, ...keys: string[]): number | null {
  if (!bd) return null;
  for (const k of keys) if (bd[k] != null) return bd[k];
  return null;
}

function getCandidateSkills(c: CollaborationCandidate): CandidateSkills {
  // Prefer interview skill breakdown when available
  const bd = c.interview_skill_breakdown ?? c.ai_skill_breakdown;
  return {
    skillMatch: pickSkill(bd, "Technical Expertise", "Domain Knowledge"),
    experience: pickSkill(bd, "Domain Knowledge", "Leadership Potential"),
    communication: pickSkill(bd, "Communication"),
    cultureFit: pickSkill(bd, "Culture Alignment", "Culture Fit"),
  };
}

function effectiveScore(c: CollaborationCandidate): number | null {
  return c.interview_ai_score ?? c.ai_score;
}

function effectiveRecommendation(c: CollaborationCandidate): string | null {
  return c.interview_ai_recommendation ?? c.ai_recommendation;
}

// ── Data builders ──────────────────────────────────────────────────────────────

const STAGE_LABELS = ["HR Review", "Hiring Manager", "Dept. Head"];
const STAGE_OWNERS = ["HR Manager", "Hiring Manager", "Dept. Head"];

function buildCommentThreads(
  candidates: CollaborationCandidate[],
  rows: CommentRow[]
): CandidateComments[] {
  return candidates.map((c) => {
    const topLevel = rows.filter((r) => r.candidate_id === c.id && !r.parent_id);
    return {
      candidateId: c.id,
      comments: topLevel.map((cm) => ({
        id: cm.id,
        authorId: cm.author_id,
        authorName: cm.author_name,
        authorRole: cm.author_role,
        text: cm.body,
        timestamp: formatTimestamp(cm.created_at),
        isPrivate: cm.is_private,
        replies: rows
          .filter((r) => r.parent_id === cm.id)
          .map((r) => ({
            id: r.id,
            authorId: r.author_id,
            authorName: r.author_name,
            authorRole: r.author_role,
            text: r.body,
            timestamp: formatTimestamp(r.created_at),
          })),
      })),
    };
  });
}

function buildApprovals(
  candidates: CollaborationCandidate[],
  rows: ApprovalRow[]
): CandidateApproval[] {
  return candidates.map((c) => {
    const cRows = rows.filter((r) => r.candidate_id === c.id);

    const stages = [0, 1, 2].map((idx) => {
      const row = cRows.find((r) => r.stage_index === idx);
      if (row) {
        return {
          label: STAGE_LABELS[idx],
          status: row.status as ApprovalStatus,
          owner: STAGE_OWNERS[idx],
          approvedBy: row.approved_by_name ?? undefined,
          approvedAt: row.approved_at
            ? new Date(row.approved_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : undefined,
          rating: row.rating ?? null,
          comment: row.comment ?? null,
          recommendation: row.recommendation ?? null,
        };
      }
      // No DB row: HR Review starts as pending, subsequent stages wait
      const status: ApprovalStatus = idx === 0 ? "pending" : "waiting";
      return { label: STAGE_LABELS[idx], status, owner: STAGE_OWNERS[idx] };
    });

    return {
      candidateId: c.id,
      stages: stages as [ApprovalStage, ApprovalStage, ApprovalStage],
    };
  });
}

// ── Role-based approval permissions ───────────────────────────────────────────
// Phase 0 = HR Review, Phase 1 = Hiring Manager, Phase 2 = Dept. Head
const STAGE_ALLOWED_ROLES: Record<number, string[]> = {
  0: ["admin", "dept_head", "hiring_manager", "hr_manager", "interviewer"],
  1: ["admin", "dept_head", "hiring_manager"],
  2: ["admin", "dept_head"],
};

const ROLE_DISPLAY: Record<string, string> = {
  admin: "Admin",
  dept_head: "Department Head",
  hiring_manager: "Hiring Manager",
  hr_manager: "HR or Interviewer",
  interviewer: "HR or Interviewer",
};

function canActOnStage(role: string | null | undefined, stageIdx: number): boolean {
  if (!role) return false;
  return STAGE_ALLOWED_ROLES[stageIdx]?.includes(role) ?? false;
}

// Average human score from real approval ratings (1–5 stars → 0–100)
function avgHumanScore(stages: [ApprovalStage, ApprovalStage, ApprovalStage]): number | null {
  const rated = stages.filter((s) => s.status === "done" && s.rating != null);
  if (rated.length === 0) return null;
  const sum = rated.reduce((acc, s) => acc + (s.rating! * 20), 0);
  return Math.round(sum / rated.length);
}

// ── Primitive components ───────────────────────────────────────────────────────

function MiniBar({ value }: { value: number | null }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`text-xs font-semibold w-7 text-right tabular-nums ${scoreTextCls(value)}`}>
        {value ?? "—"}
      </span>
      <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${scoreBarCls(value)}`}
          style={{ width: value != null ? `${value}%` : "0%" }}
        />
      </div>
    </div>
  );
}

function SortTh({
  col,
  label,
  sortKey,
  sortDir,
  onSort,
}: {
  col: SortKey;
  label: string;
  sortKey: SortKey;
  sortDir: "asc" | "desc";
  onSort: (k: SortKey) => void;
}) {
  const active = sortKey === col;
  return (
    <th
      className="px-4 py-3 text-left text-xs font-semibold text-slate-500 cursor-pointer hover:text-indigo-600 select-none whitespace-nowrap"
      onClick={() => onSort(col)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active ? (
          sortDir === "asc" ? (
            <ChevronUp className="w-3 h-3 text-indigo-500" />
          ) : (
            <ChevronDown className="w-3 h-3 text-indigo-500" />
          )
        ) : (
          <ChevronsUpDown className="w-3 h-3 text-slate-300" />
        )}
      </span>
    </th>
  );
}

const STAR_LABELS = ["", "Poor", "Below Avg", "Average", "Good", "Excellent"];

function Stepper({
  stages,
  currentUserRole,
  interviewStatus,
  onAction,
}: {
  stages: [ApprovalStage, ApprovalStage, ApprovalStage];
  currentUserRole: string | null;
  interviewStatus: string | null;
  onAction: (idx: number, action: "approve" | "reject", rating: number, comment: string, recommendation: string) => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [hoverRating, setHoverRating] = useState(0);

  const pendingIdx = stages.findIndex((s) => s.status === "pending");
  const allDone = stages.every((s) => s.status === "done");
  const isRejected = stages.some((s) => s.status === "rejected");
  const interviewDone = interviewStatus === "completed";
  const canSubmit = rating > 0 && comment.trim().length > 0;

  useEffect(() => {
    setRating(0);
    setComment("");
    setRecommendation("");
    setHoverRating(0);
  }, [pendingIdx]);

  return (
    <div className="mt-4">
      {/* Stepper dots */}
      <div className="flex items-center">
        {stages.map((stage, idx) => (
          <Fragment key={stage.label}>
            {idx > 0 && (
              <div
                className={`flex-1 h-px ${
                  stages[idx - 1].status === "done" ? "bg-emerald-400" : "bg-slate-200"
                }`}
              />
            )}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                stage.status === "done"
                  ? "bg-emerald-100 text-emerald-600"
                  : stage.status === "pending"
                  ? "bg-indigo-100 text-indigo-600 ring-2 ring-indigo-200"
                  : stage.status === "rejected"
                  ? "bg-red-100 text-red-500"
                  : "bg-slate-100 text-slate-300"
              }`}
            >
              {stage.status === "done" ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : stage.status === "rejected" ? (
                <XCircle className="w-4 h-4" />
              ) : stage.status === "pending" ? (
                <Clock className="w-4 h-4" />
              ) : (
                <Circle className="w-4 h-4" />
              )}
            </div>
          </Fragment>
        ))}
      </div>

      {/* Stage labels */}
      <div className="flex justify-between mt-2">
        {stages.map((stage) => (
          <div key={stage.label} className="text-center" style={{ width: "33%" }}>
            <p className="text-[10px] font-semibold text-slate-600 leading-tight">{stage.label}</p>
            {stage.status === "done" && stage.approvedBy && (
              <p className="text-[9px] text-emerald-600 mt-0.5 leading-tight">{stage.approvedBy}</p>
            )}
            {stage.status === "done" && (stage.rating != null || stage.comment || stage.recommendation) && (
              <div className="relative group inline-block mt-1">
                <span className="cursor-pointer text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-500 hover:bg-indigo-100 transition-colors">
                  {stage.recommendation ? recBadge(stage.recommendation).label : "Reviewed"}
                </span>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-white border border-slate-200 rounded-xl shadow-lg p-3 z-50 hidden group-hover:block text-left">
                  <div className="space-y-2">
                    {stage.rating != null && (
                      <div>
                        <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Rating</p>
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${(stage.rating ?? 0) >= s ? "text-amber-400" : "text-slate-200"}`}
                              fill={(stage.rating ?? 0) >= s ? "currentColor" : "none"}
                            />
                          ))}
                          <span className="text-[9px] text-slate-500 ml-1">{STAR_LABELS[stage.rating ?? 0]}</span>
                        </div>
                      </div>
                    )}
                    {stage.recommendation && (
                      <div>
                        <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Recommendation</p>
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${recBadge(stage.recommendation).cls}`}>
                          {recBadge(stage.recommendation).label}
                        </span>
                      </div>
                    )}
                    {stage.comment && (
                      <div>
                        <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Comment</p>
                        <p className="text-[10px] text-slate-600 leading-relaxed line-clamp-4">{stage.comment}</p>
                      </div>
                    )}
                  </div>
                  {/* Arrow */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-200" />
                </div>
              </div>
            )}
            {stage.status === "pending" && (
              <p className="text-[9px] text-indigo-500 mt-0.5">Pending</p>
            )}
            {stage.status === "waiting" && (
              <p className="text-[9px] text-slate-300 mt-0.5">Waiting</p>
            )}
            {stage.status === "rejected" && (
              <p className="text-[9px] text-red-400 mt-0.5">Rejected</p>
            )}
          </div>
        ))}
      </div>

      {/* Review form for active pending stage */}
      {pendingIdx >= 0 && !interviewDone && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 bg-amber-50 rounded-xl px-3 py-3">
            <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <p className="text-xs text-amber-700">
              Approval is locked until the candidate completes their interview.
            </p>
          </div>
        </div>
      )}
      {pendingIdx >= 0 && interviewDone && !canActOnStage(currentUserRole, pendingIdx) && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-3">
            <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <p className="text-xs text-slate-500">
              Your role <span className="font-semibold text-slate-600">({ROLE_DISPLAY[currentUserRole ?? ""] ?? currentUserRole ?? "unknown"})</span> cannot review the{" "}
              <span className="font-semibold">{stages[pendingIdx].label}</span> stage.
            </p>
          </div>
        </div>
      )}
      {pendingIdx >= 0 && interviewDone && canActOnStage(currentUserRole, pendingIdx) && (
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
          <p className="text-xs font-semibold text-slate-700">
            {stages[pendingIdx].label} — Your Review
          </p>

          {/* Star rating */}
          <div>
            <p className="text-[10px] text-slate-400 mb-1.5">
              Rating <span className="text-red-400">*</span>
            </p>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                    (hoverRating || rating) >= star
                      ? "bg-amber-100 text-amber-500"
                      : "bg-slate-100 text-slate-300 hover:bg-amber-50"
                  }`}
                >
                  <Star
                    className="w-3.5 h-3.5"
                    fill={(hoverRating || rating) >= star ? "currentColor" : "none"}
                  />
                </button>
              ))}
              {(hoverRating || rating) > 0 && (
                <span className="ml-2 text-[10px] text-slate-500">
                  {STAR_LABELS[hoverRating || rating]}
                </span>
              )}
            </div>
          </div>

          {/* Recommendation */}
          <div>
            <p className="text-[10px] text-slate-400 mb-1.5">Recommendation</p>
            <select
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value)}
              className="w-full text-xs px-2.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white text-slate-600"
            >
              <option value="">— Select —</option>
              <option value="strongly_recommend">Strongly Recommend</option>
              <option value="recommend">Recommend</option>
              <option value="review_further">Review Further</option>
              <option value="do_not_recommend">Do Not Recommend</option>
            </select>
          </div>

          {/* Comment */}
          <div>
            <p className="text-[10px] text-slate-400 mb-1.5">
              Comment / Reason <span className="text-red-400">*</span>
            </p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add your notes or reason…"
              rows={2}
              className="w-full text-xs px-2.5 py-2 border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          {!canSubmit && (
            <p className="text-[10px] text-slate-400 text-center">
              Rating and comment are required to proceed.
            </p>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => onAction(pendingIdx, "approve", rating, comment, recommendation)}
              disabled={!canSubmit}
              className="flex-1 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Approve
            </button>
            <button
              onClick={() => onAction(pendingIdx, "reject", rating, comment, recommendation)}
              disabled={!canSubmit}
              className="px-4 py-1.5 bg-white border border-red-200 text-red-500 text-xs font-semibold rounded-lg hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Reject
            </button>
          </div>
        </div>
      )}

      {allDone && (
        <p className="mt-3 text-center text-xs text-emerald-600 font-semibold">
          All stages approved
        </p>
      )}
      {isRejected && !pendingIdx && (
        <p className="mt-3 text-center text-xs text-red-400 font-semibold">
          Rejected at {stages.find((s) => s.status === "rejected")?.label}
        </p>
      )}
    </div>
  );
}

// ── Comparison tab ─────────────────────────────────────────────────────────────

function ComparisonTab({
  candidates,
  selectedIds,
  comparingMode,
  sortKey,
  sortDir,
  onSort,
  onToggleSelect,
  onToggleCompare,
}: {
  candidates: CollaborationCandidate[];
  selectedIds: Set<string>;
  comparingMode: boolean;
  sortKey: SortKey;
  sortDir: "asc" | "desc";
  onSort: (k: SortKey) => void;
  onToggleSelect: (id: string) => void;
  onToggleCompare: () => void;
}) {
  const selected = candidates.filter((c) => selectedIds.has(c.id));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {candidates.length} candidate{candidates.length !== 1 ? "s" : ""} for this job
        </p>
        <button
          onClick={onToggleCompare}
          className={`px-4 py-2 text-sm font-semibold rounded-xl border transition-colors ${
            comparingMode
              ? "bg-indigo-600 text-white border-indigo-600"
              : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
          }`}
        >
          {comparingMode ? `Comparing ${selectedIds.size} selected` : "Compare Selected"}
        </button>
      </div>

      {comparingMode && selected.length >= 2 && (
        <div className="bg-white rounded-2xl border border-indigo-100 p-5 shadow-soft">
          <p className="text-sm font-bold text-slate-700 mb-5">Side-by-Side Comparison</p>
          <div
            className="grid gap-6"
            style={{ gridTemplateColumns: `repeat(${selected.length}, 1fr)` }}
          >
            {selected.map((c) => {
              const skills = getCandidateSkills(c);
              const rec = recBadge(effectiveRecommendation(c));
              const score = effectiveScore(c);
              return (
                <div key={c.id} className="flex flex-col gap-3">
                  <div>
                    <p className="font-bold text-slate-800 text-sm leading-tight">{c.full_name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{stageLbl(c.stage)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-3xl font-black tabular-nums ${scoreTextCls(score)}`}>
                      {score ?? "—"}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${rec.cls}`}>
                      {rec.label}
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { label: "Skill Match", val: skills.skillMatch },
                      { label: "Communication", val: skills.communication },
                      { label: "Culture Fit", val: skills.cultureFit },
                      { label: "Domain Knowledge", val: skills.experience },
                    ].map(({ label, val }) => (
                      <div key={label}>
                        <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                          <span>{label}</span>
                          <span className={scoreTextCls(val)}>{val ?? "—"}</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${scoreBarCls(val)}`}
                            style={{ width: val != null ? `${val}%` : "0%" }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <Link
                    href={`/candidates/${c.id}/report`}
                    className="mt-auto text-xs text-indigo-600 hover:underline inline-flex items-center gap-1 font-medium"
                  >
                    <Eye className="w-3 h-3" /> View Report
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {comparingMode && selected.length < 2 && (
        <div className="bg-indigo-50 rounded-xl px-4 py-3 text-sm text-indigo-600 text-center">
          Select 2–3 candidates below to compare side by side.
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {comparingMode && <th className="px-4 py-3 w-10" />}
                <SortTh col="full_name" label="Candidate" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <SortTh col="ai_score" label="Overall Score" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <SortTh col="skill_match" label="Skill Match" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <SortTh col="experience" label="Experience" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <SortTh col="communication" label="Communication" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <SortTh col="culture_fit" label="Culture Fit" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <SortTh col="ai_recommendation" label="Recommendation" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <SortTh col="stage" label="Status" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {candidates.map((c) => {
                const skills = getCandidateSkills(c);
                const rec = recBadge(effectiveRecommendation(c));
                const score = effectiveScore(c);
                const isSelected = selectedIds.has(c.id);
                return (
                  <tr
                    key={c.id}
                    className={`transition-colors ${
                      isSelected ? "bg-indigo-50/60" : "hover:bg-slate-50/50"
                    }`}
                  >
                    {comparingMode && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleSelect(c.id)}
                          disabled={!isSelected && selectedIds.size >= 3}
                          className="w-4 h-4 accent-indigo-600 cursor-pointer disabled:cursor-not-allowed"
                        />
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {initials(c.full_name)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{c.full_name}</p>
                          <p className="text-xs text-slate-400">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-lg font-black tabular-nums ${scoreTextCls(score)}`}>
                        {score ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3"><MiniBar value={skills.skillMatch} /></td>
                    <td className="px-4 py-3"><MiniBar value={skills.experience} /></td>
                    <td className="px-4 py-3"><MiniBar value={skills.communication} /></td>
                    <td className="px-4 py-3"><MiniBar value={skills.cultureFit} /></td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${rec.cls}`}>
                        {rec.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${stageCls(c.stage)}`}>
                        {stageLbl(c.stage)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/candidates/${c.id}/report`}
                        className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> Report
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {candidates.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-400 text-sm">
                    No candidates yet for this job.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Score drawer ───────────────────────────────────────────────────────────────

function DrawerSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-2.5">{title}</p>
      {children}
    </div>
  );
}

function ScoreDrawer({
  open,
  onClose,
  type,
  candidate,
}: {
  open: boolean;
  onClose: () => void;
  type: "resume" | "interview";
  candidate: CollaborationCandidate | null;
}) {
  if (!candidate) return null;

  const isInterview = type === "interview";
  const score = isInterview ? candidate.interview_ai_score : candidate.ai_score;
  const recommendation = isInterview ? candidate.interview_ai_recommendation : candidate.ai_recommendation;
  const breakdown = isInterview ? candidate.interview_skill_breakdown : candidate.ai_skill_breakdown;
  const summary = isInterview ? candidate.interview_ai_summary : candidate.ai_summary;
  const strengths = isInterview ? candidate.interview_ai_strengths : candidate.ai_strengths;
  const weaknesses = isInterview ? candidate.interview_ai_weaknesses : candidate.ai_weaknesses;
  const highlights: InterviewHighlight[] | null = isInterview ? candidate.interview_ai_highlights : null;
  const risks: string[] | null = isInterview ? candidate.interview_ai_risks : null;
  const title = isInterview ? "Interview Analysis" : "Resume Analysis";
  const Icon = isInterview ? Mic : FileText;
  const rec = recBadge(recommendation);

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-sm bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-800 text-sm leading-tight truncate">{candidate.full_name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {/* Overall score + recommendation */}
          <div className="bg-slate-50 rounded-2xl p-4">
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-3">Overall Score</p>
            <div className="flex items-center gap-4">
              <span className={`text-5xl font-black tabular-nums leading-none ${scoreTextCls(score)}`}>
                {score ?? "—"}
              </span>
              <div className="flex-1">
                <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${scoreBarCls(score)}`}
                    style={{ width: score != null ? `${score}%` : "0%" }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-xs text-slate-400">out of 100</p>
                  {recommendation && (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${rec.cls}`}>
                      {rec.label}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Overall Assessment / Summary */}
          {summary && (
            <DrawerSection title="Overall Assessment">
              <p className="text-sm text-slate-600 leading-relaxed">{summary}</p>
            </DrawerSection>
          )}

          {/* Skill breakdown */}
          {breakdown && Object.keys(breakdown).length > 0 && (
            <DrawerSection title="Skill Breakdown">
              <div className="space-y-3.5">
                {Object.entries(breakdown).map(([skill, val]) => (
                  <div key={skill}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm text-slate-600 font-medium">{skill}</span>
                      <span className={`text-sm font-black tabular-nums ${scoreTextCls(val)}`}>{val}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${scoreBarCls(val)}`} style={{ width: `${val}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </DrawerSection>
          )}

          {/* Strengths */}
          {strengths && strengths.length > 0 && (
            <DrawerSection title="Strengths">
              <ul className="space-y-2">
                {strengths.map((s, i) => (
                  <li key={i} className="flex gap-2.5 text-sm text-slate-600">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                    </span>
                    {s}
                  </li>
                ))}
              </ul>
            </DrawerSection>
          )}

          {/* Areas for Improvement / Development */}
          {weaknesses && weaknesses.length > 0 && (
            <DrawerSection title={isInterview ? "Areas for Development" : "Areas for Improvement"}>
              <ul className="space-y-2">
                {weaknesses.map((w, i) => (
                  <li key={i} className="flex gap-2.5 text-sm text-slate-600">
                    <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                      <AlertTriangle className="w-2.5 h-2.5" />
                    </span>
                    {w}
                  </li>
                ))}
              </ul>
            </DrawerSection>
          )}

          {/* Carl Assessment / Interview Highlights (interview only) */}
          {highlights && highlights.length > 0 && (
            <DrawerSection title="Carl's Assessment">
              <div className="space-y-3">
                {highlights.map((h, i) => (
                  <div key={i} className="border border-slate-100 rounded-xl p-3 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        h.tag === "Concern" ? "bg-red-100 text-red-600" :
                        h.tag === "Positive" ? "bg-emerald-100 text-emerald-600" :
                        "bg-slate-100 text-slate-500"
                      }`}>
                        {h.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 italic leading-relaxed">"{h.question}"</p>
                    <p className="text-xs text-slate-600 leading-relaxed">"{h.excerpt}"</p>
                  </div>
                ))}
              </div>
            </DrawerSection>
          )}

          {/* Risk Indicators (interview only) */}
          {risks && risks.length > 0 && (
            <DrawerSection title="Risk Indicators">
              <ul className="space-y-2">
                {risks.map((r, i) => (
                  <li key={i} className="flex gap-2.5 text-sm text-slate-600">
                    <span className="w-4 h-4 rounded-full bg-red-100 text-red-500 flex items-center justify-center shrink-0 mt-0.5">
                      <AlertTriangle className="w-2.5 h-2.5" />
                    </span>
                    {r}
                  </li>
                ))}
              </ul>
            </DrawerSection>
          )}

          {score == null && (!breakdown || Object.keys(breakdown).length === 0) && !summary && (
            <p className="text-sm text-slate-400 text-center py-10">No data available yet.</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 shrink-0">
          <Link
            href={isInterview ? `/candidates/${candidate.id}/report` : `/candidates/${candidate.id}`}
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-indigo-50 text-indigo-600 text-sm font-semibold rounded-xl hover:bg-indigo-100 transition-colors"
          >
            <Eye className="w-4 h-4" />
            {isInterview ? "View Full Intelligence Report" : "View Candidate Profile"}
          </Link>
        </div>
      </div>
    </>
  );
}

// ── Approval tab ───────────────────────────────────────────────────────────────

function ApprovalTab({
  candidates,
  approvals,
  currentUserRole,
  onAction,
}: {
  candidates: CollaborationCandidate[];
  approvals: CandidateApproval[];
  currentUserRole: string | null;
  onAction: (
    candidateId: string,
    stageIdx: number,
    action: "approve" | "reject",
    rating: number,
    comment: string,
    recommendation: string
  ) => void;
}) {
  const [drawer, setDrawer] = useState<{
    open: boolean;
    type: "resume" | "interview";
    candidate: CollaborationCandidate | null;
  }>({ open: false, type: "resume", candidate: null });

  function openDrawer(type: "resume" | "interview", candidate: CollaborationCandidate) {
    setDrawer({ open: true, type, candidate });
  }

  if (candidates.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 px-6 py-16 text-center text-slate-400 text-sm shadow-soft">
        No candidates found for this job.
      </div>
    );
  }

  return (
    <>
    <ScoreDrawer
      open={drawer.open}
      onClose={() => setDrawer((d) => ({ ...d, open: false }))}
      type={drawer.type}
      candidate={drawer.candidate}
    />
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {candidates.map((c) => {
        const approval = approvals.find((a) => a.candidateId === c.id);
        if (!approval) return null;
        const resumeScore = c.ai_score;
        const interviewScore = c.interview_ai_score;
        return (
          <div key={c.id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-soft">
            {/* Header */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                {initials(c.full_name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-800 text-sm leading-tight truncate">{c.full_name}</p>
                <p className="text-xs text-slate-400 mt-0.5 truncate">{c.email}</p>
              </div>
            </div>

            {/* Dual scores */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="bg-slate-50 rounded-xl px-3 py-2">
                <p className="text-[10px] text-slate-400 font-medium mb-0.5">Resume Score</p>
                <div className="flex items-end justify-between gap-1">
                  <div>
                    <span className={`text-lg font-black tabular-nums ${scoreTextCls(resumeScore)}`}>
                      {resumeScore ?? "—"}
                    </span>
                    {resumeScore != null && (
                      <span className="text-[10px] text-slate-400 ml-1">/100</span>
                    )}
                  </div>
                  <button
                    onClick={() => openDrawer("resume", c)}
                    className="text-[9px] font-semibold text-indigo-500 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 rounded-md transition-colors whitespace-nowrap"
                  >
                    Details
                  </button>
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl px-3 py-2">
                <p className="text-[10px] text-slate-400 font-medium mb-0.5">Interview Score</p>
                <div className="flex items-end justify-between gap-1">
                  <div>
                    <span className={`text-lg font-black tabular-nums ${scoreTextCls(interviewScore)}`}>
                      {interviewScore ?? "—"}
                    </span>
                    {interviewScore != null && (
                      <span className="text-[10px] text-slate-400 ml-1">/100</span>
                    )}
                  </div>
                  <button
                    onClick={() => openDrawer("interview", c)}
                    className="text-[9px] font-semibold text-indigo-500 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 rounded-md transition-colors whitespace-nowrap"
                  >
                    Details
                  </button>
                </div>
              </div>
            </div>

            <Stepper
              stages={approval.stages}
              currentUserRole={currentUserRole}
              interviewStatus={c.interview_status}
              onAction={(idx, action, rating, comment, recommendation) =>
                onAction(c.id, idx, action, rating, comment, recommendation)
              }
            />
          </div>
        );
      })}
    </div>
    </>
  );
}

// ── Comments tab ───────────────────────────────────────────────────────────────

function CommentsTab({
  candidates,
  commentThreads,
  selectedCandidateId,
  onSelectCandidate,
  commentText,
  onCommentTextChange,
  isPrivate,
  onTogglePrivate,
  onPost,
  replyTo,
  replyText,
  onReplyTextChange,
  onSetReplyTo,
  onPostReply,
  onDeleteComment,
  currentUserId,
  currentUser,
  isPending,
}: {
  candidates: CollaborationCandidate[];
  commentThreads: CandidateComments[];
  selectedCandidateId: string;
  onSelectCandidate: (id: string) => void;
  commentText: string;
  onCommentTextChange: (v: string) => void;
  isPrivate: boolean;
  onTogglePrivate: () => void;
  onPost: () => void;
  replyTo: string | null;
  replyText: string;
  onReplyTextChange: (v: string) => void;
  onSetReplyTo: (id: string | null) => void;
  onPostReply: (commentId: string) => void;
  onDeleteComment: (commentId: string) => void;
  currentUserId: string | null;
  currentUser: TeamMemberRow | null;
  isPending: boolean;
}) {
  const thread = commentThreads.find((t) => t.candidateId === selectedCandidateId);

  return (
    <div className="flex flex-col lg:flex-row gap-4" style={{ height: "calc(100vh - 296px)", minHeight: "480px" }}>
      {/* Candidate list */}
      <div className="w-full lg:w-60 shrink-0 bg-white rounded-2xl border border-slate-100 shadow-soft flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 shrink-0">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Candidates</p>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {candidates.map((c) => {
            const t = commentThreads.find((th) => th.candidateId === c.id);
            const count = t?.comments.length ?? 0;
            const active = c.id === selectedCandidateId;
            return (
              <button
                key={c.id}
                onClick={() => onSelectCandidate(c.id)}
                className={`w-full px-4 py-3 flex items-center justify-between text-left transition-colors ${
                  active ? "bg-indigo-50" : "hover:bg-slate-50"
                }`}
              >
                <div className="min-w-0">
                  <p className={`text-sm font-semibold truncate ${active ? "text-indigo-700" : "text-slate-700"}`}>
                    {c.full_name}
                  </p>
                  <p className={`text-xs mt-0.5 tabular-nums ${scoreTextCls(effectiveScore(c))}`}>
                    {effectiveScore(c) ?? "—"} pts
                  </p>
                </div>
                {count > 0 && (
                  <span className="ml-2 shrink-0 bg-indigo-100 text-indigo-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
          {candidates.length === 0 && (
            <p className="px-4 py-6 text-xs text-slate-400 text-center">No candidates</p>
          )}
        </div>
      </div>

      {/* Thread panel */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-100 shadow-soft overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 shrink-0">
          <p className="font-bold text-slate-800 text-sm">
            {candidates.find((c) => c.id === selectedCandidateId)?.full_name ?? "Select a candidate"}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {thread?.comments.length ?? 0} comment{thread?.comments.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          {!thread || thread.comments.length === 0 ? (
            <p className="text-center text-slate-300 text-sm py-16">
              No comments yet. Start the discussion below.
            </p>
          ) : (
            thread.comments.map((comment) => (
              <div key={comment.id}>
                <div className="flex gap-3">
                  <div
                    className={`w-8 h-8 rounded-full ${avatarColor(comment.authorId)} flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5`}
                  >
                    {initials(comment.authorName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-800">
                        {comment.authorName ?? "Team Member"}
                      </span>
                      <span className="text-xs text-slate-400">{comment.authorRole}</span>
                      {comment.isPrivate && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                          <Lock className="w-2.5 h-2.5" /> Private
                        </span>
                      )}
                      <span className="text-xs text-slate-300 ml-auto">{comment.timestamp}</span>
                      {comment.authorId === currentUserId && (
                        <button
                          onClick={() => onDeleteComment(comment.id)}
                          className="text-slate-300 hover:text-red-400 transition-colors"
                          title="Delete comment"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">{comment.text}</p>
                    <button
                      onClick={() => onSetReplyTo(replyTo === comment.id ? null : comment.id)}
                      className="text-xs text-indigo-500 hover:text-indigo-700 mt-1.5 font-medium"
                    >
                      Reply
                    </button>
                  </div>
                </div>

                {comment.replies.length > 0 && (
                  <div className="ml-11 mt-3 border-l-2 border-slate-100 pl-4 space-y-3">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="flex gap-2.5">
                        <div
                          className={`w-6 h-6 rounded-full ${avatarColor(reply.authorId)} flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5`}
                        >
                          {initials(reply.authorName)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-700">
                              {reply.authorName ?? "Team Member"}
                            </span>
                            <span className="text-xs text-slate-300">{reply.timestamp}</span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{reply.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {replyTo === comment.id && (
                  <div className="ml-11 mt-3 flex gap-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => onReplyTextChange(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && onPostReply(comment.id)}
                      placeholder={`Reply to ${comment.authorName ?? "Team Member"}…`}
                      className="flex-1 text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      autoFocus
                    />
                    <button
                      onClick={() => onPostReply(comment.id)}
                      className="px-3 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                    >
                      <Send className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="px-5 py-4 border-t border-slate-100 shrink-0">
          <div className="flex gap-3 items-start">
            <div
              className={`w-8 h-8 rounded-full ${avatarColor(currentUserId ?? "")} flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5`}
            >
              {initials(currentUser?.full_name ?? null)}
            </div>
            <div className="flex-1">
              <textarea
                value={commentText}
                onChange={(e) => onCommentTextChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onPost();
                }}
                placeholder="Add a comment… (Ctrl+Enter to post)"
                rows={2}
                disabled={isPending}
                className="w-full text-sm px-3 py-2.5 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-50"
              />
              <div className="flex items-center justify-between mt-2">
                <button
                  onClick={onTogglePrivate}
                  className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
                    isPrivate ? "bg-amber-100 text-amber-700" : "text-slate-400 hover:bg-slate-100"
                  }`}
                >
                  <Lock className="w-3 h-3" />
                  {isPrivate ? "Private Note" : "Make Private"}
                </button>
                <button
                  onClick={onPost}
                  disabled={!commentText.trim() || isPending}
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors font-semibold"
                >
                  <Send className="w-3 h-3" /> {isPending ? "Posting…" : "Post"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Score alignment tab ────────────────────────────────────────────────────────

function AlignmentTab({
  candidates,
  approvals,
}: {
  candidates: CollaborationCandidate[];
  approvals: CandidateApproval[];
}) {
  const rows = candidates
    .filter((c) => effectiveScore(c) !== null)
    .map((c) => {
      const aiScore = effectiveScore(c)!;
      const approval = approvals.find((a) => a.candidateId === c.id);
      const humanAvg = approval ? avgHumanScore(approval.stages) : null;
      const divergence = humanAvg != null ? humanAvg - aiScore : null;
      const isDiverged = divergence != null && Math.abs(divergence) >= 8;
      return { c, aiScore, humanAvg, divergence, isDiverged };
    })
    .sort((a, b) => Math.abs(b.divergence ?? 0) - Math.abs(a.divergence ?? 0));

  const hasAnyReviews = rows.some((r) => r.humanAvg != null);

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 bg-amber-50 rounded-xl px-4 py-3 border border-amber-100">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-700">
          Rows highlighted in amber show significant divergence (±8+ points) between Carl&apos;s AI
          score and the average reviewer rating. Avg Human Score is derived from approval stage
          ratings (1–5 stars → 0–100).
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-soft overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">Candidate</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">AI Score (Carl)</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">Avg Reviewer Score</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">Divergence</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.map(({ c, aiScore, humanAvg, divergence, isDiverged }) => (
              <tr key={c.id} className={isDiverged ? "bg-amber-50/70" : "hover:bg-slate-50/50"}>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {initials(c.full_name)}
                    </div>
                    <span className="text-sm font-semibold text-slate-800">{c.full_name}</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <span className={`text-base font-black tabular-nums ${scoreTextCls(aiScore)}`}>{aiScore}</span>
                    <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${scoreBarCls(aiScore)}`} style={{ width: `${aiScore}%` }} />
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  {humanAvg != null ? (
                    <div className="flex items-center gap-2">
                      <span className={`text-base font-black tabular-nums ${scoreTextCls(humanAvg)}`}>{humanAvg}</span>
                      <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${scoreBarCls(humanAvg)}`} style={{ width: `${humanAvg}%` }} />
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">No reviews yet</span>
                  )}
                </td>
                <td className="px-5 py-4">
                  {divergence != null ? (
                    <span className={`text-sm font-bold tabular-nums ${divergence > 0 ? "text-emerald-600" : divergence < 0 ? "text-red-500" : "text-slate-400"}`}>
                      {divergence > 0 ? "+" : ""}{divergence} pts
                    </span>
                  ) : (
                    <span className="text-xs text-slate-300">—</span>
                  )}
                </td>
                <td className="px-5 py-4">
                  {humanAvg == null ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-400">
                      Pending
                    </span>
                  ) : isDiverged ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                      <AlertTriangle className="w-3 h-3" /> Diverged
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                      <CheckCircle2 className="w-3 h-3" /> Aligned
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-slate-300 text-sm">
                  No scored candidates yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Tabs config ────────────────────────────────────────────────────────────────

const TABS: Array<{ id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "approval", label: "Approval Workflow", icon: UserCheck },
  { id: "comments", label: "Team Comments", icon: MessageSquare },
  { id: "comparison", label: "Candidate Comparison", icon: Users },
  { id: "alignment", label: "Score Alignment", icon: BarChart2 },
];

// ── Main export ────────────────────────────────────────────────────────────────

export default function TeamCollaboration({
  job,
  jobId,
  candidates,
  teamMembers,
  comments: initialComments,
  approvals: initialApprovals,
  currentUserId,
}: {
  job: CollaborationJob;
  jobId: string;
  candidates: CollaborationCandidate[];
  teamMembers: TeamMemberRow[];
  comments: CommentRow[];
  approvals: ApprovalRow[];
  currentUserId: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<Tab>("approval");
  const [sortKey, setSortKey] = useState<SortKey>("ai_score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [comparingMode, setComparingMode] = useState(false);

  const [approvals, setApprovals] = useState<CandidateApproval[]>(() =>
    buildApprovals(candidates, initialApprovals)
  );
  const [commentThreads, setCommentThreads] = useState<CandidateComments[]>(() =>
    buildCommentThreads(candidates, initialComments)
  );
  const [selectedCommentCandidateId, setSelectedCommentCandidateId] = useState<string>(
    candidates[0]?.id ?? ""
  );
  const [commentText, setCommentText] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  // Sync when server re-fetches (after router.refresh())
  useEffect(() => {
    setApprovals(buildApprovals(candidates, initialApprovals));
  }, [candidates, initialApprovals]);

  useEffect(() => {
    setCommentThreads(buildCommentThreads(candidates, initialComments));
  }, [candidates, initialComments]);

  const currentUser = teamMembers.find((m) => m.id === currentUserId) ?? null;

  const sorted = useMemo(() => {
    return [...candidates].sort((a, b) => {
      const aSkills = getCandidateSkills(a);
      const bSkills = getCandidateSkills(b);
      let aVal: number | string;
      let bVal: number | string;

      switch (sortKey) {
        case "full_name":    aVal = a.full_name; bVal = b.full_name; break;
        case "ai_score":     aVal = effectiveScore(a) ?? -1; bVal = effectiveScore(b) ?? -1; break;
        case "skill_match":  aVal = aSkills.skillMatch ?? -1; bVal = bSkills.skillMatch ?? -1; break;
        case "experience":   aVal = aSkills.experience ?? -1; bVal = bSkills.experience ?? -1; break;
        case "communication":aVal = aSkills.communication ?? -1; bVal = bSkills.communication ?? -1; break;
        case "culture_fit":  aVal = aSkills.cultureFit ?? -1; bVal = bSkills.cultureFit ?? -1; break;
        case "ai_recommendation": aVal = effectiveRecommendation(a) ?? ""; bVal = effectiveRecommendation(b) ?? ""; break;
        case "stage":        aVal = a.stage; bVal = b.stage; break;
        default:             aVal = 0; bVal = 0;
      }

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
  }, [candidates, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 3) next.add(id);
      return next;
    });
  }

  function handleApprovalAction(
    candidateId: string,
    stageIdx: number,
    action: "approve" | "reject",
    rating: number,
    comment: string,
    recommendation: string
  ) {
    const newStatus = action === "approve" ? "done" : "rejected";

    setApprovals((prev) =>
      prev.map((a) => {
        if (a.candidateId !== candidateId) return a;
        const newStages = [...a.stages] as [ApprovalStage, ApprovalStage, ApprovalStage];
        newStages[stageIdx] = {
          ...newStages[stageIdx],
          status: newStatus as ApprovalStatus,
          approvedBy: action === "approve" ? (currentUser?.full_name ?? "Reviewer") : undefined,
          approvedAt: action === "approve"
            ? new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            : undefined,
          rating,
          comment,
          recommendation: recommendation || null,
        };
        if (action === "approve" && stageIdx + 1 < newStages.length) {
          newStages[stageIdx + 1] = { ...newStages[stageIdx + 1], status: "pending" };
        }
        return { ...a, stages: newStages };
      })
    );

    startTransition(async () => {
      await upsertApproval(jobId, candidateId, stageIdx, newStatus, rating, comment || null, recommendation || null);
      if (action === "approve" && stageIdx + 1 < 3) {
        await upsertApproval(jobId, candidateId, stageIdx + 1, "pending");
      }
      // Dept. Head approve → hired; any reject → rejected
      if (action === "approve" && stageIdx === 2) {
        await updateCandidateStage(candidateId, "hired");
      } else if (action === "reject") {
        await updateCandidateStage(candidateId, "rejected");
      }
      router.refresh();
    });
  }

  function postComment() {
    if (!commentText.trim() || !selectedCommentCandidateId) return;
    const text = commentText.trim();
    const newComment: Comment = {
      id: `temp-${Date.now()}`,
      authorId: currentUserId ?? "unknown",
      authorName: currentUser?.full_name ?? null,
      authorRole: currentUser?.role ?? "",
      text,
      timestamp: "Just now",
      isPrivate,
      replies: [],
    };
    setCommentThreads((prev) =>
      prev.map((t) =>
        t.candidateId === selectedCommentCandidateId
          ? { ...t, comments: [...t.comments, newComment] }
          : t
      )
    );
    setCommentText("");
    setIsPrivate(false);

    startTransition(async () => {
      await addComment(jobId, selectedCommentCandidateId, text, isPrivate, null);
      router.refresh();
    });
  }

  function postReply(commentId: string) {
    if (!replyText.trim()) return;
    const text = replyText.trim();
    const newReply: Reply = {
      id: `temp-${Date.now()}`,
      authorId: currentUserId ?? "unknown",
      authorName: currentUser?.full_name ?? null,
      authorRole: currentUser?.role ?? "",
      text,
      timestamp: "Just now",
    };
    setCommentThreads((prev) =>
      prev.map((t) =>
        t.candidateId === selectedCommentCandidateId
          ? {
              ...t,
              comments: t.comments.map((c) =>
                c.id === commentId ? { ...c, replies: [...c.replies, newReply] } : c
              ),
            }
          : t
      )
    );
    setReplyTo(null);
    setReplyText("");

    startTransition(async () => {
      await addComment(jobId, selectedCommentCandidateId, text, false, commentId);
      router.refresh();
    });
  }

  function handleDeleteComment(commentId: string) {
    setCommentThreads((prev) =>
      prev.map((t) => ({
        ...t,
        comments: t.comments
          .filter((c) => c.id !== commentId)
          .map((c) => ({ ...c, replies: c.replies.filter((r) => r.id !== commentId) })),
      }))
    );
    startTransition(async () => {
      await deleteComment(jobId, commentId);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Breadcrumb */}
      <div className="px-4 sm:px-6 py-3 bg-white border-b border-slate-100">
        <nav className="flex items-center gap-2 text-sm">
          <Link href="/collaboration" className="text-slate-500 hover:text-indigo-600 transition-colors">
            Collaboration
          </Link>
          <span className="text-slate-300">›</span>
          <span className="text-slate-700 font-medium">{job.title}</span>
          {job.department && (
            <>
              <span className="text-slate-300">·</span>
              <span className="text-slate-400">{job.department}</span>
            </>
          )}
        </nav>
      </div>

      {/* Page header */}
      <div className="px-4 sm:px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Hiring Team — {job.title}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {job.company}
            {job.department ? ` · ${job.department}` : ""} &middot; {candidates.length} candidate
            {candidates.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center">
          {teamMembers.map((tm, i) => (
            <div
              key={tm.id}
              title={`${tm.full_name ?? tm.email} · ${tm.role}`}
              className={`w-8 h-8 rounded-full ${avatarColor(tm.id)} flex items-center justify-center text-white text-xs font-bold ring-2 ring-white cursor-default`}
              style={{ marginLeft: i > 0 ? "-8px" : 0 }}
            >
              {initials(tm.full_name ?? tm.email)}
            </div>
          ))}
          <span className="ml-3 text-sm text-slate-500">{teamMembers.length} member{teamMembers.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-100 px-4 sm:px-6">
        <div className="flex">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 p-4 sm:p-6">
        {activeTab === "comparison" && (
          <ComparisonTab
            candidates={sorted}
            selectedIds={selectedIds}
            comparingMode={comparingMode}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={toggleSort}
            onToggleSelect={toggleSelect}
            onToggleCompare={() => {
              if (comparingMode) { setComparingMode(false); setSelectedIds(new Set()); }
              else setComparingMode(true);
            }}
          />
        )}
        {activeTab === "approval" && (
          <ApprovalTab
            candidates={candidates}
            approvals={approvals}
            currentUserRole={currentUser?.role ?? null}
            onAction={(cId, idx, action, rating, comment, rec) =>
              handleApprovalAction(cId, idx, action, rating, comment, rec)
            }
          />
        )}
        {activeTab === "comments" && (
          <CommentsTab
            candidates={candidates}
            commentThreads={commentThreads}
            selectedCandidateId={selectedCommentCandidateId}
            onSelectCandidate={setSelectedCommentCandidateId}
            commentText={commentText}
            onCommentTextChange={setCommentText}
            isPrivate={isPrivate}
            onTogglePrivate={() => setIsPrivate((p) => !p)}
            onPost={postComment}
            replyTo={replyTo}
            replyText={replyText}
            onReplyTextChange={setReplyText}
            onSetReplyTo={setReplyTo}
            onPostReply={postReply}
            onDeleteComment={handleDeleteComment}
            currentUserId={currentUserId}
            currentUser={currentUser}
            isPending={isPending}
          />
        )}
        {activeTab === "alignment" && <AlignmentTab candidates={candidates} approvals={approvals} />}
      </div>
    </div>
  );
}
