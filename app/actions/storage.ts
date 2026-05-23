"use server";

import { createClient } from "@/lib/supabase/server";

export interface SummaryEntry {
  id: string;
  filename: string;
  fileType: string;
  status: "scored" | "error";
  aiScore: number | null;
  aiSummary: string | null;
  aiStrengths: string[];
  aiWeaknesses: string[];
  errorReason: string | null;
  storagePath: string | null;
  blobUrl?: string; // only present for in-session fresh uploads
}

export async function getJobUploads(jobId: string): Promise<SummaryEntry[]> {
  const supabase = await createClient();
  await supabase.auth.getUser();

  const { data } = await supabase
    .from("resume_uploads")
    .select("id, filename, file_type, status, ai_score, ai_summary, ai_strengths, ai_weaknesses, error_reason, storage_path")
    .eq("job_id", jobId)
    .in("status", ["scored", "error"])
    .order("created_at", { ascending: false })
    .limit(50);

  if (!data) return [];

  return data.map((r) => ({
    id: r.id,
    filename: r.filename,
    fileType: r.file_type ?? "",
    status: r.status as "scored" | "error",
    aiScore: r.ai_score,
    aiSummary: r.ai_summary ?? null,
    aiStrengths: r.ai_strengths ?? [],
    aiWeaknesses: r.ai_weaknesses ?? [],
    errorReason: r.error_reason,
    storagePath: r.storage_path ?? null,
  }));
}

export async function getResumeSignedUrl(storagePath: string): Promise<string | null> {
  const supabase = await createClient();
  await supabase.auth.getUser();

  const { data, error } = await supabase.storage
    .from("resumes")
    .createSignedUrl(storagePath, 3600);

  if (error) return null;
  return data?.signedUrl ?? null;
}
