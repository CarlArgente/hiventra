"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  PipelineStage,
  PipelineJob,
  PipelineCandidate,
} from "@/components/dashboard/pipeline/pipeline-types";

export async function getPipelineJobs(): Promise<PipelineJob[]> {
  const supabase = await createClient();
  await supabase.auth.getUser();

  const { data } = await supabase
    .from("jobs")
    .select("id, title, department, status, created_at, carl_mode")
    .in("status", ["active", "closed"])
    .order("created_at", { ascending: false });

  return (data ?? []) as PipelineJob[];
}

export async function getCandidatesForJob(jobId: string): Promise<PipelineCandidate[]> {
  const supabase = await createClient();
  await supabase.auth.getUser();

  const { data } = await supabase
    .from("candidates")
    .select(
      `id, full_name, email, stage, ai_score, ai_recommendation,
       ai_summary, resume_filename, resume_url, created_at, updated_at,
       interviews(mode, status, ai_score, ai_analyzed_at)`
    )
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });

  if (!data) return [];

  return data.map((c) => {
    const iv = Array.isArray(c.interviews) ? c.interviews[0] : null;
    const ivTyped = iv as { mode?: string; status?: string; ai_score?: number | null; ai_analyzed_at?: string | null } | null;
    const hasReport = !!(ivTyped?.ai_analyzed_at);
    return {
      id: c.id,
      full_name: c.full_name,
      email: c.email,
      stage: c.stage as PipelineStage,
      ai_score: c.ai_score,
      ai_recommendation: c.ai_recommendation,
      ai_summary: c.ai_summary,
      resume_filename: c.resume_filename,
      resume_url: c.resume_url,
      created_at: c.created_at,
      updated_at: c.updated_at,
      interview_mode: ivTyped?.mode ?? null,
      interview_status: ivTyped?.status ?? null,
      interview_ai_score: ivTyped?.ai_score ?? null,
      has_intelligence_report: hasReport,
    };
  });
}

export async function updateCandidateStage(candidateId: string, stage: PipelineStage) {
  const supabase = await createClient();
  await supabase.auth.getUser();

  const { error } = await supabase
    .from("candidates")
    .update({ stage })
    .eq("id", candidateId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/pipeline");
  return { success: true };
}

export async function bulkUpdateStage(candidateIds: string[], stage: PipelineStage) {
  const supabase = await createClient();
  await supabase.auth.getUser();

  const { error } = await supabase
    .from("candidates")
    .update({ stage })
    .in("id", candidateIds);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/pipeline");
  return { success: true };
}
