"use client";

import { useState, useTransition, useEffect, KeyboardEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  X, MessageSquare, Mic, Video, Plus, Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createJob, updateJob, type JobPayload } from "@/app/actions/jobs";
import type { Job } from "./JobsTable";

const DEPARTMENTS = [
  "Engineering", "Product", "Design", "Sales", "Marketing",
  "HR", "Finance", "Operations", "Analytics", "Other",
];

const CURRENCIES = ["USD", "PHP", "EUR", "GBP", "SGD"];

const CARL_PERSONALITIES = [
  { value: "friendly", label: "Friendly", desc: "Warm, conversational, encouraging" },
  { value: "professional", label: "Professional", desc: "Formal, structured, precise" },
  { value: "strict", label: "Strict", desc: "High expectations, no fluff" },
  { value: "executive", label: "Executive", desc: "Strategic, leadership-focused" },
  { value: "technical_deep_dive", label: "Technical", desc: "Deep technical probing" },
];

const CARL_MODES = [
  { value: "text", label: "Text", icon: MessageSquare },
  { value: "voice", label: "Voice", icon: Mic },
  { value: "video", label: "Video", icon: Video },
];

const DURATIONS = [15, 30, 45, 60];

function jobToForm(job: import("./JobsTable").Job) {
  return {
    title: job.title,
    company: job.company ?? "Hiventra",
    department: job.department ?? "Engineering",
    employment_type: job.employment_type ?? "full_time",
    location: job.is_remote ? "" : (job.location ?? ""),
    is_remote: job.is_remote ?? false,
    salary_min: job.salary_min ?? null,
    salary_max: job.salary_max ?? null,
    currency: job.currency ?? "USD",
    include_salary: !!(job.salary_min || job.salary_max),
    description: job.description ?? "",
    required_skills: job.required_skills ?? [],
    experience_min: job.experience_min ?? 0,
    experience_max: job.experience_max ?? 5,
    min_resume_score: job.min_resume_score ?? 0,
    status: job.status,
    carl_mode: job.carl_mode ?? "text",
    carl_personality: job.carl_personality ?? "professional",
    carl_duration: job.carl_duration ?? 30,
    carl_max_questions: job.carl_max_questions ?? 10,
    skillInput: "",
  };
}

function defaultForm(): JobPayload & { include_salary: boolean; skillInput: string } {
  return {
    title: "",
    company: "Hiventra",
    department: "Engineering",
    employment_type: "full_time",
    location: "",
    is_remote: false,
    salary_min: null,
    salary_max: null,
    currency: "USD",
    include_salary: false,
    description: "",
    required_skills: [],
    experience_min: 0,
    experience_max: 5,
    min_resume_score: 0,
    status: "draft",
    carl_mode: "text",
    carl_personality: "professional",
    carl_duration: 30,
    carl_max_questions: 10,
    skillInput: "",
  };
}

interface Props {
  children?: React.ReactNode;
  job?: Job | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export function JobFormModal({ children, job, open: controlledOpen, onOpenChange, onSuccess }: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [form, setForm] = useState(() => job ? jobToForm(job) : defaultForm());
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setForm(job ? jobToForm(job) : defaultForm());
      setError(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function addSkill() {
    const skill = form.skillInput.trim();
    if (!skill || form.required_skills.includes(skill)) {
      set("skillInput", "");
      return;
    }
    set("required_skills", [...form.required_skills, skill]);
    set("skillInput", "");
  }

  function onSkillKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill();
    }
    if (e.key === "Backspace" && !form.skillInput && form.required_skills.length) {
      set("required_skills", form.required_skills.slice(0, -1));
    }
  }

  function removeSkill(skill: string) {
    set("required_skills", form.required_skills.filter((s) => s !== skill));
  }

