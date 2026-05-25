"use client";

import { useState, useId } from "react";
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PipelineCandidate,
  PipelineStage,
  PIPELINE_STAGES,
  STAGE_LABELS,
} from "./pipeline-types";

// ── Helpers ──────────────────────────────────────────────────────────────────

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

const COLUMN_ACCENTS: Partial<Record<PipelineStage, string>> = {
  recommended: "border-t-emerald-400",
  hired: "border-t-violet-500",
  rejected: "border-t-red-400",
  interview_started: "border-t-indigo-400",
  completed: "border-t-sky-400",
};

// ── Draggable card ────────────────────────────────────────────────────────────

function CandidateCard({
  candidate,
  isSelected,
  onToggleSelect,
  isOverlay = false,
}: {
  candidate: PipelineCandidate;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  isOverlay?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: candidate.id,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const isHighlighted =
    candidate.stage === "recommended" ||
    ["strongly_recommend", "recommend"].includes(candidate.ai_recommendation ?? "");
  const isRejected = candidate.stage === "rejected";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "bg-white rounded-xl border shadow-sm p-3.5 select-none transition-all duration-150",
        !isOverlay && "cursor-grab active:cursor-grabbing touch-none",
        isDragging && !isOverlay && "opacity-30",
        isOverlay && "shadow-2xl rotate-1 scale-105 cursor-grabbing",
        isSelected && "ring-2 ring-indigo-400",
        isHighlighted && !isRejected
          ? "border-l-4 border-l-emerald-400 border-t-slate-100 border-r-slate-100 border-b-slate-100"
          : isRejected
          ? "border-l-4 border-l-red-400 border-t-slate-100 border-r-slate-100 border-b-slate-100"
          : "border-slate-100"
      )}
    >
      <div className="flex items-start gap-2">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(candidate.id)}
          onClick={(e) => e.stopPropagation()}
          className="mt-1 flex-shrink-0 accent-indigo-600 cursor-pointer"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Avatar + name */}
          <div className="flex items-center gap-2 mb-2">
            <div
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0",
                avatarColor(candidate.full_name)
              )}
            >
              {initials(candidate.full_name)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">{candidate.full_name}</p>
              <p className="text-[10px] text-slate-400 truncate">{candidate.email}</p>
            </div>
          </div>

          {/* Score + Recommendation */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {candidate.has_intelligence_report && candidate.interview_ai_score !== null ? (
              <span className={cn(
                "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                scoreColorClass(candidate.interview_ai_score)
              )}>
                <span className="font-medium opacity-70">Interview</span>
                {candidate.interview_ai_score}/100
              </span>
            ) : candidate.ai_score !== null ? (
              <span className={cn(
                "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                scoreColorClass(candidate.ai_score)
              )}>
                <span className="font-medium opacity-70">Resume</span>
                {candidate.ai_score}/100
              </span>
            ) : null}
            {candidate.ai_recommendation && (
              <span className={cn(
                "inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium",
                recommendationClass(candidate.ai_recommendation)
              )}>
                {recommendationLabel(candidate.ai_recommendation)}
              </span>
            )}
          </div>

          {/* Interview mode + link */}
          <div className="flex items-center justify-between">
            <span className="text-sm">
              {candidate.interview_mode ? modeIcon(candidate.interview_mode) : ""}
            </span>
            {candidate.has_intelligence_report ? (
              <a
                href={`/dashboard/candidates/${candidate.id}/report`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-0.5 text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                View Intelligence Report
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            ) : (
              <a
                href={`/dashboard/candidates/${candidate.id}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-0.5 text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                View Profile
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Droppable column ──────────────────────────────────────────────────────────

function KanbanColumn({
  stage,
  candidates,
  selected,
  onToggleSelect,
}: {
  stage: PipelineStage;
  candidates: PipelineCandidate[];
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div className="flex-shrink-0 w-56 flex flex-col max-h-full">
      {/* Sticky header */}
      <div className={cn(
        "px-3 py-2.5 bg-slate-100 rounded-t-xl border-t-2",
        COLUMN_ACCENTS[stage] ?? "border-t-slate-300"
      )}>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
            {STAGE_LABELS[stage]}
          </span>
          <span className="text-[10px] font-semibold text-slate-500 bg-white px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
            {candidates.length}
          </span>
        </div>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 p-2 space-y-2 rounded-b-xl overflow-y-auto transition-colors duration-150",
          isOver ? "bg-indigo-50" : "bg-slate-50"
        )}
        style={{ minHeight: "12rem" }}
      >
        {candidates.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-xs text-slate-400 text-center px-2">
            No candidates here
          </div>
        ) : (
          candidates.map((c) => (
            <CandidateCard
              key={c.id}
              candidate={c}
              isSelected={selected.has(c.id)}
              onToggleSelect={onToggleSelect}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

interface KanbanViewProps {
  candidates: PipelineCandidate[];
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onStageChange: (id: string, stage: PipelineStage) => void;
}

export default function KanbanView({
  candidates,
  selected,
  onToggleSelect,
  onStageChange,
}: KanbanViewProps) {
  const [activeCandidate, setActiveCandidate] = useState<PipelineCandidate | null>(null);
  const dndId = useId();

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  function handleDragStart(event: DragStartEvent) {
    const c = candidates.find((c) => c.id === event.active.id);
    setActiveCandidate(c ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveCandidate(null);
    if (over && active.id !== over.id) {
      onStageChange(active.id as string, over.id as PipelineStage);
    }
  }

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 p-4 sm:p-6 overflow-x-auto h-full items-start no-scrollbar">
        {PIPELINE_STAGES.map((stage) => (
          <KanbanColumn
            key={stage}
            stage={stage}
            candidates={candidates.filter((c) => c.stage === stage)}
            selected={selected}
            onToggleSelect={onToggleSelect}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 150, easing: "ease" }}>
        {activeCandidate && (
          <CandidateCard
            candidate={activeCandidate}
            isSelected={selected.has(activeCandidate.id)}
            onToggleSelect={() => {}}
            isOverlay
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}
