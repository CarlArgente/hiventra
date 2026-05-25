"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface AuditEntry {
  id: string;
  event_type: "resume_scored" | "interview_analyzed" | "stage_changed";
  candidate_id: string;
  candidate_name: string;
  job_id: string;
  job_title: string;
  ai_score: number | null;
  ai_recommendation: string | null;
  human_action: string | null;
  human_action_by_name: string | null;
  ai_justification: string | null;
  is_override: boolean;
  created_at: string;
}

export interface AnomalyAlert {
  id: string;
  job_id: string | null;
  job_title: string | null;
  description: string;
  severity: "low" | "medium" | "high";
  status: "open" | "reviewed";
  detected_at: string;
  reviewed_at: string | null;
  reviewer_name: string | null;
}

export interface AuditStats {
  total_decisions: number;
  override_count: number;
  avg_resume_score: number | null;
  avg_interview_score: number | null;
}

export interface JobScoreDistribution {
  job_title: string;
  scores: number[];
  min: number;
  max: number;
  avg: number;
  median: number;
}

export interface ExplainabilityCandidate {
  id: string;
  full_name: string;
  email: string;
  job_title: string;
  // Resume
  resume_score: number | null;
  resume_recommendation: string | null;
  resume_summary: string | null;
  resume_strengths: string[] | null;
  resume_weaknesses: string[] | null;
  resume_scored_at: string | null;
  // Interview
  interview_score: number | null;
  interview_recommendation: string | null;
  interview_summary: string | null;
  interview_strengths: string[] | null;
  interview_weaknesses: string[] | null;
  interview_skill_breakdown: Record<string, number> | null;
  interview_analyzed_at: string | null;
}

export interface AuditFilters {
  job_id?: string;
  date_from?: string;
  date_to?: string;
  recommendation?: string;
  is_override?: boolean;
  page?: number;
}

const PAGE_SIZE = 25;

export async function getAuditLog(filters: AuditFilters = {}): Promise<{
  entries: AuditEntry[];
  total: number;
}> {
  const supabase = await createClient();
  await supabase.auth.getUser();

  const page = filters.page ?? 1;
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("ai_audit_log")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters.job_id) query = query.eq("job_id", filters.job_id);
  if (filters.date_from) query = query.gte("created_at", filters.date_from);
  if (filters.date_to) query = query.lte("created_at", filters.date_to + "T23:59:59Z");
  if (filters.recommendation) query = query.eq("ai_recommendation", filters.recommendation);
  if (filters.is_override !== undefined) query = query.eq("is_override", filters.is_override);

  const { data, count, error } = await query;
  if (error) return { entries: [], total: 0 };

  return { entries: (data ?? []) as AuditEntry[], total: count ?? 0 };
}

export async function getAuditStats(): Promise<AuditStats> {
  const supabase = await createClient();
  await supabase.auth.getUser();

  const { data } = await supabase
    .from("ai_audit_log")
    .select("ai_score, is_override, event_type");

  if (!data) return { total_decisions: 0, override_count: 0, avg_resume_score: null, avg_interview_score: null };

  const resumeScores = data
    .filter((r) => r.event_type === "resume_scored" && r.ai_score !== null)
    .map((r) => r.ai_score as number);

  const interviewScores = data
    .filter((r) => r.event_type === "interview_analyzed" && r.ai_score !== null)
    .map((r) => r.ai_score as number);

  const avg = (arr: number[]) =>
    arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;

  return {
    total_decisions: data.length,
    override_count: data.filter((r) => r.is_override).length,
    avg_resume_score: avg(resumeScores),
    avg_interview_score: avg(interviewScores),
  };
}

