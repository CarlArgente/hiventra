"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ── Types ──────────────────────────────────────────────────────────────────────

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

export interface InterviewHighlight {
  tag: string;
  excerpt: string;
  question: string;
}

export interface CollaborationCandidate {
  id: string;
  full_name: string;
  email: string;
  stage: string;
  // Resume scoring
  ai_score: number | null;
  ai_recommendation: string | null;
  ai_skill_breakdown: Record<string, number> | null;
  ai_summary: string | null;
  ai_strengths: string[] | null;
  ai_weaknesses: string[] | null;
  // Interview data (preferred when available)
  interview_id: string | null;
  interview_status: string | null;
  interview_ai_score: number | null;
  interview_ai_recommendation: string | null;
  interview_skill_breakdown: Record<string, number> | null;
  interview_ai_summary: string | null;
  interview_ai_strengths: string[] | null;
  interview_ai_weaknesses: string[] | null;
  interview_ai_highlights: InterviewHighlight[] | null;
  interview_ai_risks: string[] | null;
}

export interface TeamMemberRow {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
}

export interface CommentRow {
  id: string;
  candidate_id: string;
  author_id: string;
  author_name: string | null;
  author_role: string;
  body: string;
  is_private: boolean;
  parent_id: string | null;
  created_at: string;
}

export interface ApprovalRow {
  candidate_id: string;
  stage_index: number;
  status: string;
  approved_by: string | null;
  approved_by_name: string | null;
  approved_at: string | null;
  rating: number | null;
  comment: string | null;
  recommendation: string | null;
}

// ── Job list ───────────────────────────────────────────────────────────────────

export async function getJobsForCollaboration(): Promise<CollaborationJobSummary[]> {
  const supabase = await createClient();
  await supabase.auth.getUser();

  const { data } = await supabase
    .from("jobs")
    .select("id, title, company, department, status")
    .order("created_at", { ascending: false });

  return (data as CollaborationJobSummary[]) ?? [];
}

// ── Main collaboration data ────────────────────────────────────────────────────

export async function getCollaborationData(jobId: string): Promise<{
  job: CollaborationJob | null;
  candidates: CollaborationCandidate[];
  teamMembers: TeamMemberRow[];
  comments: CommentRow[];
  approvals: ApprovalRow[];
  currentUserId: string | null;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [
    { data: job },
    { data: candidates },
    { data: interviews },
    { data: teamMembers },
    { data: comments },
    { data: approvals },
  ] = await Promise.all([
    supabase.from("jobs").select("id, title, department, company").eq("id", jobId).single(),
    supabase
      .from("candidates")
      .select("id, full_name, email, stage, ai_score, ai_recommendation, ai_skill_breakdown, ai_summary, ai_strengths, ai_weaknesses")
      .eq("job_id", jobId)
      .order("ai_score", { ascending: false, nullsFirst: false }),
    supabase
      .from("interviews")
      .select("id, candidate_id, status, ai_score, ai_recommendation, ai_skill_breakdown, ai_summary, ai_strengths, ai_weaknesses, ai_interview_highlights, ai_risks")
      .eq("job_id", jobId),
    supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .neq("role", "candidate")
      .order("created_at"),
    supabase
      .from("collaboration_comments")
      .select("id, candidate_id, author_id, body, is_private, parent_id, created_at, profiles(full_name, role)")
      .eq("job_id", jobId)
      .order("created_at"),
    supabase
      .from("collaboration_approvals")
      .select("candidate_id, stage_index, status, approved_by, approved_at, rating, comment, recommendation, profiles(full_name)")
      .eq("job_id", jobId),
  ]);

  // Merge interview data into candidates
  const interviewMap = new Map((interviews ?? []).map((i) => [i.candidate_id, i]));
  const merged: CollaborationCandidate[] = (candidates ?? []).map((c) => {
    const iv = interviewMap.get(c.id);
    return {
      ...c,
      interview_id: iv?.id ?? null,
      interview_status: iv?.status ?? null,
      interview_ai_score: (iv?.ai_score as number | null) ?? null,
      interview_ai_recommendation: (iv?.ai_recommendation as string | null) ?? null,
      interview_skill_breakdown: (iv?.ai_skill_breakdown as Record<string, number> | null) ?? null,
      interview_ai_summary: (iv?.ai_summary as string | null) ?? null,
      interview_ai_strengths: (iv?.ai_strengths as string[] | null) ?? null,
      interview_ai_weaknesses: (iv?.ai_weaknesses as string[] | null) ?? null,
      interview_ai_highlights: (iv?.ai_interview_highlights as any[] | null) ?? null,
      interview_ai_risks: (iv?.ai_risks as string[] | null) ?? null,
    } as CollaborationCandidate;
  });

  const mappedComments: CommentRow[] = (comments ?? []).map((r: any) => ({
    id: r.id,
    candidate_id: r.candidate_id,
    author_id: r.author_id,
    author_name: r.profiles?.full_name ?? null,
    author_role: r.profiles?.role ?? "",
    body: r.body,
    is_private: r.is_private,
    parent_id: r.parent_id ?? null,
    created_at: r.created_at,
  }));

  const mappedApprovals: ApprovalRow[] = (approvals ?? []).map((r: any) => ({
    candidate_id: r.candidate_id,
    stage_index: r.stage_index,
    status: r.status,
    approved_by: r.approved_by ?? null,
    approved_by_name: r.profiles?.full_name ?? null,
    approved_at: r.approved_at ?? null,
    rating: r.rating ?? null,
    comment: r.comment ?? null,
    recommendation: r.recommendation ?? null,
  }));

  return {
    job: (job as CollaborationJob | null) ?? null,
    candidates: merged,
    teamMembers: (teamMembers ?? []) as TeamMemberRow[],
    comments: mappedComments,
    approvals: mappedApprovals,
    currentUserId: user?.id ?? null,
  };
}

// ── Comments ───────────────────────────────────────────────────────────────────

export async function addComment(
  jobId: string,
  candidateId: string,
  body: string,
  isPrivate: boolean,
  parentId: string | null
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase.from("collaboration_comments").insert({
    job_id: jobId,
    candidate_id: candidateId,
    author_id: user.id,
    body,
    is_private: isPrivate,
    parent_id: parentId ?? null,
  });

  if (error) return { error: error.message };
  revalidatePath(`/collaboration/${jobId}`);
  return {};
}

export async function deleteComment(
  jobId: string,
  commentId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("collaboration_comments")
    .delete()
    .eq("id", commentId)
    .eq("author_id", user.id);

  if (error) return { error: error.message };
  revalidatePath(`/collaboration/${jobId}`);
  return {};
}

// ── Approvals ──────────────────────────────────────────────────────────────────

export async function upsertApproval(
  jobId: string,
  candidateId: string,
  stageIndex: number,
  status: string,
  rating?: number | null,
  comment?: string | null,
  recommendation?: string | null
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase.from("collaboration_approvals").upsert(
    {
      job_id: jobId,
      candidate_id: candidateId,
      stage_index: stageIndex,
      status,
      approved_by: status === "done" ? user.id : null,
      approved_at: status === "done" ? new Date().toISOString() : null,
      rating: rating ?? null,
      comment: comment ?? null,
      recommendation: recommendation ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "candidate_id,stage_index" }
  );

  if (error) return { error: error.message };
  revalidatePath(`/collaboration/${jobId}`);
  return {};
}

export async function updateCandidateStage(
  candidateId: string,
  stage: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("candidates")
    .update({ stage })
    .eq("id", candidateId);

  if (error) return { error: error.message };
  return {};
}
