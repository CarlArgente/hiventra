"use client";

import { useState } from "react";
import {
  ChevronUp,
  ChevronDown,
  ExternalLink,
  MoreVertical,
  MoveRight,
  UserX,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";
import {
  PipelineCandidate,
  PipelineStage,
  PIPELINE_STAGES,
  STAGE_LABELS,
} from "./pipeline-types";

type SortKey = "full_name" | "ai_score" | "ai_recommendation" | "stage" | "interview_mode" | "updated_at";
type SortDir = "asc" | "desc";

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function avatarColor(name: string) {
  const colors = [
    "bg-indigo-500", "bg-violet-500", "bg-emerald-500", "bg-amber-500",
    "bg-rose-500", "bg-cyan-500", "bg-orange-500", "bg-teal-500",
  ];
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % colors.length;
  return colors[h];
}

function scoreColorClass(score: number) {
  if (score >= 80) return "bg-emerald-100 text-emerald-700";
  if (score >= 60) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-600";
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
    strongly_recommend: "bg-emerald-100 text-emerald-700",
    recommend: "bg-teal-100 text-teal-700",
    review_further: "bg-amber-100 text-amber-700",
    not_recommend: "bg-red-100 text-red-600",
  };
  return map[r] ?? "bg-slate-100 text-slate-600";
}

function modeIcon(mode: string) {
  return mode === "voice" ? "🎙️" : mode === "video" ? "🎥" : "💬";
}

// ── Component ─────────────────────────────────────────────────────────────────

interface ListViewProps {
  candidates: PipelineCandidate[];
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onStageChange: (id: string, stage: PipelineStage) => void;
}

export default function ListView({
  candidates,
  selected,
  onToggleSelect,
  onToggleSelectAll,
  onStageChange,
}: ListViewProps) {
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({
    key: "updated_at",
    dir: "desc",
  });

  function toggleSort(key: SortKey) {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );
  }

  const sorted = [...candidates].sort((a, b) => {
    const dir = sort.dir === "asc" ? 1 : -1;
    const va = (a as unknown as Record<string, unknown>)[sort.key] ?? "";
    const vb = (b as unknown as Record<string, unknown>)[sort.key] ?? "";
    if (va < vb) return -dir;
    if (va > vb) return dir;
    return 0;
  });

  function SortIndicator({ col }: { col: SortKey }) {
    if (sort.key !== col) return <ChevronUp className="w-3 h-3 text-slate-300" />;
    return sort.dir === "asc"
      ? <ChevronUp className="w-3 h-3 text-indigo-500" />
      : <ChevronDown className="w-3 h-3 text-indigo-500" />;
  }

  function Th({ col, label, className }: { col: SortKey; label: string; className?: string }) {
    return (
      <th
        onClick={() => toggleSort(col)}
        className={cn(
          "px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer select-none hover:text-slate-700 whitespace-nowrap",
          className
        )}
      >
        <span className="inline-flex items-center gap-1">
          {label}
          <SortIndicator col={col} />
        </span>
      </th>
    );
  }

  const allSelected = candidates.length > 0 && selected.size === candidates.length;

  return (
    <div className="p-4 sm:p-6 h-full overflow-auto">
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleSelectAll}
                  className="accent-indigo-600 cursor-pointer"
                />
              </th>
              <Th col="full_name" label="Candidate" />
              <Th col="ai_score" label="AI Score" />
              <Th col="ai_recommendation" label="Recommendation" />
              <Th col="stage" label="Stage" />
              <Th col="interview_mode" label="Mode" />
              <Th col="updated_at" label="Last Activity" />
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sorted.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-16 text-center text-slate-400 text-sm">
                  No candidates found
                </td>
              </tr>
            )}
            {sorted.map((c) => (
              <tr
                key={c.id}
                onClick={() => (window.location.href = `/candidates/${c.id}`)}
                className={cn(
                  "hover:bg-slate-50/80 cursor-pointer transition-colors",
                  selected.has(c.id) && "bg-indigo-50/40"
                )}
              >
                {/* Checkbox */}
                <td
                  className="px-4 py-3"
                  onClick={(e) => { e.stopPropagation(); onToggleSelect(c.id); }}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(c.id)}
                    onChange={() => onToggleSelect(c.id)}
                    className="accent-indigo-600 cursor-pointer"
                  />
                </td>

                {/* Candidate */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0",
                      avatarColor(c.full_name)
                    )}>
                      {initials(c.full_name)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 leading-tight">{c.full_name}</p>
                      <p className="text-xs text-slate-400">{c.email}</p>
                    </div>
                  </div>
                </td>

                {/* Score */}
                <td className="px-4 py-3">
                  {c.ai_score !== null ? (
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold",
                      scoreColorClass(c.ai_score)
                    )}>
                      {c.ai_score}/100
                    </span>
                  ) : <span className="text-slate-300 text-xs">—</span>}
                </td>

                {/* Recommendation */}
                <td className="px-4 py-3">
                  {c.ai_recommendation ? (
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap",
                      recommendationClass(c.ai_recommendation)
                    )}>
                      {recommendationLabel(c.ai_recommendation)}
                    </span>
                  ) : <span className="text-slate-300 text-xs">—</span>}
                </td>

                {/* Stage */}
                <td className="px-4 py-3">
                  <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                    {STAGE_LABELS[c.stage]}
                  </span>
                </td>

                {/* Interview mode */}
                <td className="px-4 py-3">
                  <span className="text-base">
                    {c.interview_mode ? modeIcon(c.interview_mode) : <span className="text-slate-300 text-xs">—</span>}
                  </span>
                </td>

                {/* Last activity */}
                <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                  {new Date(c.updated_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>

                {/* Actions */}
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-2">
                    <a
                      href={`/candidates/${c.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors whitespace-nowrap"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Profile
                    </a>

                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild>
                        <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Portal>
                        <DropdownMenu.Content
                          align="end"
                          sideOffset={4}
                          className="w-48 bg-white rounded-xl shadow-xl border border-slate-100 p-1 z-50 animate-in fade-in-0 zoom-in-95 duration-150"
                        >
                          <DropdownMenu.Label className="px-2 py-1.5 text-[10px] text-slate-400 font-semibold uppercase tracking-wide">
                            Move to stage
                          </DropdownMenu.Label>
                          {PIPELINE_STAGES.filter((s) => s !== c.stage).map((s) => (
                            <DropdownMenu.Item
                              key={s}
                              onSelect={() => onStageChange(c.id, s)}
                              className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-slate-700 cursor-pointer hover:bg-indigo-50 hover:text-indigo-700 outline-none"
                            >
                              <MoveRight className="w-3.5 h-3.5 flex-shrink-0" />
                              {STAGE_LABELS[s]}
                            </DropdownMenu.Item>
                          ))}
                          <DropdownMenu.Separator className="my-1 h-px bg-slate-100" />
                          <DropdownMenu.Item
                            onSelect={() => onStageChange(c.id, "rejected")}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-red-600 cursor-pointer hover:bg-red-50 outline-none"
                          >
                            <UserX className="w-3.5 h-3.5 flex-shrink-0" />
                            Reject
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