export async function getScoreDistribution(): Promise<JobScoreDistribution[]> {
  const supabase = await createClient();
  await supabase.auth.getUser();

  const { data } = await supabase
    .from("ai_audit_log")
    .select("job_title, ai_score")
    .not("ai_score", "is", null);

  if (!data) return [];

  const byJob: Record<string, number[]> = {};
  for (const row of data) {
    if (!byJob[row.job_title]) byJob[row.job_title] = [];
    byJob[row.job_title].push(row.ai_score as number);
  }

  return Object.entries(byJob).map(([job_title, scores]) => {
    const sorted = [...scores].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median =
      sorted.length % 2 === 0
        ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
        : sorted[mid];
    return {
      job_title,
      scores,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      median,
    };
  });
}

export async function getAnomalyAlerts(): Promise<AnomalyAlert[]> {
  const supabase = await createClient();
  await supabase.auth.getUser();

  const { data } = await supabase
    .from("fairness_anomaly_alerts")
    .select("*")
    .order("detected_at", { ascending: false });

  return (data ?? []) as AnomalyAlert[];
}

export async function markAlertReviewed(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const { error } = await supabase
    .from("fairness_anomaly_alerts")
    .update({
      status: "reviewed",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      reviewer_name: profile?.full_name ?? user.email,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/audit");
  return { error: undefined };
}

export async function searchCandidateExplainability(
  query: string
): Promise<ExplainabilityCandidate[]> {
  if (!query.trim()) return [];

  const supabase = await createClient();
  await supabase.auth.getUser();

  const term = query.trim().toLowerCase();

  const { data } = await supabase
    .from("candidates")
    .select(`
      id, full_name, email,
      ai_score, ai_recommendation, ai_summary, ai_strengths, ai_weaknesses,
      jobs (title),
      resume_uploads (ai_score, ai_summary, ai_strengths, ai_weaknesses, status, created_at),
      interviews (
        ai_score, ai_recommendation, ai_summary, ai_strengths, ai_weaknesses,
        ai_skill_breakdown, ai_analyzed_at
      )
    `)
    .or(`full_name.ilike.%${term}%,email.ilike.%${term}%`)
    .limit(10);

  if (!data) return [];

  return (data as any[]).map((c) => {
    const job = c.jobs as { title: string } | null;

    const latestUpload = ((c.resume_uploads ?? []) as any[])
      .filter((u) => u.status === "scored" && u.ai_score !== null)
      .sort(
        (a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0] ?? null;

    const interview = ((c.interviews ?? []) as any[]).find(
      (i) => i.ai_analyzed_at !== null
    ) ?? null;

    return {
      id: c.id,
      full_name: c.full_name,
      email: c.email,
      job_title: job?.title ?? "Unknown Job",
      resume_score: latestUpload?.ai_score ?? c.ai_score ?? null,
      resume_recommendation: c.ai_recommendation ?? null,
      resume_summary: latestUpload?.ai_summary ?? c.ai_summary ?? null,
      resume_strengths: latestUpload?.ai_strengths ?? c.ai_strengths ?? null,
      resume_weaknesses: latestUpload?.ai_weaknesses ?? c.ai_weaknesses ?? null,
      resume_scored_at: latestUpload?.created_at ?? null,
      interview_score: interview?.ai_score ?? null,
      interview_recommendation: interview?.ai_recommendation ?? null,
      interview_summary: interview?.ai_summary ?? null,
      interview_strengths: interview?.ai_strengths ?? null,
      interview_weaknesses: interview?.ai_weaknesses ?? null,
      interview_skill_breakdown: interview?.ai_skill_breakdown ?? null,
      interview_analyzed_at: interview?.ai_analyzed_at ?? null,
    } satisfies ExplainabilityCandidate;
  });
}

// Called by uploads.ts and report.ts to write immutable audit entries
export async function writeAuditEntry(entry: {
  event_type: AuditEntry["event_type"];
  candidate_id: string;
  candidate_name: string;
  job_id: string;
  job_title: string;
  ai_score?: number | null;
  ai_recommendation?: string | null;
  human_action?: string | null;
  human_action_by?: string | null;
  human_action_by_name?: string | null;
  ai_justification?: string | null;
  is_override?: boolean;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const supabase = await createClient();
  await supabase.from("ai_audit_log").insert({
    ...entry,
    is_override: entry.is_override ?? false,
  });
}
