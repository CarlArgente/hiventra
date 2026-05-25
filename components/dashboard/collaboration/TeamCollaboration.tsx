"use client";

import { useState, useMemo, Fragment } from "react";
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
} from "lucide-react";
import type {
  CollaborationCandidate,
  CollaborationJob,
} from "@/app/actions/collaboration";

// ── Types ──────────────────────────────────────────────────────────────

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

interface TeamMember {
  id: string;
  name: string;
  role: string;
  initials: string;
  color: string;
}

type ApprovalStatus = "done" | "pending" | "waiting";

interface ApprovalStage {
  label: string;
  status: ApprovalStatus;
  owner: string;
  approvedBy?: string;
  approvedAt?: string;
}

interface CandidateApproval {
  candidateId: string;
  stages: [ApprovalStage, ApprovalStage, ApprovalStage];
}

interface Reply {
  id: string;
  authorId: string;
  text: string;
  timestamp: string;
}

interface Comment {
  id: string;
  authorId: string;
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

// ── Constants ──────────────────────────────────────────────────────────

const TEAM_MEMBERS: TeamMember[] = [
  { id: "tm1", name: "Sarah Chen", role: "HR Manager", initials: "SC", color: "bg-violet-500" },
  { id: "tm2", name: "Marcus Reid", role: "Hiring Manager", initials: "MR", color: "bg-indigo-500" },
  { id: "tm3", name: "Priya Nair", role: "Dept. Head", initials: "PN", color: "bg-emerald-500" },
  { id: "tm4", name: "Jake Torres", role: "Recruiter", initials: "JT", color: "bg-amber-500" },
];

// ── Helpers ────────────────────────────────────────────────────────────

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
  return {
    skillMatch: pickSkill(c.ai_skill_breakdown, "Technical Expertise", "Domain Knowledge"),
    experience: pickSkill(c.ai_skill_breakdown, "Domain Knowledge", "Leadership Potential"),
    communication: pickSkill(c.ai_skill_breakdown, "Communication"),
    cultureFit: pickSkill(c.ai_skill_breakdown, "Culture Alignment", "Culture Fit"),
  };
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

// ── Data initializers ──────────────────────────────────────────────────

function initApprovals(candidates: CollaborationCandidate[]): CandidateApproval[] {
  return candidates.map((c) => {
    const advanced = c.stage === "completed" || c.stage === "recommended";
    const recommended = c.stage === "recommended";
    return {
      candidateId: c.id,
      stages: [
        {
          label: "HR Review",
          status: advanced ? "done" : "pending",
          owner: "HR Manager",
          approvedBy: advanced ? "Sarah Chen" : undefined,
          approvedAt: advanced ? "May 20, 2026" : undefined,
        },
        {
          label: "Hiring Manager",
          status: recommended ? "done" : advanced ? "pending" : "waiting",
          owner: "Hiring Manager",
          approvedBy: recommended ? "Marcus Reid" : undefined,
          approvedAt: recommended ? "May 22, 2026" : undefined,
        },
        {
          label: "Dept. Head",
          status: "waiting",
          owner: "Dept. Head",
        },
      ] as [ApprovalStage, ApprovalStage, ApprovalStage],
    };
  });
}

function initComments(candidates: CollaborationCandidate[]): CandidateComments[] {
  return candidates.map((c, i) => ({
    candidateId: c.id,
    comments:
      i === 0
        ? [
            {
              id: "c1",
              authorId: "tm1",
              text: "Strong candidate — the distributed systems experience really stands out. Resume is well-structured.",
              timestamp: "May 19 · 10:32 AM",
              isPrivate: false,
              replies: [
                {
                  id: "r1",
                  authorId: "tm2",
                  text: "@Sarah agreed. Technical depth looks solid. Fast-tracking to the Hiring Manager round.",
                  timestamp: "May 19 · 11:05 AM",
                },
              ],
            },
            {
              id: "c2",
              authorId: "tm4",
              text: "Note: there's a 6-month gap in employment history (2023–2024). Flagging for follow-up.",
              timestamp: "May 20 · 2:15 PM",
              isPrivate: true,
              replies: [],
            },
          ]
        : [],
  }));
}

function initHumanScores(candidates: CollaborationCandidate[]): Record<string, number> {
  const out: Record<string, number> = {};
  candidates.forEach((c) => {
    if (c.ai_score !== null) {
      const delta = Math.floor(Math.random() * 19) - 9;
      out[c.id] = Math.max(0, Math.min(100, c.ai_score + delta));
    }
  });
  return out;
}

// ── Primitive components ───────────────────────────────────────────────

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

function Stepper({
  stages,
  onAction,
}: {
  stages: [ApprovalStage, ApprovalStage, ApprovalStage];
  onAction: (idx: number, action: "approve" | "request_review" | "reject") => void;
}) {
  const pendingIdx = stages.findIndex((s) => s.status === "pending");
  const allDone = stages.every((s) => s.status === "done");

  return (
    <div className="mt-4">
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
                  : "bg-slate-100 text-slate-300"
              }`}
            >
              {stage.status === "done" ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : stage.status === "pending" ? (
                <Clock className="w-4 h-4" />
              ) : (
                <Circle className="w-4 h-4" />
              )}
            </div>
          </Fragment>
        ))}
      </div>

      <div className="flex justify-between mt-2">
        {stages.map((stage) => (
          <div key={stage.label} className="text-center" style={{ width: "33%" }}>
            <p className="text-[10px] font-semibold text-slate-600 leading-tight">{stage.label}</p>
            {stage.status === "done" && stage.approvedBy && (
              <p className="text-[9px] text-emerald-600 mt-0.5 leading-tight">{stage.approvedBy}</p>
            )}
            {stage.status === "pending" && (
              <p className="text-[9px] text-indigo-500 mt-0.5">Pending</p>
            )}
            {stage.status === "waiting" && (
              <p className="text-[9px] text-slate-300 mt-0.5">Waiting</p>
            )}
          </div>
        ))}
      </div>

      {pendingIdx >= 0 && (
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => onAction(pendingIdx, "approve")}
            className="flex-1 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Approve
          </button>
          <button
            onClick={() => onAction(pendingIdx, "request_review")}
            className="flex-1 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
          >
            Request Review
          </button>
          <button
            onClick={() => onAction(pendingIdx, "reject")}
            className="px-3 py-1.5 bg-white border border-red-200 text-red-400 text-xs font-semibold rounded-lg hover:bg-red-50 transition-colors"
          >
            Reject
          </button>
        </div>
      )}
      {allDone && (
        <p className="mt-3 text-center text-xs text-emerald-600 font-semibold">All stages approved</p>
      )}
    </div>
  );
}

// ── Comparison tab ─────────────────────────────────────────────────────

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
              const rec = recBadge(c.ai_recommendation);
              return (
                <div key={c.id} className="flex flex-col gap-3">
                  <div>
                    <p className="font-bold text-slate-800 text-sm leading-tight">{c.full_name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{stageLbl(c.stage)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-3xl font-black tabular-nums ${scoreTextCls(c.ai_score)}`}>
                      {c.ai_score ?? "—"}
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
                    href={`/dashboard/candidates/${c.id}/report`}
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
                const rec = recBadge(c.ai_recommendation);
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
                      <span className={`text-lg font-black tabular-nums ${scoreTextCls(c.ai_score)}`}>
                        {c.ai_score ?? "—"}
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
                        href={`/dashboard/candidates/${c.id}/report`}
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
                  <td
                    colSpan={10}
                    className="px-4 py-12 text-center text-slate-400 text-sm"
                  >
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

// ── Approval tab ───────────────────────────────────────────────────────

function ApprovalTab({
  candidates,
  approvals,
  onAction,
}: {
  candidates: CollaborationCandidate[];
  approvals: CandidateApproval[];
  onAction: (
    candidateId: string,
    stageIdx: number,
    action: "approve" | "request_review" | "reject"
  ) => void;
}) {
  if (candidates.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 px-6 py-16 text-center text-slate-400 text-sm shadow-soft">
        No candidates found for this job.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {candidates.map((c) => {
        const approval = approvals.find((a) => a.candidateId === c.id);
        if (!approval) return null;
        const rec = recBadge(c.ai_recommendation);
        return (
          <div
            key={c.id}
            className="bg-white rounded-2xl border border-slate-100 p-5 shadow-soft"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {initials(c.full_name)}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 text-sm leading-tight truncate">
                    {c.full_name}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{c.email}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className={`text-xl font-black tabular-nums ${scoreTextCls(c.ai_score)}`}>
                  {c.ai_score ?? "—"}
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${rec.cls}`}>
                  {rec.label}
                </span>
              </div>
            </div>
            <Stepper
              stages={approval.stages}
              onAction={(idx, action) => onAction(c.id, idx, action)}
            />
          </div>
        );
      })}
    </div>
  );
}

// ── Comments tab ───────────────────────────────────────────────────────

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
}) {
  const thread = commentThreads.find((t) => t.candidateId === selectedCandidateId);

  function memberById(id: string) {
    return (
      TEAM_MEMBERS.find((m) => m.id === id) ?? {
        name: "Team Member",
        role: "",
        initials: "TM",
        color: "bg-slate-400",
      }
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4" style={{ height: "calc(100vh - 296px)", minHeight: "480px" }}>
      {/* Left: candidate list */}
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
                  <p className={`text-xs mt-0.5 tabular-nums ${scoreTextCls(c.ai_score)}`}>
                    {c.ai_score ?? "—"} pts
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

      {/* Right: thread */}
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
            thread.comments.map((comment) => {
              const author = memberById(comment.authorId);
              return (
                <div key={comment.id}>
                  <div className="flex gap-3">
                    <div
                      className={`w-8 h-8 rounded-full ${author.color} flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5`}
                    >
                      {author.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-800">{author.name}</span>
                        <span className="text-xs text-slate-400">{author.role}</span>
                        {comment.isPrivate && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                            <Lock className="w-2.5 h-2.5" /> Private
                          </span>
                        )}
                        <span className="text-xs text-slate-300 ml-auto">{comment.timestamp}</span>
                      </div>
                      <p className="text-sm text-slate-600 mt-1 leading-relaxed">{comment.text}</p>
                      <button
                        onClick={() =>
                          onSetReplyTo(replyTo === comment.id ? null : comment.id)
                        }
                        className="text-xs text-indigo-500 hover:text-indigo-700 mt-1.5 font-medium"
                      >
                        Reply
                      </button>
                    </div>
                  </div>

                  {comment.replies.length > 0 && (
                    <div className="ml-11 mt-3 border-l-2 border-slate-100 pl-4 space-y-3">
                      {comment.replies.map((reply) => {
                        const rAuthor = memberById(reply.authorId);
                        return (
                          <div key={reply.id} className="flex gap-2.5">
                            <div
                              className={`w-6 h-6 rounded-full ${rAuthor.color} flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5`}
                            >
                              {rAuthor.initials}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-700">
                                  {rAuthor.name}
                                </span>
                                <span className="text-xs text-slate-300">{reply.timestamp}</span>
                              </div>
                              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                                {reply.text}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {replyTo === comment.id && (
                    <div className="ml-11 mt-3 flex gap-2">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => onReplyTextChange(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && onPostReply(comment.id)}
                        placeholder={`Reply to ${memberById(comment.authorId).name}…`}
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
              );
            })
          )}
        </div>

        <div className="px-5 py-4 border-t border-slate-100 shrink-0">
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">
              JT
            </div>
            <div className="flex-1">
              <textarea
                value={commentText}
                onChange={(e) => onCommentTextChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onPost();
                }}
                placeholder="Add a comment… (use @name to mention)"
                rows={2}
                className="w-full text-sm px-3 py-2.5 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <div className="flex items-center justify-between mt-2">
                <button
                  onClick={onTogglePrivate}
                  className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
                    isPrivate
                      ? "bg-amber-100 text-amber-700"
                      : "text-slate-400 hover:bg-slate-100"
                  }`}
                >
                  <Lock className="w-3 h-3" />
                  {isPrivate ? "Private Note" : "Make Private"}
                </button>
                <button
                  onClick={onPost}
                  disabled={!commentText.trim()}
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors font-semibold"
                >
                  <Send className="w-3 h-3" /> Post
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Score alignment tab ────────────────────────────────────────────────

function AlignmentTab({
  candidates,
  humanScores,
}: {
  candidates: CollaborationCandidate[];
  humanScores: Record<string, number>;
}) {
  const rows = candidates
    .filter((c) => c.ai_score !== null)
    .map((c) => {
      const aiScore = c.ai_score!;
      const humanAvg = humanScores[c.id] ?? aiScore;
      const divergence = humanAvg - aiScore;
      const isDiverged = Math.abs(divergence) >= 8;
      return { c, aiScore, humanAvg, divergence, isDiverged };
    })
    .sort((a, b) => Math.abs(b.divergence) - Math.abs(a.divergence));

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 bg-amber-50 rounded-xl px-4 py-3 border border-amber-100">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-700">
          Rows highlighted in amber show significant divergence (±8+ points) between Carl&apos;s AI
          score and the average human reviewer score. Consider reviewing the Intelligence Report for
          those candidates.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-soft overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">Candidate</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">AI Score (Carl)</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">Avg Human Score</th>
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
                    <span className={`text-base font-black tabular-nums ${scoreTextCls(aiScore)}`}>
                      {aiScore}
                    </span>
                    <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${scoreBarCls(aiScore)}`}
                        style={{ width: `${aiScore}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <span className={`text-base font-black tabular-nums ${scoreTextCls(humanAvg)}`}>
                      {humanAvg}
                    </span>
                    <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${scoreBarCls(humanAvg)}`}
                        style={{ width: `${humanAvg}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`text-sm font-bold tabular-nums ${
                      divergence > 0
                        ? "text-emerald-600"
                        : divergence < 0
                        ? "text-red-500"
                        : "text-slate-400"
                    }`}
                  >
                    {divergence > 0 ? "+" : ""}
                    {divergence} pts
                  </span>
                </td>
                <td className="px-5 py-4">
                  {isDiverged ? (
                    <span
                      title={`Carl scored ${aiScore}, reviewers averaged ${humanAvg}. Consider reviewing the Intelligence Report.`}
                      className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 cursor-help"
                    >
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

// ── Main export ────────────────────────────────────────────────────────

const TABS: Array<{ id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "comparison", label: "Candidate Comparison", icon: Users },
  { id: "approval", label: "Approval Workflow", icon: UserCheck },
  { id: "comments", label: "Team Comments", icon: MessageSquare },
  { id: "alignment", label: "Score Alignment", icon: BarChart2 },
];

export default function TeamCollaboration({
  job,
  candidates,
}: {
  job: CollaborationJob;
  candidates: CollaborationCandidate[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>("comparison");
  const [sortKey, setSortKey] = useState<SortKey>("ai_score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [comparingMode, setComparingMode] = useState(false);

  const [approvals, setApprovals] = useState<CandidateApproval[]>(() =>
    initApprovals(candidates)
  );
  const [commentThreads, setCommentThreads] = useState<CandidateComments[]>(() =>
    initComments(candidates)
  );
  const [selectedCommentCandidateId, setSelectedCommentCandidateId] = useState<string>(
    candidates[0]?.id ?? ""
  );
  const [commentText, setCommentText] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const humanScores = useMemo(() => initHumanScores(candidates), [candidates]);

  const sorted = useMemo(() => {
    return [...candidates].sort((a, b) => {
      const aSkills = getCandidateSkills(a);
      const bSkills = getCandidateSkills(b);

      let aVal: number | string;
      let bVal: number | string;

      switch (sortKey) {
        case "full_name":
          aVal = a.full_name;
          bVal = b.full_name;
          break;
        case "ai_score":
          aVal = a.ai_score ?? -1;
          bVal = b.ai_score ?? -1;
          break;
        case "skill_match":
          aVal = aSkills.skillMatch ?? -1;
          bVal = bSkills.skillMatch ?? -1;
          break;
        case "experience":
          aVal = aSkills.experience ?? -1;
          bVal = bSkills.experience ?? -1;
          break;
        case "communication":
          aVal = aSkills.communication ?? -1;
          bVal = bSkills.communication ?? -1;
          break;
        case "culture_fit":
          aVal = aSkills.cultureFit ?? -1;
          bVal = bSkills.cultureFit ?? -1;
          break;
        case "ai_recommendation":
          aVal = a.ai_recommendation ?? "";
          bVal = b.ai_recommendation ?? "";
          break;
        case "stage":
          aVal = a.stage;
          bVal = b.stage;
          break;
        default:
          aVal = 0;
          bVal = 0;
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
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
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
    action: "approve" | "request_review" | "reject"
  ) {
    if (action !== "approve") return;
    setApprovals((prev) =>
      prev.map((a) => {
        if (a.candidateId !== candidateId) return a;
        const newStages = [...a.stages] as [ApprovalStage, ApprovalStage, ApprovalStage];
        newStages[stageIdx] = {
          ...newStages[stageIdx],
          status: "done",
          approvedBy: TEAM_MEMBERS[stageIdx]?.name ?? "Reviewer",
          approvedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        };
        if (stageIdx + 1 < newStages.length) {
          newStages[stageIdx + 1] = { ...newStages[stageIdx + 1], status: "pending" };
        }
        return { ...a, stages: newStages };
      })
    );
  }

  function postComment() {
    if (!commentText.trim() || !selectedCommentCandidateId) return;
    const newComment: Comment = {
      id: `c${Date.now()}`,
      authorId: "tm4",
      text: commentText.trim(),
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
  }

  function postReply(commentId: string) {
    if (!replyText.trim()) return;
    const newReply: Reply = {
      id: `r${Date.now()}`,
      authorId: "tm4",
      text: replyText.trim(),
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
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Breadcrumb */}
      <div className="px-4 sm:px-6 py-3 bg-white border-b border-slate-100">
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/dashboard/collaboration"
            className="text-slate-500 hover:text-indigo-600 transition-colors"
          >
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
          <h1 className="text-xl font-bold text-slate-800">
            Hiring Team — {job.title}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {job.company}
            {job.department ? ` · ${job.department}` : ""} &middot; {candidates.length} candidate
            {candidates.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center">
          {TEAM_MEMBERS.map((tm, i) => (
            <div
              key={tm.id}
              title={`${tm.name} · ${tm.role}`}
              className={`w-8 h-8 rounded-full ${tm.color} flex items-center justify-center text-white text-xs font-bold ring-2 ring-white cursor-default`}
              style={{ marginLeft: i > 0 ? "-8px" : 0 }}
            >
              {tm.initials}
            </div>
          ))}
          <span className="ml-3 text-sm text-slate-500">{TEAM_MEMBERS.length} members</span>
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
              if (comparingMode) {
                setComparingMode(false);
                setSelectedIds(new Set());
              } else {
                setComparingMode(true);
              }
            }}
          />
        )}
        {activeTab === "approval" && (
          <ApprovalTab
            candidates={candidates}
            approvals={approvals}
            onAction={handleApprovalAction}
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
          />
        )}
        {activeTab === "alignment" && (
          <AlignmentTab candidates={candidates} humanScores={humanScores} />
        )}
      </div>
    </div>
  );
}
