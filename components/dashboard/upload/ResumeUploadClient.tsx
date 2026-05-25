"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  CloudUpload,
  FileText,
  File,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  Sparkles,
  ChevronDown,
  Users,
  BarChart3,
  RefreshCw,
  Briefcase,
  TrendingUp,
  TrendingDown,
  Info,
  Eye,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { submitUploadBatch, UploadedFile } from "@/app/actions/uploads";
import { SummaryEntry, getJobUploads, getResumeSignedUrl } from "@/app/actions/storage";

type FileStatus = "queued" | "uploading" | "parsing" | "scored" | "error";

interface QueuedFile {
  id: string;
  file: File;
  blobUrl: string;
  status: FileStatus;
  progress: number;
  aiScore: number | null;
  aiSummary: string | null;
  aiStrengths: string[];
  aiWeaknesses: string[];
  errorReason: string | null;
  storagePath: string | null;
}

interface ActiveJob {
  id: string;
  title: string;
  department: string | null;
  required_skills: string[] | null;
  description: string | null;
}

interface Props {
  activeJobs: ActiveJob[];
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ type, className }: { type: string; className?: string }) {
  const isPdf = type === "application/pdf";
  return (
    <div
      className={cn(
        "flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0",
        isPdf ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-500",
        className
      )}
    >
      {isPdf ? <FileText className="w-5 h-5" /> : <File className="w-5 h-5" />}
    </div>
  );
}

function StatusBadge({ status, score }: { status: FileStatus; score: number | null }) {
  const configs: Record<FileStatus, { label: string; icon: React.ReactNode; cls: string }> = {
    queued: { label: "Queued", icon: <Clock className="w-3 h-3" />, cls: "bg-slate-100 text-slate-600" },
    uploading: { label: "Uploading", icon: <Loader2 className="w-3 h-3 animate-spin" />, cls: "bg-blue-50 text-blue-600" },
    parsing: { label: "Scoring with AI…", icon: <Loader2 className="w-3 h-3 animate-spin" />, cls: "bg-purple-50 text-purple-600" },
    scored: {
      label: score !== null ? `Score: ${score}/100` : "Scored",
      icon: <Sparkles className="w-3 h-3" />,
      cls: "bg-emerald-50 text-emerald-600",
    },
    error: { label: "Error", icon: <AlertCircle className="w-3 h-3" />, cls: "bg-red-50 text-red-600" },
  };
  const c = configs[status];
  return (
    <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap", c.cls)}>
      {c.icon}
      {c.label}
    </span>
  );
}

function ScoreRing({ score }: { score: number }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 75 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" className="flex-shrink-0">
      <circle cx="48" cy="48" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="8" />
      <circle
        cx="48" cy="48" r={radius} fill="none"
        stroke={color} strokeWidth="8"
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 48 48)"
      />
      <text x="48" y="44" textAnchor="middle" fontSize="20" fontWeight="700" fill={color}>{score}</text>
      <text x="48" y="60" textAnchor="middle" fontSize="11" fill="#94a3b8">/100</text>
    </svg>
  );
}

