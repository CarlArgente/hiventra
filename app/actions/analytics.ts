"use server";

import { createClient } from "@/lib/supabase/server";

export interface RawCandidate {
  full_name: string;
  ai_score: number | null;
  stage: string;
  created_at: string;
  ai_skill_breakdown: Record<string, number> | null;
}

export interface RawInterview {
  status: string;
  interview_created_at: string;
  completed_at: string | null;
  candidate_created_at: string;
  job_title: string;
}

export interface RawUpload {
  status: string;
  created_at: string;
}

export interface RawJobStat {
  title: string;
  department: string | null;
  candidates: Array<{ ai_score: number | null; stage: string }>;
  interview_count: number;
  completed_interview_count: number;
}

export interface AnalyticsData {
  allCandidates: RawCandidate[];
  allInterviews: RawInterview[];
  allUploads: RawUpload[];
  jobStats: RawJobStat[];
}

export async function getAnalyticsData(): Promise<AnalyticsData> {
  const supabase = await createClient();
  await supabase.auth.getUser();

  const [
    { data: candidateRows },
    { data: interviewRows },
    { data: uploadRows },
    { data: jobRows },
  ] = await Promise.all([
    supabase
      .from("candidates")
      .select("full_name, ai_score, stage, created_at, ai_skill_breakdown")
      .order("created_at", { ascending: true }),
    supabase
      .from("interviews")
      .select("status, created_at, completed_at, candidates(created_at), jobs(title)")
      .order("created_at", { ascending: true }),
    supabase
      .from("resume_uploads")
      .select("status, created_at")
      .order("created_at", { ascending: true }),
    supabase
      .from("jobs")
      .select("title, department, candidates(ai_score, stage), interviews(status)")
      .order("created_at", { ascending: false }),
  ]);

  const allCandidates: RawCandidate[] = (candidateRows ?? []).map((c: any) => ({
    full_name: c.full_name,
    ai_score: c.ai_score ?? null,
    stage: c.stage,
    created_at: c.created_at,
    ai_skill_breakdown: c.ai_skill_breakdown ?? null,
  }));

  const allInterviews: RawInterview[] = (interviewRows ?? []).map((i: any) => ({
    status: i.status,
    interview_created_at: i.created_at,
    completed_at: i.completed_at ?? null,
    candidate_created_at: i.candidates?.created_at ?? i.created_at,
    job_title: i.jobs?.title ?? "",
  }));

  const allUploads: RawUpload[] = (uploadRows ?? []).map((u: any) => ({
    status: u.status,
    created_at: u.created_at,
  }));

  const jobStats: RawJobStat[] = (jobRows ?? []).map((j: any) => {
    const cands = (j.candidates ?? []) as Array<{ ai_score: number | null; stage: string }>;
    const ints = (j.interviews ?? []) as Array<{ status: string }>;
    return {
      title: j.title as string,
      department: j.department as string | null,
      candidates: cands,
      interview_count: ints.length,
      completed_interview_count: ints.filter((i) => i.status === "completed").length,
    };
  });

  return { allCandidates, allInterviews, allUploads, jobStats };
}
