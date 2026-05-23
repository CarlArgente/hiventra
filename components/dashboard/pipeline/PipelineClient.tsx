"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  LayoutList,
  Columns3,
  ChevronDown,
  Briefcase,
  Users,
  Calendar,
  X,
  Ban,
  MoveRight,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getCandidatesForJob,
  updateCandidateStage,
  bulkUpdateStage,
} from "@/app/actions/pipeline";
import {
  PipelineCandidate,
  PipelineJob,
  PipelineStage,
  PIPELINE_STAGES,
  STAGE_LABELS,
} from "./pipeline-types";
import KanbanView from "./KanbanView";
import ListView from "./ListView";
import FilterPanel from "./FilterPanel";

export interface Filters {
  scoreMin: number;
  scoreMax: number;
  recommendations: string[];
  interviewModes: string[];
  stages: string[];
  dateFrom: string;
  dateTo: string;
}

const DEFAULT_FILTERS: Filters = {
  scoreMin: 0,
  scoreMax: 100,
  recommendations: [],
  interviewModes: [],
  stages: [],
  dateFrom: "",
  dateTo: "",
};

interface Props {
  jobs: PipelineJob[];
  initialJobId: string | null;
  initialCandidates: PipelineCandidate[];
}

export default function PipelineClient({ jobs, initialJobId, initialCandidates }: Props) {
  const router = useRouter();
  const [selectedJobId, setSelectedJobId] = useState(initialJobId ?? "");
  const [candidates, setCandidates] = useState<PipelineCandidate[]>(initialCandidates);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStage, setBulkStage] = useState<PipelineStage | "">("");
  const [bulkLoading, setBulkLoading] = useState(false);

  const selectedJob = jobs.find((j) => j.id === selectedJobId);

  useEffect(() => {
    if (!selectedJobId) return;
    let cancelled = false;
    setLoading(true);
    setSelected(new Set());
    getCandidatesForJob(selectedJobId).then((data) => {
      if (!cancelled) {
        setCandidates(data);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [selectedJobId]);

  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      if (search) {
        const q = search.toLowerCase();
        if (!c.full_name.toLowerCase().includes(q) && !c.email.toLowerCase().includes(q)) return false;
      }
      if ((c.ai_score ?? 0) < filters.scoreMin) return false;
      if ((c.ai_score ?? 100) > filters.scoreMax) return false;
      if (filters.recommendations.length > 0 && !filters.recommendations.includes(c.ai_recommendation ?? "")) return false;
      if (filters.interviewModes.length > 0 && !filters.interviewModes.includes(c.interview_mode ?? "")) return false;
      if (filters.stages.length > 0 && !filters.stages.includes(c.stage)) return false;
      if (filters.dateFrom && c.created_at < filters.dateFrom) return false;
      if (filters.dateTo && c.created_at > filters.dateTo + "T23:59:59") return false;
      return true;
    });
  }, [candidates, search, filters]);

  async function handleStageChange(candidateId: string, newStage: PipelineStage) {
    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, stage: newStage } : c))
    );
    await updateCandidateStage(candidateId, newStage);
  }

  async function handleBulkMove() {
    if (!bulkStage || selected.size === 0) return;
    setBulkLoading(true);
    const ids = [...selected];
    const stage = bulkStage as PipelineStage;
    setCandidates((prev) => prev.map((c) => (ids.includes(c.id) ? { ...c, stage } : c)));
    setSelected(new Set());
    setBulkStage("");
    await bulkUpdateStage(ids, stage);
    setBulkLoading(false);
  }

  function handleBulkReject() {
    const ids = [...selected];
    setCandidates((prev) => prev.map((c) => (ids.includes(c.id) ? { ...c, stage: "rejected" } : c)));
    setSelected(new Set());
    bulkUpdateStage(ids, "rejected");
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === filteredCandidates.length && filteredCandidates.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredCandidates.map((c) => c.id)));
    }
  }

  const hasActiveFilters =
    filters.scoreMin > 0 ||
    filters.scoreMax < 100 ||
    filters.recommendations.length > 0 ||
    filters.interviewModes.length > 0 ||
    filters.stages.length > 0 ||
    !!filters.dateFrom ||
    !!filters.dateTo;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Job context bar */}
      <div className="px-6 py-3.5 bg-white border-b border-slate-100 flex items-center gap-4 flex-wrap shrink-0">
        <div className="relative min-w-[280px]">
          <select
            value={selectedJobId}
            onChange={(e) => {
              setSelectedJobId(e.target.value);
              router.push(`/dashboard/pipeline?job=${e.target.value}`, { scroll: false });
            }}
            className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-4 py-2 pr-10 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {jobs.length === 0 && <option value="">No jobs found</option>}
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}{j.department ? ` — ${j.department}` : ""}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

        {selectedJob && (
          <div className="flex items-center gap-3 text-sm text-slate-500 flex-wrap">
            {selectedJob.department && (
              <span className="flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                {selectedJob.department}
              </span>
            )}
            <span className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold",
              selectedJob.status === "active"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-600"
            )}>
              <span className={cn(
                "w-1.5 h-1.5 rounded-full",
                selectedJob.status === "active" ? "bg-emerald-500" : "bg-slate-400"
              )} />
              {selectedJob.status.charAt(0).toUpperCase() + selectedJob.status.slice(1)}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(selectedJob.created_at).toLocaleDateString("en-US", {
                month: "short", day: "numeric", year: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-slate-700">
              <Users className="w-3.5 h-3.5" />
              {candidates.length} candidate{candidates.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        <a
          href="/dashboard/jobs"
          className="ml-auto text-xs text-indigo-600 hover:underline font-medium"
        >
          Edit Job
        </a>
      </div>

      {/* Controls row */}
      <div className="px-6 py-2.5 bg-white border-b border-slate-100 flex items-center gap-3 shrink-0">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(true)}
          className={cn(
            "inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors",
            hasActiveFilters
              ? "border-indigo-300 bg-indigo-50 text-indigo-700"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
        </button>

        <div className="ml-auto flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setView("kanban")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
              view === "kanban" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Columns3 className="w-3.5 h-3.5" />
            Kanban
          </button>
          <button
            onClick={() => setView("list")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
              view === "list" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <LayoutList className="w-3.5 h-3.5" />
            List
          </button>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="px-6 py-2.5 bg-indigo-50 border-b border-indigo-100 flex items-center gap-4 shrink-0">
          <span className="text-sm font-semibold text-indigo-700">
            {selected.size} selected
          </span>
          <div className="flex items-center gap-2">
            <select
              value={bulkStage}
              onChange={(e) => setBulkStage(e.target.value as PipelineStage | "")}
              className="text-sm border border-indigo-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Move to stage…</option>
              {PIPELINE_STAGES.map((s) => (
                <option key={s} value={s}>{STAGE_LABELS[s]}</option>
              ))}
            </select>
            <button
              onClick={handleBulkMove}
              disabled={!bulkStage || bulkLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
            >
              {bulkLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MoveRight className="w-3.5 h-3.5" />}
              Move
            </button>
            <button
              onClick={handleBulkReject}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors"
            >
              <Ban className="w-3.5 h-3.5" />
              Reject All
            </button>
          </div>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-indigo-400 hover:text-indigo-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full gap-3 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading candidates…</span>
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
            <Briefcase className="w-10 h-10" />
            <p className="text-sm">No jobs found. Create a job first.</p>
            <a
              href="/dashboard/jobs"
              className="text-sm text-indigo-600 hover:underline font-medium"
            >
              Go to Jobs
            </a>
          </div>
        ) : view === "kanban" ? (
          <KanbanView
            candidates={filteredCandidates}
            selected={selected}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            onStageChange={handleStageChange}
          />
        ) : (
          <ListView
            candidates={filteredCandidates}
            selected={selected}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            onStageChange={handleStageChange}
          />
        )}
      </div>

      <FilterPanel
        open={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters(DEFAULT_FILTERS)}
      />
    </div>
  );
}
