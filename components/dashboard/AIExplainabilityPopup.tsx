"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { Search, RefreshCw, X } from "lucide-react";
import { searchCandidateExplainability } from "@/app/actions/audit";
import type { ExplainabilityCandidate } from "@/app/actions/audit";

const REC_LABELS: Record<string, string> = {
  strongly_recommend: "Strongly Recommend",
  recommend: "Recommend",
  review_further: "Review Further",
  do_not_recommend: "Do Not Recommend",
};

const REC_COLORS: Record<string, string> = {
  strongly_recommend: "bg-emerald-100 text-emerald-700",
  recommend: "bg-green-100 text-green-700",
  review_further: "bg-amber-100 text-amber-700",
  do_not_recommend: "bg-red-100 text-red-700",
};

function fmt(date: string) {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ScoreBar({ value, max }: { value: number; max: number }) {
  const pct = Math.round((value / Math.max(max, 1)) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-600 w-6 text-right">{value}</span>
    </div>
  );
}

function ExplainabilityDetail({ candidate }: { candidate: ExplainabilityCandidate }) {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h3 className="font-semibold text-slate-800 text-sm">{candidate.full_name}</h3>
        <p className="text-xs text-slate-500 mt-0.5">{candidate.email} · {candidate.job_title}</p>
      </div>

      {/* Resume scoring */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
          Resume Scoring
        </h4>
        {candidate.resume_score !== null ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="text-3xl font-bold text-indigo-600">{candidate.resume_score}</div>
              <div>
                <p className="text-xs text-slate-500">AI Score</p>
                {candidate.resume_recommendation && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${REC_COLORS[candidate.resume_recommendation] ?? "bg-slate-100 text-slate-600"}`}>
                    {REC_LABELS[candidate.resume_recommendation] ?? candidate.resume_recommendation}
                  </span>
                )}
              </div>
            </div>
            {candidate.resume_summary && (
              <p className="text-sm text-slate-700 leading-relaxed border-l-2 border-indigo-200 pl-3">
                {candidate.resume_summary}
              </p>
            )}
            {(candidate.resume_strengths?.length || candidate.resume_weaknesses?.length) ? (
              <div className="grid grid-cols-2 gap-4">
                {candidate.resume_strengths && candidate.resume_strengths.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-emerald-700 mb-1.5">Strengths</p>
                    <ul className="space-y-1">
                      {candidate.resume_strengths.map((s, i) => (
                        <li key={i} className="text-xs text-slate-700 flex gap-1.5">
                          <span className="text-emerald-500 shrink-0 mt-0.5">✓</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {candidate.resume_weaknesses && candidate.resume_weaknesses.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-red-600 mb-1.5">Weaknesses</p>
                    <ul className="space-y-1">
                      {candidate.resume_weaknesses.map((w, i) => (
                        <li key={i} className="text-xs text-slate-700 flex gap-1.5">
                          <span className="text-red-400 shrink-0 mt-0.5">✗</span>
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : null}
            {candidate.resume_scored_at && (
              <p className="text-xs text-slate-400">Score generated on {fmt(candidate.resume_scored_at)}</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-400 italic">No resume scoring data.</p>
        )}
      </div>

      {/* Interview analysis */}
      {candidate.interview_score !== null && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
            Interview Analysis
          </h4>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="text-3xl font-bold text-violet-600">{candidate.interview_score}</div>
              <div>
                <p className="text-xs text-slate-500">Interview Score</p>
                {candidate.interview_recommendation && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${REC_COLORS[candidate.interview_recommendation] ?? "bg-slate-100 text-slate-600"}`}>
                    {REC_LABELS[candidate.interview_recommendation] ?? candidate.interview_recommendation}
                  </span>
                )}
              </div>
            </div>
            {candidate.interview_summary && (
              <p className="text-sm text-slate-700 leading-relaxed border-l-2 border-violet-200 pl-3">
                {candidate.interview_summary}
              </p>
            )}
            {candidate.interview_skill_breakdown &&
              Object.keys(candidate.interview_skill_breakdown).length > 0 && (
                <div>
                  <p className="text-xs font-medium text-slate-600 mb-2">Skill Breakdown</p>
                  <div className="space-y-2">
                    {Object.entries(candidate.interview_skill_breakdown).map(([skill, score]) => (
                      <div key={skill}>
                        <div className="flex justify-between text-xs text-slate-600 mb-1">
                          <span className="capitalize">{skill.replace(/_/g, " ")}</span>
                          <span className="font-medium">{score}/100</span>
                        </div>
                        <ScoreBar value={score} max={100} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            {candidate.interview_analyzed_at && (
              <p className="text-xs text-slate-400">Analysis generated on {fmt(candidate.interview_analyzed_at)}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AIExplainabilityPopup() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ExplainabilityCandidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<ExplainabilityCandidate | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [searching, startSearch] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setHasSearched(false);
        setSearchResults([]);
        setSearchQuery("");
      }
    }
    if (open) document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    startSearch(async () => {
      const results = await searchCandidateExplainability(searchQuery);
      setSearchResults(results);
      setSelectedCandidate(results[0] ?? null);
      setHasSearched(true);
    });
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        title="AI Explainability"
        className={`relative w-9 h-9 rounded-lg border flex items-center justify-center transition-colors ${
          open
            ? "border-indigo-300 bg-indigo-50 text-indigo-600"
            : "border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50"
        }`}
      >
        <Search className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-[700px] bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-indigo-500" />
              <div>
                <p className="text-sm font-semibold text-slate-800">AI Explainability on Demand</p>
                <p className="text-xs text-slate-500">Look up the full scoring rationale for any candidate</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search bar */}
          <div className="px-5 py-3 border-b border-slate-100 shrink-0">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search by candidate name or email…"
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={!searchQuery.trim() || searching}
                className="px-4 py-2.5 text-sm font-medium bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2 shrink-0"
              >
                {searching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                Search
              </button>
            </div>
          </div>

          {/* Body */}
          {searchResults.length > 0 ? (
            <div className="flex divide-x divide-slate-100 overflow-hidden" style={{ maxHeight: 480 }}>
              {/* Candidate list */}
              <div className="w-52 shrink-0 overflow-y-auto p-3 space-y-1">
                {searchResults.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCandidate(c)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors ${
                      selectedCandidate?.id === c.id
                        ? "bg-indigo-50 text-indigo-800 font-medium border border-indigo-200"
                        : "text-slate-700 hover:bg-slate-50 border border-transparent"
                    }`}
                  >
                    <p className="font-medium truncate">{c.full_name}</p>
                    <p className="text-xs text-slate-400 truncate">{c.job_title}</p>
                  </button>
                ))}
              </div>
              {/* Detail */}
              {selectedCandidate && (
                <div className="flex-1 overflow-y-auto p-5">
                  <ExplainabilityDetail candidate={selectedCandidate} />
                </div>
              )}
            </div>
          ) : hasSearched && !searching ? (
            <div className="py-10 text-center">
              <p className="text-sm text-slate-400">No candidates found matching &quot;{searchQuery}&quot;.</p>
            </div>
          ) : (
            <div className="py-10 text-center space-y-2">
              <Search className="w-8 h-8 text-slate-200 mx-auto" />
              <p className="text-sm text-slate-400">Search for a candidate to view their AI scoring rationale.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
