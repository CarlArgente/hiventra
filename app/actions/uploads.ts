"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { writeAuditEntry } from "./audit";

export interface UploadedFile {
  filename: string;
  file_size: number;
  file_type: string;
  ai_score: number | null;
  ai_summary: string | null;
  ai_strengths: string[];
  ai_weaknesses: string[];
  error_reason: string | null;
  status: "scored" | "error";
  storage_path: string | null;
  email: string | null;
  full_name: string | null;
}

export async function submitUploadBatch(jobId: string, files: UploadedFile[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: jobRow } = await supabase
    .from("jobs")
    .select("title")
    .eq("id", jobId)
    .single();
  const jobTitle = (jobRow as any)?.title ?? "Unknown Job";

  const results: { uploadId: string; candidateId: string | null }[] = [];

  for (const file of files) {
    let candidateId: string | null = null;

    if (file.status === "scored" && file.ai_score !== null) {
      const fallbackName = file.filename.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      const fallbackEmail = `parsed_${Date.now()}_${Math.random().toString(36).slice(2)}@placeholder.com`;
      const { data: candidate } = await supabase
        .from("candidates")
        .insert({
          job_id: jobId,
          email: file.email ?? fallbackEmail,
          full_name: file.full_name ?? fallbackName,
          resume_filename: file.filename,
          resume_url: file.storage_path,
          stage: "uploaded",
          ai_score: file.ai_score,
          ai_summary: file.ai_summary,
          ai_strengths: file.ai_strengths,
          ai_weaknesses: file.ai_weaknesses,
        })
        .select("id")
        .single();

      candidateId = candidate?.id ?? null;

      if (candidateId) {
        await writeAuditEntry({
          event_type: "resume_scored",
          candidate_id: candidateId,
          candidate_name: file.full_name ?? file.filename,
          job_id: jobId,
          job_title: jobTitle,
          ai_score: file.ai_score,
          ai_recommendation: null,
          human_action: "no_action",
          is_override: false,
          ai_justification: file.ai_summary,
        });
      }
    }

    const { data: upload } = await supabase
      .from("resume_uploads")
      .insert({
        job_id: jobId,
        uploaded_by: user.id,
        filename: file.filename,
        file_size: file.file_size,
        file_type: file.file_type,
        status: file.status,
        error_reason: file.error_reason,
        ai_score: file.ai_score,
        ai_summary: file.ai_summary,
        ai_strengths: file.ai_strengths,
        ai_weaknesses: file.ai_weaknesses,
        candidate_id: candidateId,
        storage_path: file.storage_path,
      })
      .select("id")
      .single();

    results.push({ uploadId: upload?.id ?? "", candidateId });
  }

  revalidatePath("/dashboard/upload");
  revalidatePath("/dashboard/jobs");
  return { success: true, results };
}