  function handleSubmit(submitStatus: "draft" | "active") {
    if (!form.title.trim()) {
      setError("Job title is required.");
      return;
    }
    setError(null);

    const payload: JobPayload = {
      title: form.title.trim(),
      company: form.company.trim() || "Hiventra",
      department: form.department,
      employment_type: form.employment_type,
      location: form.is_remote ? "Remote" : form.location.trim(),
      is_remote: form.is_remote,
      salary_min: form.include_salary ? form.salary_min : null,
      salary_max: form.include_salary ? form.salary_max : null,
      currency: form.currency,
      description: form.description.trim(),
      required_skills: form.required_skills,
      experience_min: form.experience_min,
      experience_max: form.experience_max,
      min_resume_score: form.min_resume_score,
      status: submitStatus,
      carl_mode: form.carl_mode,
      carl_personality: form.carl_personality,
      carl_duration: form.carl_duration,
      carl_max_questions: form.carl_max_questions,
    };

    startTransition(async () => {
      const result = job
        ? await updateJob(job.id, payload)
        : await createJob(payload);

      if (result?.error) {
        setError(result.error);
        return;
      }

      setOpen(false);
      setForm(defaultForm());
      onSuccess?.();
    });
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) { setError(null); }
      }}
    >
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl z-50 flex flex-col data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
            <div>
              <Dialog.Title className="text-lg font-extrabold text-slate-900">
                {job ? `Edit: ${job.title}` : "Create New Job"}
              </Dialog.Title>
              <Dialog.Description className="text-xs text-slate-500 mt-0.5">
                {job ? "Update the job posting details below." : "Fill in the details to create a new job posting for Carl to interview against."}
              </Dialog.Description>
            </div>
            <Dialog.Close className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
              <X className="w-4 h-4" />
            </Dialog.Close>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

            {/* Status toggle */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Status:</span>
              {(["draft", "active", "closed"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => set("status", s)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-semibold capitalize transition-colors",
                    form.status === s
                      ? s === "active" ? "bg-emerald-500 text-white"
                        : s === "draft" ? "bg-amber-400 text-white"
                        : "bg-slate-400 text-white"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Section: Job Basics */}
            <FormSection title="Job Basics">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label required>Job Title</Label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => set("title", e.target.value)}
                    placeholder="e.g. Senior Backend Engineer"
                    className={inputCls}
                  />
                </div>
                <div>
                  <Label required>Company</Label>
                  <input
                    type="text"
                    value={form.company}
                    onChange={(e) => set("company", e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <Label>Department</Label>
                  <select
                    value={form.department}
                    onChange={(e) => set("department", e.target.value)}
                    className={inputCls}
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Employment type */}
              <div>
                <Label>Employment Type</Label>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { value: "full_time", label: "Full-time" },
                    { value: "part_time", label: "Part-time" },
                    { value: "contract", label: "Contract" },
                    { value: "freelance", label: "Freelance" },
                  ].map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => set("employment_type", t.value)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors",
                        form.employment_type === t.value
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <Label>Location</Label>
                  <input
                    type="text"
                    value={form.is_remote ? "Remote" : form.location}
                    onChange={(e) => set("location", e.target.value)}
                    disabled={form.is_remote}
                    placeholder="e.g. San Francisco, CA"
                    className={cn(inputCls, form.is_remote && "opacity-50 cursor-not-allowed")}
                  />
                </div>
                <label className="flex items-center gap-2 pb-2 cursor-pointer select-none">
                  <div
                    onClick={() => set("is_remote", !form.is_remote)}
                    className={cn(
                      "w-9 h-5 rounded-full transition-colors relative cursor-pointer",
                      form.is_remote ? "bg-indigo-600" : "bg-slate-200"
                    )}
                  >
                    <div
                      className={cn(
                        "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                        form.is_remote ? "translate-x-4" : "translate-x-0.5"
                      )}
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-600">Remote</span>
                </label>
              </div>
            </FormSection>

            {/* Section: Compensation */}
            <FormSection title="Compensation">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.include_salary}
                  onChange={(e) => set("include_salary", e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-slate-700">Include salary range</span>
              </label>
              {form.include_salary && (
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex-1">
                    <Label>Min</Label>
                    <input
                      type="number"
                      value={form.salary_min ?? ""}
                      onChange={(e) => set("salary_min", e.target.value ? Number(e.target.value) : null)}
                      placeholder="50000"
                      className={inputCls}
                    />
                  </div>
                  <div className="flex-1">
                    <Label>Max</Label>
                    <input
                      type="number"
                      value={form.salary_max ?? ""}
                      onChange={(e) => set("salary_max", e.target.value ? Number(e.target.value) : null)}
                      placeholder="120000"
                      className={inputCls}
                    />
                  </div>
                  <div className="w-24">
                    <Label>Currency</Label>
                    <select
                      value={form.currency}
                      onChange={(e) => set("currency", e.target.value)}
                      className={inputCls}
                    >
                      {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </FormSection>

            {/* Section: Description */}
            <FormSection title="Job Description">
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={5}
                placeholder="Describe the role, responsibilities, and what success looks like..."
                className={cn(inputCls, "resize-none")}
              />
            </FormSection>

            {/* Section: Requirements */}
            <FormSection title="Requirements">
              <div>
                <Label>Required Skills</Label>
                <div className="flex flex-wrap gap-1.5 p-2 border border-slate-200 rounded-lg bg-white focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-colors min-h-[44px]">
                  {form.required_skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-full"
                    >
                      {skill}
                      <button type="button" onClick={() => removeSkill(skill)} className="hover:text-indigo-900 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={form.skillInput}
                    onChange={(e) => set("skillInput", e.target.value)}
                    onKeyDown={onSkillKeyDown}
                    onBlur={addSkill}
                    placeholder={form.required_skills.length === 0 ? "Type skill and press Enter..." : "Add more..."}
                    className="flex-1 min-w-[120px] text-sm outline-none bg-transparent text-slate-900 placeholder:text-slate-400"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Press Enter or comma to add</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Min Experience (years)</Label>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={form.experience_min}
                    onChange={(e) => set("experience_min", Number(e.target.value))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <Label>Max Experience (years)</Label>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    value={form.experience_max}
                    onChange={(e) => set("experience_max", Number(e.target.value))}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <Label>Minimum Resume Score (0 = accept all)</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={form.min_resume_score}
                    onChange={(e) => set("min_resume_score", Number(e.target.value))}
                    className="flex-1 accent-indigo-600"
                  />
                  <span className="w-12 text-right text-sm font-bold text-slate-900">
                    {form.min_resume_score === 0 ? "Off" : `${form.min_resume_score}/100`}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Set to 0 to pass all candidates regardless of score (e.g. open to fresh grads)
                </p>
              </div>
            </FormSection>

            {/* Section: Carl Interview Setup */}
            <FormSection title="Carl Interview Setup">
              {/* Mode */}
              <div>
                <Label>Interview Mode</Label>
                <div className="flex gap-3">
                  {CARL_MODES.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => set("carl_mode", value)}
                      className={cn(
                        "flex-1 flex flex-col items-center gap-2 py-3 rounded-xl border-2 transition-colors",
                        form.carl_mode === value
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs font-semibold">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Personality */}
              <div>
                <Label>Carl Personality</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CARL_PERSONALITIES.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => set("carl_personality", p.value)}
                      className={cn(
                        "text-left p-3 rounded-xl border-2 transition-colors",
                        form.carl_personality === p.value
                          ? "border-indigo-600 bg-indigo-50"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      )}
                    >
                      <p className={cn("text-xs font-bold", form.carl_personality === p.value ? "text-indigo-700" : "text-slate-800")}>
                        {p.label}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{p.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration + Max Questions */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label>Duration</Label>
                  <div className="flex gap-2">
                    {DURATIONS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => set("carl_duration", d)}
                        className={cn(
                          "flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors",
                          form.carl_duration === d
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                        )}
                      >
                        {d}m
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Max Questions</Label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => set("carl_max_questions", Math.max(5, form.carl_max_questions - 1))}
                      className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 font-bold text-sm transition-colors"
                    >
                      −
                    </button>
                    <span className="text-sm font-bold text-slate-900 w-6 text-center">{form.carl_max_questions}</span>
                    <button
                      type="button"
                      onClick={() => set("carl_max_questions", Math.min(20, form.carl_max_questions + 1))}
                      className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 font-bold text-sm transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </FormSection>

          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50 rounded-b-2xl">
            {error && (
              <p className="text-xs font-medium text-red-600">{error}</p>
            )}
            <div className={cn("flex items-center gap-2 ml-auto", !error && "w-full justify-end")}>
              <Dialog.Close className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors">
                Cancel
              </Dialog.Close>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleSubmit("draft")}
                className="px-4 py-2 text-sm font-semibold text-slate-700 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                {isPending ? "Saving…" : "Save as Draft"}
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleSubmit("active")}
                className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 rounded-lg shadow-sm hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50"
              >
                {isPending ? "Publishing…" : "Publish Job"}
              </button>
            </div>
          </div>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ── helpers ────────────────────────────────────────────────────────────────

const inputCls =
  "w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors";

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-50 rounded-xl p-4 space-y-4">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</h3>
      {children}
    </div>
  );
}
