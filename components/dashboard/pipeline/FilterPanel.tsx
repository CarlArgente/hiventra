"use client";

import { X, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { PIPELINE_STAGES, STAGE_LABELS } from "./pipeline-types";
import { Filters } from "./PipelineClient";

const RECOMMENDATIONS = [
  { value: "strongly_recommend", label: "Highly Recommended" },
  { value: "recommend", label: "Recommended" },
  { value: "review_further", label: "Review Further" },
  { value: "not_recommend", label: "Not Recommended" },
];

const INTERVIEW_MODES = [
  { value: "text", label: "💬 Text" },
  { value: "voice", label: "🎙️ Voice" },
  { value: "video", label: "🎥 Video" },
];

interface FilterPanelProps {
  open: boolean;
  onClose: () => void;
  filters: Filters;
  onChange: (f: Filters) => void;
  onReset: () => void;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
      {children}
    </p>
  );
}

function CheckItem({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group py-0.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="accent-indigo-600 w-4 h-4 flex-shrink-0"
      />
      <span className="text-sm text-slate-700 group-hover:text-slate-900">{label}</span>
    </label>
  );
}

export default function FilterPanel({
  open,
  onClose,
  filters,
  onChange,
  onReset,
}: FilterPanelProps) {
  function toggle(key: "recommendations" | "interviewModes" | "stages", value: string) {
    const arr = filters[key];
    onChange({
      ...filters,
      [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
    });
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-80 bg-white shadow-2xl flex flex-col",
          "transform transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <h3 className="text-sm font-semibold text-slate-800">Filter Candidates</h3>
          <div className="flex items-center gap-3">
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* AI Score range */}
          <div>
            <SectionLabel>AI Score Range</SectionLabel>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={0}
                max={100}
                value={filters.scoreMin}
                onChange={(e) => onChange({ ...filters, scoreMin: Math.min(Number(e.target.value), filters.scoreMax) })}
                className="w-16 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex-1 h-px bg-slate-200" />
              <input
                type="number"
                min={0}
                max={100}
                value={filters.scoreMax}
                onChange={(e) => onChange({ ...filters, scoreMax: Math.max(Number(e.target.value), filters.scoreMin) })}
                className="w-16 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 px-0.5">
              <span>Min</span>
              <span>Max</span>
            </div>
          </div>

          {/* Recommendation */}
          <div>
            <SectionLabel>Recommendation</SectionLabel>
            <div className="space-y-1">
              {RECOMMENDATIONS.map((r) => (
                <CheckItem
                  key={r.value}
                  label={r.label}
                  checked={filters.recommendations.includes(r.value)}
                  onChange={() => toggle("recommendations", r.value)}
                />
              ))}
            </div>
          </div>

          {/* Interview Mode */}
          <div>
            <SectionLabel>Interview Mode</SectionLabel>
            <div className="space-y-1">
              {INTERVIEW_MODES.map((m) => (
                <CheckItem
                  key={m.value}
                  label={m.label}
                  checked={filters.interviewModes.includes(m.value)}
                  onChange={() => toggle("interviewModes", m.value)}
                />
              ))}
            </div>
          </div>

          {/* Stage */}
          <div>
            <SectionLabel>Pipeline Stage</SectionLabel>
            <div className="space-y-1">
              {PIPELINE_STAGES.map((s) => (
                <CheckItem
                  key={s}
                  label={STAGE_LABELS[s]}
                  checked={filters.stages.includes(s)}
                  onChange={() => toggle("stages", s)}
                />
              ))}
            </div>
          </div>

          {/* Date range */}
          <div>
            <SectionLabel>Date Uploaded</SectionLabel>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-slate-500 mb-1">From</p>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">To</p>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => onChange({ ...filters, dateTo: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
}
