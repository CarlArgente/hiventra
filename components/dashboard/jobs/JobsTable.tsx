"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  Search, ChevronDown, MoreHorizontal, MapPin, Users,
  Plus, Briefcase, Edit, Copy, Archive, X, Eye,
} from "lucide-react";
import { updateJobStatus, duplicateJob } from "@/app/actions/jobs";
import { JobFormModal } from "./JobFormModal";

type JobStatus = "draft" | "active" | "closed" | "archived";
type EmploymentType = "full_time" | "part_time" | "contract" | "freelance";
type SortKey = "date_desc" | "title_asc" | "applicants_desc";

export interface Job {
  id: string;
  title: string;
  company: string;
  department: string | null;
  employment_type: EmploymentType | null;
  location: string | null;
  is_remote: boolean | null;
  status: JobStatus;
  created_at: string;
  applicant_count: number;
  description: string | null;
  required_skills: string[] | null;
  experience_min: number | null;
  experience_max: number | null;
  salary_min: number | null;
  salary_max: number | null;
  currency: string | null;
  carl_mode: string | null;
  carl_personality: string | null;
  carl_duration: number | null;
  carl_max_questions: number | null;
}

const STATUS_TABS = ["All", "Active", "Draft", "Closed", "Archived"] as const;
type StatusTab = (typeof STATUS_TABS)[number];

const SORT_OPTIONS: { label: string; value: SortKey }[] = [
  { label: "Date Created", value: "date_desc" },
  { label: "Title A–Z", value: "title_asc" },
  { label: "Most Applicants", value: "applicants_desc" },
];

const statusStyle: Record<JobStatus, string> = {
  active: "bg-emerald-100 text-emerald-700",
  draft: "bg-amber-100 text-amber-700",
  closed: "bg-slate-100 text-slate-500",
  archived: "bg-slate-100 text-slate-400",
};