export default function ResumeUploadClient({ activeJobs }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedJobId, setSelectedJobId] = useState(activeJobs[0]?.id ?? "");
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showUploadZone, setShowUploadZone] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<SummaryEntry[]>([]);
  const [detailEntry, setDetailEntry] = useState<SummaryEntry | null>(null);
  const [previewEntry, setPreviewEntry] = useState<SummaryEntry | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const selectedJob = activeJobs.find((j) => j.id === selectedJobId);

  // Load persisted uploads from DB whenever job selection changes
  useEffect(() => {
    if (!selectedJobId || isProcessing) return;
    let cancelled = false;

    setQueue((prev) => {
      prev.forEach((f) => URL.revokeObjectURL(f.blobUrl));
      return [];
    });
    setSummaryData([]);
    setShowUploadZone(true);
    setSubmitError(null);

    getJobUploads(selectedJobId).then((data) => {
      if (cancelled || data.length === 0) return;
      setSummaryData(data);
      setShowUploadZone(false);
    });

    return () => {
      cancelled = true;
    };
  }, [selectedJobId]); // eslint-disable-line react-hooks/exhaustive-deps

  function addFiles(fileList: FileList | File[]) {
    const arr = Array.from(fileList);
    const allowed = arr.filter(
      (f) =>
        f.type === "application/pdf" ||
        f.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    setQueue((prev) => {
      const toAdd: QueuedFile[] = allowed.slice(0, 50 - prev.length).map((f) => ({
        id: `${f.name}-${f.size}-${Date.now()}-${Math.random()}`,
        file: f,
        blobUrl: URL.createObjectURL(f),
        status: "queued",
        progress: 0,
        aiScore: null,
        aiSummary: null,
        aiStrengths: [],
        aiWeaknesses: [],
        errorReason: null,
        storagePath: null,
      }));
      return [...prev, ...toAdd];
    });
  }

  function removeFile(id: string) {
    setQueue((prev) => {
      const removed = prev.find((f) => f.id === id);
      if (removed) URL.revokeObjectURL(removed.blobUrl);
      return prev.filter((f) => f.id !== id);
    });
  }

  function clearAll() {
    setQueue((prev) => {
      prev.forEach((f) => URL.revokeObjectURL(f.blobUrl));
      return [];
    });
  }

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);
  const onDragLeave = useCallback(() => setIsDragOver(false), []);
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    addFiles(e.dataTransfer.files);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startProcessing() {
    if (!selectedJobId || queue.length === 0 || isProcessing) return;
    setIsProcessing(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id ?? "anon";

    const snapshot = [...queue];
    const ids = snapshot.map((f) => f.id);

    // Phase 1: stagger-start uploading animation
    for (let i = 0; i < ids.length; i++) {
      await new Promise<void>((resolve) =>
        setTimeout(() => {
          setQueue((prev) =>
            prev.map((f) => (f.id === ids[i] ? { ...f, status: "uploading", progress: 0 } : f))
          );
          resolve();
        }, i * 100)
      );
    }

    // Phase 2: progress bars
    await new Promise<void>((resolve) => {
      let ticks = 0;
      const interval = setInterval(() => {
        ticks++;
        setQueue((prev) =>
          prev.map((f) =>
            f.status === "uploading"
              ? { ...f, progress: Math.min(f.progress + Math.random() * 30 + 15, 100) }
              : f
          )
        );
        if (ticks >= 4) {
          clearInterval(interval);
          resolve();
        }
      }, 200);
    });

    // All → parsing
    setQueue((prev) =>
      prev.map((f) => (ids.includes(f.id) ? { ...f, status: "parsing", progress: 100 } : f))
    );

    // Phase 3: parallel storage upload + Claude scoring per file
    const results: Record<
      string,
      {
        status: FileStatus;
        aiScore: number | null;
        aiSummary: string | null;
        aiStrengths: string[];
        aiWeaknesses: string[];
        errorReason: string | null;
        storagePath: string | null;
        email: string | null;
        candidateName: string | null;
      }
    > = {};

    await Promise.all(
      snapshot.map(async (qf) => {
        const [storagePath, res] = await Promise.all([
          // Upload to Supabase Storage
          (async (): Promise<string | null> => {
            try {
              const safeName = qf.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
              const path = `${userId}/${selectedJobId}/${Date.now()}_${safeName}`;
              const { data: up, error } = await supabase.storage
                .from("resumes")
                .upload(path, qf.file, { contentType: qf.file.type, upsert: false });
              return error ? null : (up?.path ?? null);
            } catch {
              return null;
            }
          })(),
          // Score with Claude
          (async () => {
            try {
              const fd = new FormData();
              fd.append("file", qf.file);
              fd.append("jobTitle", selectedJob?.title ?? "");
              fd.append("requiredSkills", JSON.stringify(selectedJob?.required_skills ?? []));
              const http = await fetch("/api/score-resume", { method: "POST", body: fd });
              return await http.json();
            } catch {
              return { error: "Network error" };
            }
          })(),
        ]);

        const PASSING_SCORE = 75;
        if (res.error) {
          results[qf.id] = {
            status: "error", aiScore: null, aiSummary: null,
            aiStrengths: [], aiWeaknesses: [], errorReason: res.error, storagePath,
            email: null, candidateName: null,
          };
        } else if ((res.score ?? 0) < PASSING_SCORE) {
          results[qf.id] = {
            status: "error", aiScore: res.score ?? null, aiSummary: res.summary ?? null,
            aiStrengths: res.strengths ?? [], aiWeaknesses: res.weaknesses ?? [],
            errorReason: `Score too low (${res.score}/100) — minimum passing score is ${PASSING_SCORE}`,
            storagePath, email: res.email ?? null, candidateName: res.full_name ?? null,
          };
        } else {
          results[qf.id] = {
            status: "scored", aiScore: res.score ?? null, aiSummary: res.summary ?? null,
            aiStrengths: res.strengths ?? [], aiWeaknesses: res.weaknesses ?? [],
            errorReason: null, storagePath, email: res.email ?? null, candidateName: res.full_name ?? null,
          };
        }

        setQueue((prev) =>
          prev.map((f) => (f.id === qf.id ? { ...f, ...results[qf.id] } : f))
        );
      })
    );

    // Phase 4: Persist to DB
    const payload: UploadedFile[] = snapshot.map((qf) => {
      const r = results[qf.id];
      return {
        filename: qf.file.name,
        file_size: qf.file.size,
        file_type: qf.file.type,
        ai_score: r?.aiScore ?? null,
        ai_summary: r?.aiSummary ?? null,
        ai_strengths: r?.aiStrengths ?? [],
        ai_weaknesses: r?.aiWeaknesses ?? [],
        error_reason: r?.errorReason ?? null,
        status: r?.status === "error" ? "error" : "scored",
        storage_path: r?.storagePath ?? null,
        email: r?.email ?? null,
        full_name: r?.candidateName ?? null,
      };
    });

    const dbResult = await submitUploadBatch(selectedJobId, payload);
    if ("error" in dbResult && dbResult.error) setSubmitError(dbResult.error);

    // Phase 5: Build summaryData with blob URLs for in-session preview
    const newSummary: SummaryEntry[] = snapshot.map((qf) => {
      const r = results[qf.id];
      return {
        id: qf.id,
        filename: qf.file.name,
        fileType: qf.file.type,
        status: (r?.status === "scored" ? "scored" : "error") as "scored" | "error",
        aiScore: r?.aiScore ?? null,
        aiSummary: r?.aiSummary ?? null,
        aiStrengths: r?.aiStrengths ?? [],
        aiWeaknesses: r?.aiWeaknesses ?? [],
        errorReason: r?.errorReason ?? null,
        storagePath: r?.storagePath ?? null,
        blobUrl: qf.blobUrl,
      };
    });
    // Re-fetch full DB state so previous + new uploads all appear
    const freshDbData = await getJobUploads(selectedJobId);
    setSummaryData(freshDbData.length > 0 ? freshDbData : newSummary);

    setIsProcessing(false);
    setShowUploadZone(false);
  }

  function resetUpload() {
    setQueue((prev) => {
      prev.forEach((f) => URL.revokeObjectURL(f.blobUrl));
      return [];
    });
    setShowUploadZone(true);
    setSubmitError(null);
  }

  async function openPreview(entry: SummaryEntry) {
    setPreviewEntry(entry);
    setPreviewUrl(null);
    setPreviewLoading(true);
    if (entry.blobUrl) {
      setPreviewUrl(entry.blobUrl);
      setPreviewLoading(false);
    } else if (entry.storagePath) {
      const url = await getResumeSignedUrl(entry.storagePath);
      setPreviewUrl(url);
      setPreviewLoading(false);
    } else {
      setPreviewLoading(false);
    }
  }

  const summaryScored = summaryData.filter((e) => e.status === "scored");
  const summaryErrors = summaryData.filter((e) => e.status === "error");
  const avgScore =
    summaryScored.length > 0
      ? Math.round(summaryScored.reduce((sum, e) => sum + (e.aiScore ?? 0), 0) / summaryScored.length)
      : 0;

  if (activeJobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-amber-500" />
        </div>
        <div className="text-center">
          <p className="text-slate-800 font-semibold text-lg">No active job postings</p>
          <p className="text-slate-500 text-sm mt-1">
            You need an active job posting to upload resumes.
          </p>
        </div>
        <a
          href="/jobs"
          className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold shadow-[0_4px_14px_0_rgba(79,70,229,0.3)] hover:-translate-y-0.5 transition-all duration-200"
        >
          Create Job
        </a>
      </div>
    );
  }

  return (
    <>
      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[440px_1fr] gap-6 items-start">

        {/* ── Left column: job info, sticky, fills viewport height ── */}
        <div className="lg:sticky lg:top-6 lg:h-[calc(100vh-5.5rem)] flex flex-col gap-4">

          {/* Job selector */}
          <div className="shrink-0 bg-white rounded-xl border border-slate-100 shadow-[0_4px_20px_-2px_rgba(79,70,229,0.08)] p-5">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Upload resumes for:
            </label>
            <div className="relative">
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                disabled={isProcessing}
                className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-4 py-2.5 pr-10 text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {activeJobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                    {job.department ? ` — ${job.department}` : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Job description — fills remaining height */}
          {selectedJob?.description ? (
            <div className="flex-1 min-h-0 bg-white rounded-xl border border-slate-100 shadow-[0_4px_20px_-2px_rgba(79,70,229,0.08)] flex flex-col overflow-hidden">
              <div className="px-5 pt-5 pb-3 shrink-0 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-500" />
                <span className="text-sm font-semibold text-slate-700">Job Description</span>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-5">
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {selectedJob.description}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 min-h-0" />
          )}

          {/* Required skills */}
          {selectedJob?.required_skills && selectedJob.required_skills.length > 0 && (
            <div className="shrink-0 bg-white rounded-xl border border-slate-100 shadow-[0_4px_20px_-2px_rgba(79,70,229,0.08)] p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span className="text-sm font-semibold text-slate-700">Required Skills</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedJob.required_skills.map((skill) => (
                  <span key={skill} className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right column ── */}
        <div className="min-w-0 space-y-4">

          {/* Upload zone */}
          {showUploadZone && (
            <>
              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => !isProcessing && fileInputRef.current?.click()}
                className={cn(
                  "relative border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-200",
                  isDragOver
                    ? "border-indigo-500 bg-indigo-50/60 scale-[1.01]"
                    : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50/50",
                  isProcessing && "pointer-events-none opacity-60"
                )}
              >
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-200",
                  isDragOver ? "bg-indigo-100 text-indigo-600" : "bg-indigo-50 text-indigo-500"
                )}>
                  <CloudUpload className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <p className="text-slate-800 font-semibold text-base">Drag &amp; drop resumes here</p>
                  <p className="text-slate-500 text-sm mt-1">Supports PDF and DOCX — up to 50 files per session</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  disabled={isProcessing}
                  className="mt-1 px-5 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 shadow-sm"
                >
                  Browse Files
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={(e) => e.target.files && addFiles(e.target.files)}
                />
              </div>

              {summaryData.length > 0 && queue.length === 0 && (
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowUploadZone(false)}
                    className="text-sm text-slate-400 hover:text-slate-600 transition-colors underline underline-offset-2"
                  >
                    ← Back to results
                  </button>
                </div>
              )}

              {queue.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-100 shadow-[0_4px_20px_-2px_rgba(79,70,229,0.08)] overflow-hidden">
                  <div className="divide-y divide-slate-100">
                    {queue.map((item) => (
                      <div key={item.id} className="px-5 py-3.5 flex items-center gap-4">
                        <FileIcon type={item.file.type} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-800 truncate">{item.file.name}</span>
                            <span className="text-xs text-slate-400 flex-shrink-0">{formatBytes(item.file.size)}</span>
                          </div>
                          {(item.status === "uploading" || item.status === "parsing") && (
                            <div className="mt-1.5 h-1 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all duration-300",
                                  item.status === "parsing"
                                    ? "bg-gradient-to-r from-purple-500 to-violet-500 w-full animate-pulse"
                                    : "bg-gradient-to-r from-indigo-500 to-violet-500"
                                )}
                                style={item.status === "uploading" ? { width: `${item.progress}%` } : undefined}
                              />
                            </div>
                          )}
                          {item.status === "scored" && item.aiSummary && (
                            <p className="text-xs text-slate-500 mt-0.5 truncate">{item.aiSummary}</p>
                          )}
                          {item.status === "error" && item.errorReason && (
                            <p className="text-xs text-red-500 mt-0.5 truncate">{item.errorReason}</p>
                          )}
                        </div>
                        <StatusBadge status={item.status} score={item.aiScore} />
                        {item.status === "queued" && (
                          <button
                            onClick={() => removeFile(item.id)}
                            className="text-slate-300 hover:text-slate-500 transition-colors flex-shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <span>
                        <span className="font-semibold text-slate-700">{queue.length}</span>{" "}
                        file{queue.length !== 1 ? "s" : ""}
                      </span>
                      {!isProcessing && (
                        <button onClick={clearAll} className="text-slate-400 hover:text-red-500 text-sm transition-colors underline underline-offset-2">
                          Clear all
                        </button>
                      )}
                    </div>
                    <button
                      onClick={startProcessing}
                      disabled={isProcessing || queue.length === 0}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold shadow-[0_4px_14px_0_rgba(79,70,229,0.3)] hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all duration-200"
                    >
                      {isProcessing ? (
                        <><Loader2 className="w-4 h-4 animate-spin" />Processing…</>
                      ) : (
                        <><CloudUpload className="w-4 h-4" />Start Upload</>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Summary */}
          {summaryData.length > 0 && (
            <div className="space-y-4">
              {submitError && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {submitError}
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-xl border border-slate-100 shadow-[0_4px_20px_-2px_rgba(79,70,229,0.08)] p-4 flex flex-col items-center text-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <p className="text-2xl font-bold text-slate-900 leading-none">{summaryScored.length}</p>
                  <p className="text-xs text-slate-500 leading-tight">Parsed Successfully</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-100 shadow-[0_4px_20px_-2px_rgba(79,70,229,0.08)] p-4 flex flex-col items-center text-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                  </div>
                  <p className="text-2xl font-bold text-slate-900 leading-none">{summaryErrors.length}</p>
                  <p className="text-xs text-slate-500 leading-tight">Failed</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-100 shadow-[0_4px_20px_-2px_rgba(79,70,229,0.08)] p-4 flex flex-col items-center text-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="w-4 h-4 text-indigo-500" />
                  </div>
                  <p className="text-2xl font-bold text-slate-900 leading-none">{avgScore}<span className="text-sm font-medium text-slate-400">/100</span></p>
                  <p className="text-xs text-slate-500 leading-tight">Avg Match Score</p>
                </div>
              </div>

              {/* Scored files */}
              {summaryScored.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-100 shadow-[0_4px_20px_-2px_rgba(79,70,229,0.08)] overflow-hidden">
                  <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <span className="text-sm font-semibold text-slate-700">AI Scoring Results</span>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {summaryScored.map((e) => (
                      <div key={e.id} className="px-4 py-3 space-y-2">
                        <div className="flex items-center gap-3">
                          <FileIcon type={e.fileType} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-700 truncate">{e.filename}</p>
                            {e.aiSummary && (
                              <p className="text-xs text-slate-500 mt-0.5 truncate">{e.aiSummary}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2 pl-12">
                          <StatusBadge status={e.status} score={e.aiScore} />
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => openPreview(e)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Preview
                            </button>
                            <button
                              onClick={() => setDetailEntry(e)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-100 bg-indigo-50 text-indigo-600 text-xs font-semibold hover:bg-indigo-100 transition-colors"
                            >
                              <Info className="w-3.5 h-3.5" />
                              Details
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Failed files */}
              {summaryErrors.length > 0 && (
                <div className="bg-white rounded-xl border border-red-100 shadow-[0_4px_20px_-2px_rgba(79,70,229,0.08)] overflow-hidden">
                  <div className="px-5 py-3 border-b border-red-50 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-semibold text-slate-700">Failed Resumes</span>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {summaryErrors.map((e) => (
                      <div key={e.id} className="px-4 py-3 space-y-2">
                        <div className="flex items-center gap-3">
                          <FileIcon type={e.fileType} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-700 truncate">{e.filename}</p>
                            {e.aiSummary && (
                              <p className="text-xs text-slate-500 mt-0.5 truncate">{e.aiSummary}</p>
                            )}
                            <p className="text-xs text-red-500 mt-0.5 truncate">{e.errorReason}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2 pl-12">
                          {e.aiScore !== null ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600 whitespace-nowrap">
                              <AlertCircle className="w-3 h-3" />
                              {e.aiScore}/100
                            </span>
                          ) : <span />}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => openPreview(e)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Preview
                            </button>
                            <button
                              onClick={() => setDetailEntry(e)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-100 bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors"
                            >
                              <Info className="w-3.5 h-3.5" />
                              Details
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CTAs */}
              <div className="flex items-center gap-3 pt-2">
                <a
                  href="/candidates"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold shadow-[0_4px_14px_0_rgba(79,70,229,0.3)] hover:-translate-y-0.5 transition-all duration-200"
                >
                  <Users className="w-4 h-4" />
                  View Candidates
                </a>
                {!showUploadZone && (
                  <button
                    onClick={resetUpload}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Upload More Resumes
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Detail dialog ── */}
      <Dialog.Root open={!!detailEntry} onOpenChange={(open) => !open && setDetailEntry(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200 focus:outline-none">
            {detailEntry && (
              <>
                <div className={cn(
                  "px-6 py-5 flex items-start justify-between",
                  detailEntry.status === "scored"
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600"
                    : "bg-gradient-to-r from-red-500 to-rose-600"
                )}>
                  <div className="flex-1 min-w-0 pr-4">
                    <Dialog.Title className="text-white font-semibold text-base truncate">
                      {detailEntry.filename.replace(/\.[^/.]+$/, "")}
                    </Dialog.Title>
                    <Dialog.Description className="text-white/70 text-xs mt-0.5">
                      AI Resume Breakdown · {selectedJob?.title ?? ""}
                    </Dialog.Description>
                  </div>
                  <Dialog.Close asChild>
                    <button className="text-white/70 hover:text-white transition-colors flex-shrink-0 mt-0.5">
                      <X className="w-5 h-5" />
                    </button>
                  </Dialog.Close>
                </div>
                <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                  <div className="flex items-start gap-5">
                    {detailEntry.aiScore !== null && <ScoreRing score={detailEntry.aiScore} />}
                    <div className="flex-1 pt-1">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">AI Summary</p>
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {detailEntry.aiSummary ?? "No summary available."}
                      </p>
                      {detailEntry.status === "error" && detailEntry.errorReason && (
                        <p className="mt-2 text-xs text-red-500 font-medium">{detailEntry.errorReason}</p>
                      )}
                    </div>
                  </div>
                  {detailEntry.aiStrengths.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm font-semibold text-slate-700">Strengths</span>
                      </div>
                      <ul className="space-y-2">
                        {detailEntry.aiStrengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-slate-600">{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {detailEntry.aiWeaknesses.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingDown className="w-4 h-4 text-red-500" />
                        <span className="text-sm font-semibold text-slate-700">Areas for Improvement</span>
                      </div>
                      <ul className="space-y-2">
                        {detailEntry.aiWeaknesses.map((w, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-slate-600">{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* ── Preview drawer ── */}
      {previewEntry && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          onClick={() => setPreviewEntry(null)}
        />
      )}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-[680px] max-w-[90vw] bg-white shadow-2xl flex flex-col",
          "transform transition-transform duration-300 ease-in-out",
          previewEntry ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Drawer header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-4 shrink-0">
          {previewEntry && <FileIcon type={previewEntry.fileType} />}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{previewEntry?.filename}</p>
            <p className="text-xs text-slate-400 mt-0.5">Resume Preview</p>
          </div>
          {previewUrl && (
            <a
              href={previewUrl}
              download={previewEntry?.filename}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors flex-shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </a>
          )}
          <button
            onClick={() => setPreviewEntry(null)}
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
          {!previewLoading && previewEntry?.fileType === "application/pdf" && previewUrl && (
            <iframe src={previewUrl} className="w-full h-full border-none" title="Resume Preview" />
          )}
          {!previewLoading && previewEntry?.fileType !== "application/pdf" && previewUrl && (
            <div className="flex flex-col items-center justify-center h-full gap-4 px-6">
              <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center">
                <File className="w-10 h-10 text-blue-400" />
              </div>
              <div className="text-center">
                <p className="text-slate-700 font-semibold">DOCX files can&apos;t be previewed in browser</p>
                <p className="text-slate-400 text-sm mt-1">Download the file to view its contents</p>
              </div>
              <a
                href={previewUrl}
                download={previewEntry?.filename}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold shadow-[0_4px_14px_0_rgba(79,70,229,0.3)] hover:-translate-y-0.5 transition-all duration-200"
              >
                <Download className="w-4 h-4" />
                Download {previewEntry?.filename}
              </a>
            </div>
          )}
          {!previewLoading && !previewUrl && previewEntry && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
              <AlertCircle className="w-8 h-8" />
              <p className="text-sm">Preview not available — file may not have been saved to storage</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
