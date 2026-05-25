"use server";

import { createClient } from "@/lib/supabase/server";

export interface CollaborationJobSummary {
  id: string;
  title: string;
  company: string;
  department: string | null;
  status: string;
}

export interface CollaborationJob {
  id: string;
  title: string;
  department: string | null;
  company: string;
}

export interface CollaborationCandidate {
  id: string;
  full_name: string;
  email: string;
  stage: string;
  ai_score: number | null;
  ai_recommendation: string | null;
  ai_summary: string | null;
  ai_skill_breakdown: Record<string, number> | null;
}

export async function getJobsForCollaboration(): Promise<CollaborationJobSummary[]> {
  const supabase = await createClient();
  await supabase.auth.getUser();

  const { data } = await supabase
    .from("jobs")
    .select("id, title, company, department, status")
    .order("created_at", { ascending: false });

  return (data as CollaborationJobSummary[]) ?? [];
}

export async function getCollaborationData(jobId: string): Promise<{
  job: CollaborationJob | null;
  candidates: CollaborationCandidate[];
}> {
  const supabase = await createClient();
  await supabase.auth.getUser();

  const [{ data: job }, { data: candidates }] = await Promise.all([
    supabase
      .from("jobs")
      .select("id, title, department, company")
      .eq("id", jobId)
      .single(),
    supabase
      .from("candidates")
      .select("id, full_name, email, stage, ai_score, ai_recommendation, ai_summary, ai_skill_breakdown")
      .eq("job_id", jobId)
      .order("ai_score", { ascending: false, nullsFirst: false }),
  ]);

  return {
    job: (job as CollaborationJob | null) ?? null,
    candidates: (candidates as CollaborationCandidate[]) ?? [],
  };
}