const employmentTypeInfo: Record<EmploymentType, { label: string; cls: string }> = {
  full_time: { label: "Full-time", cls: "bg-indigo-100 text-indigo-700" },
  part_time: { label: "Part-time", cls: "bg-violet-100 text-violet-700" },
  contract: { label: "Contract", cls: "bg-amber-100 text-amber-700" },
  freelance: { label: "Freelance", cls: "bg-sky-100 text-sky-700" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function sortJobs(jobs: Job[], key: SortKey): Job[] {
  const s = [...jobs];
  if (key === "date_desc") return s.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  if (key === "title_asc") return s.sort((a, b) => a.title.localeCompare(b.title));
  return s.sort((a, b) => b.applicant_count - a.applicant_count);
}

export default function JobsTable({ jobs: initial }: { jobs: Job[] }) {
  const router = useRouter();
  const [jobs, setJobs] = useState(initial);

  useEffect(() => {
    setJobs(initial);
  }, [initial]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<StatusTab>("All");
  const [sort, setSort] = useState<SortKey>("date_desc");
  const [sortOpen, setSortOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const filtered = sortJobs(
    jobs.filter((job) => {
      const tabMatch = tab === "All" || job.status === tab.toLowerCase();
      const q = search.toLowerCase();
      const searchMatch =
        !q ||
        job.title.toLowerCase().includes(q) ||
        (job.department?.toLowerCase().includes(q) ?? false) ||
        (job.location?.toLowerCase().includes(q) ?? false);
      return tabMatch && searchMatch;
    }),
    sort
  );

  const allSelected = filtered.length > 0 && filtered.every((j) => selected.has(j.id));
  const someSelected = filtered.some((j) => selected.has(j.id)) && !allSelected;

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((j) => j.id)));
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleStatusChange(id: string, status: JobStatus) {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, status } : j)));
    await updateJobStatus(id, status);
  }

  async function handleDuplicate(id: string) {
    await duplicateJob(id);
    router.refresh();
  }

  async function handleBulkArchive() {
    const ids = Array.from(selected);
    setJobs((prev) =>
      prev.map((j) => (selected.has(j.id) ? { ...j, status: "archived" as JobStatus } : j))
    );
    setSelected(new Set());
    await Promise.all(ids.map((id) => updateJobStatus(id, "archived")));
  }

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {jobs.length} job{jobs.length !== 1 ? "s" : ""} total
        </p>
        <JobFormModal onSuccess={() => router.refresh()}>
          <button className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold px-4 py-2.5 rounded-lg shadow-sm hover:-translate-y-0.5 transition-all duration-200 text-sm">
            <Plus className="w-4 h-4" />
            Create New Job
          </button>
        </JobFormModal>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-slate-100">
          {/* Search */}
          <div className="relative min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search jobs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Status tabs */}
          <div className="flex items-center gap-1 flex-1 flex-wrap">
            {STATUS_TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  tab === t
                    ? "bg-indigo-600 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Sort dropdown */}
          <div className="relative" ref={sortRef}>
            <button
              onClick={() => setSortOpen((o) => !o)}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              {SORT_OPTIONS.find((o) => o.value === sort)?.label}
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-150 ${sortOpen ? "rotate-180" : ""}`}
              />
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setSort(opt.value); setSortOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors ${
                      sort === opt.value
                        ? "text-indigo-600 bg-indigo-50"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bulk action bar */}
        {selected.size > 0 && (
          <div className="flex items-center gap-3 px-4 py-2.5 bg-indigo-50 border-b border-indigo-100">
            <span className="text-xs font-semibold text-indigo-700">
              {selected.size} selected
            </span>
            <button
              onClick={handleBulkArchive}
              className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              <Archive className="w-3.5 h-3.5" />
              Archive selected
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="ml-auto flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          </div>
        )}

        {/* Table or empty state */}
        {filtered.length === 0 ? (
          <EmptyState
            isFiltered={!!search || tab !== "All"}
            onClear={() => { setSearch(""); setTab("All"); }}
            onRefresh={() => router.refresh()}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="w-10 px-4 py-3">
                    <IndeterminateCheckbox
                      checked={allSelected}
                      indeterminate={someSelected}
                      onChange={toggleAll}
                    />
                  </th>
                  {["Job", "Type", "Location", "Created", "Applicants", "Status"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                  <th className="w-12 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((job) => (
                  <JobRow
                    key={job.id}
                    job={job}
                    selected={selected.has(job.id)}
                    onToggle={() => toggleOne(job.id)}
                    onStatusChange={(s) => handleStatusChange(job.id, s)}
                    onDuplicate={() => handleDuplicate(job.id)}
                    onRefresh={() => router.refresh()}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function IndeterminateCheckbox({
  checked,
  indeterminate,
  onChange,
}: {
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
    />
  );
}

function JobRow({
  job,
  selected,
  onToggle,
  onStatusChange,
  onDuplicate,
  onRefresh,
}: {
  job: Job;
  selected: boolean;
  onToggle: () => void;
  onStatusChange: (s: JobStatus) => void;
  onDuplicate: () => void;
  onRefresh: () => void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const typeInfo = job.employment_type ? employmentTypeInfo[job.employment_type] : null;

  return (
    <>
      <tr className={`group transition-colors hover:bg-indigo-50/30 ${selected ? "bg-indigo-50/50" : ""}`}>
        <td className="px-4 py-3.5 w-10">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggle}
            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
        </td>

        <td className="px-4 py-3.5">
          <button
            onClick={() => setEditOpen(true)}
            className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors text-sm text-left"
          >
            {job.title}
          </button>
          {job.department && <p className="text-xs text-slate-500 mt-0.5">{job.department}</p>}
        </td>

        <td className="px-4 py-3.5">
          {typeInfo ? (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${typeInfo.cls}`}>
              {typeInfo.label}
            </span>
          ) : (
            <span className="text-slate-400 text-sm">—</span>
          )}
        </td>

        <td className="px-4 py-3.5">
          <span className="flex items-center gap-1.5 text-sm text-slate-600 whitespace-nowrap">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {job.is_remote ? "Remote" : (job.location ?? "—")}
          </span>
        </td>

        <td className="px-4 py-3.5">
          <span className="text-sm text-slate-600 whitespace-nowrap">{formatDate(job.created_at)}</span>
        </td>

        <td className="px-4 py-3.5">
          <span className="flex items-center gap-1.5 text-sm text-slate-700">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            {job.applicant_count}
          </span>
        </td>

        <td className="px-4 py-3.5">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusStyle[job.status]}`}>
            {job.status}
          </span>
        </td>

        <td className="px-4 py-3.5 w-12">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 data-[state=open]:opacity-100">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={4}
                className="w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
              >
                <DropdownMenu.Item
                  onSelect={() => setEditOpen(true)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer outline-none transition-colors"
                >
                  <Edit className="w-3.5 h-3.5 text-slate-400" />
                  Edit Job
                </DropdownMenu.Item>

                <DropdownMenu.Item
                  onSelect={onDuplicate}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer outline-none transition-colors"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  Duplicate
                </DropdownMenu.Item>

                <DropdownMenu.Item asChild>
                  <a
                    href={`/dashboard/pipeline?job=${job.id}`}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer outline-none transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                    View Candidates
                  </a>
                </DropdownMenu.Item>

                <DropdownMenu.Separator className="my-1 border-t border-slate-100" />

                {job.status !== "closed" && (
                  <DropdownMenu.Item
                    onSelect={() => onStatusChange("closed")}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer outline-none transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-slate-400" />
                    Close Job
                  </DropdownMenu.Item>
                )}

                {job.status !== "archived" && (
                  <DropdownMenu.Item
                    onSelect={() => onStatusChange("archived")}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 cursor-pointer outline-none transition-colors"
                  >
                    <Archive className="w-3.5 h-3.5 text-red-400" />
                    Archive
                  </DropdownMenu.Item>
                )}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </td>
      </tr>

      {/* Edit modal lives outside the dropdown so it isn't unmounted when dropdown closes */}
      <JobFormModal
        job={job}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={() => { setEditOpen(false); onRefresh(); }}
      />
    </>
  );
}

function EmptyState({
  isFiltered,
  onClear,
  onRefresh,
}: {
  isFiltered: boolean;
  onClear: () => void;
  onRefresh: () => void;
}) {
  return (
    <div className="py-20 flex flex-col items-center gap-4">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
        <Briefcase className="w-7 h-7 text-slate-400" />
      </div>
      {isFiltered ? (
        <>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-700">No jobs match your filters</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filter criteria</p>
          </div>
          <button
            onClick={onClear}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            Clear filters
          </button>
        </>
      ) : (
        <>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-700">No jobs yet</p>
            <p className="text-xs text-slate-400 mt-1">Create your first job posting to get started</p>
          </div>
          <JobFormModal onSuccess={onRefresh}>
            <button className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold px-4 py-2 rounded-lg text-xs shadow-sm hover:-translate-y-0.5 transition-all duration-200">
              <Plus className="w-3.5 h-3.5" />
              Create New Job
            </button>
          </JobFormModal>
        </>
      )}
    </div>
  );
}
