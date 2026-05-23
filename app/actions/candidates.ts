"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { PipelineStage } from "@/components/dashboard/pipeline/pipeline-types";

export async function getCandidateProfile(id: string) {
  const supabase = await createClient();
  await supabase.auth.getUser();

  const { data } = await supabase
    .from("candidates")
    .select(
      `id, full_name, email, phone, stage,
       ai_score, ai_recommendation, ai_summary, ai_strengths, ai_weaknesses,
       resume_url, resume_filename, created_at, updated_at, job_id,
       jobs (id, title, department, status, company, carl_mode),
       interviews (id, mode, status, invited_at, started_at, completed_at)`
    )
    .eq("id", id)
    .single();

  return data;
}

export async function getCandidateNotes(candidateId: string) {
  const supabase = await createClient();
  await supabase.auth.getUser();

  const { data } = await supabase
    .from("candidate_notes")
    .select("id, body, is_private, created_at, author:profiles!author_id(full_name)")
    .eq("candidate_id", candidateId)
    .order("created_at", { ascending: true });

  return data ?? [];
}

export async function addCandidateNote(
  candidateId: string,
  body: string,
  isPrivate: boolean
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("candidate_notes").insert({
    candidate_id: candidateId,
    author_id: user.id,
    body,
    is_private: isPrivate,
  });

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/candidates/${candidateId}`);
  return { success: true };
}

export async function updateCandidateStageFromProfile(
  candidateId: string,
  stage: PipelineStage
) {
  const supabase = await createClient();
  await supabase.auth.getUser();

  const { error } = await supabase
    .from("candidates")
    .update({ stage })
    .eq("id", candidateId);

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/candidates/${candidateId}`);
  revalidatePath("/dashboard/pipeline");
  return { success: true };
}

export async function sendInterviewInvite(
  candidateId: string,
  jobId: string,
  mode: string
) {
  const supabase = await createClient();
  await supabase.auth.getUser();

  const { data: existing } = await supabase
    .from("interviews")
    .select("id")
    .eq("candidate_id", candidateId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("interviews")
      .update({ status: "invited", invited_at: new Date().toISOString() })
      .eq("id", existing.id);
  } else {
    await supabase.from("interviews").insert({
      candidate_id: candidateId,
      job_id: jobId,
      mode,
      status: "invited",
      invited_at: new Date().toISOString(),
    });
  }

  await supabase
    .from("candidates")
    .update({ stage: "invited" })
    .eq("id", candidateId);

  revalidatePath(`/dashboard/candidates/${candidateId}`);
  revalidatePath("/dashboard/pipeline");
  return { success: true };
}
