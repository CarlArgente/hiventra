"use server";

import { createClient } from "@/lib/supabase/server";

export interface DashboardKPI {
  activeJobs: number;
  resumesUploaded: number;
  interviewsCompleted: number;
  recommended: number;
  resumesDelta: number;
  interviewsDelta: number;
  recommendedDelta: number;
  activeJobsDelta: number;
}

export interface DashboardJob {
  id: string;
  title: string;
  department: string | null;
  status: string;
  applicantCount: number;
}

export interface DashboardActivity {
  id: string;
  eventType: string;
  candidateName: string;
  jobTitle: string;
  createdAt: string;
}

export interface DashboardPipelineStage {
  label: string;
  stage: string;
  count: number;
}

export interface DashboardData {
  userName: string;
  kpis: DashboardKPI;
  jobs: DashboardJob[];
  activity: DashboardActivity[];
  pipeline: DashboardPipelineStage[];
}

const STAGE_ORDER = [
  { stage: "uploaded", label: "Uploaded" },
  { stage: "screened", label: "Screened" },
  { stage: "invited", label: "Invited" },
  { stage: "interview_started", label: "Started" },
  { stage: "completed", label: "Completed" },
  { stage: "recommended", label: "Recommended" },
  { stage: "hired", label: "Hired" },
];

export async function getDashboardData(): Promise<DashboardData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const now = new Date();
  const thirtyAgo = new Date(now.getTime() - 30 * 86400000).toISOString();
  const sixtyAgo = new Date(now.getTime() - 60 * 86400000).toISOString();

  const [
    { data: profile },
    { count: activeJobs },
    { count: activeJobsPrev },
    { count: resumesThis },
    { count: resumesPrev },
    { count: interviewsThis },
    { count: interviewsPrev },
    { count: recommendedNow },
    { count: recommendedPrev },
    { data: jobRows },
    { data: activityRows },
    { data: candidateRows },
  ] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    supabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "active").lt("created_at", thirtyAgo),
    supabase.from("resume_uploads").select("*", { count: "exact", head: true }).gte("created_at", thirtyAgo),
    supabase.from("resume_uploads").select("*", { count: "exact", head: true }).gte("created_at", sixtyAgo).lt("created_at", thirtyAgo),
    supabase.from("interviews").select("*", { count: "exact", head: true }).eq("status", "completed").gte("completed_at", thirtyAgo),
    supabase.from("interviews").select("*", { count: "exact", head: true }).eq("status", "completed").gte("completed_at", sixtyAgo).lt("completed_at", thirtyAgo),
    supabase.from("candidates").select("*", { count: "exact", head: true }).eq("stage", "recommended"),
    supabase.from("candidates").select("*", { count: "exact", head: true }).eq("stage", "recommended").lt("updated_at", thirtyAgo),
    supabase.from("jobs").select("id, title, department, status, candidates(id)").order("created_at", { ascending: false }).limit(6),
    supabase.from("ai_audit_log").select("id, event_type, candidate_name, job_title, created_at").order("created_at", { ascending: false }).limit(8),
    supabase.from("candidates").select("stage"),
  ]);

  const stageCounts = (candidateRows ?? []).reduce<Record<string, number>>((acc, c: any) => {
    acc[c.stage] = (acc[c.stage] ?? 0) + 1;
    return acc;
  }, {});

  const pipeline: DashboardPipelineStage[] = STAGE_ORDER.map(({ stage, label }) => ({
    stage,
    label,
    count: stageCounts[stage] ?? 0,
  }));

  const jobs: DashboardJob[] = (jobRows ?? []).map((j: any) => ({
    id: j.id,
    title: j.title,
    department: j.department ?? null,
    status: j.status,
    applicantCount: (j.candidates ?? []).length,
  }));

  const activity: DashboardActivity[] = (activityRows ?? []).map((a: any) => ({
    id: a.id,
    eventType: a.event_type as string,
    candidateName: a.candidate_name as string,
    jobTitle: a.job_title as string,
    createdAt: a.created_at as string,
  }));

  const kpis: DashboardKPI = {
    activeJobs: activeJobs ?? 0,
    resumesUploaded: resumesThis ?? 0,
    interviewsCompleted: interviewsThis ?? 0,
    recommended: recommendedNow ?? 0,
    activeJobsDelta: (activeJobs ?? 0) - (activeJobsPrev ?? 0),
    resumesDelta: (resumesThis ?? 0) - (resumesPrev ?? 0),
    interviewsDelta: (interviewsThis ?? 0) - (interviewsPrev ?? 0),
    recommendedDelta: (recommendedNow ?? 0) - (recommendedPrev ?? 0),
  };

  return {
    userName: (profile as any)?.full_name?.split(" ")[0] ?? "there",
    kpis,
    jobs,
    activity,
    pipeline,
  };
}
