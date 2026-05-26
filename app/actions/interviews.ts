"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCandidateSession } from "@/lib/candidate-session";
import { generateInterviewAnalysis } from "@/app/actions/report";

export interface InterviewResponse {
  question: string;
  answer: string;
  submitted_at: string;
}

export interface InterviewData {
  id: string;
  candidate_id: string;
  mode: string;
  status: string;
  questions: string[] | null;
  responses: InterviewResponse[] | null;
  started_at: string | null;
  completed_at: string | null;
  candidate: { full_name: string } | null;
  job: {
    title: string;
    company: string;
    carl_max_questions: number | null;
    carl_duration: number | null;
    carl_mode: string | null;
    carl_personality: string | null;
    carl_topics: string[] | null;
  } | null;
}

export async function getCandidateInterview(): Promise<InterviewData | null> {
  const candidateId = await getCandidateSession();
  if (!candidateId) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_candidate_interview_data", {
    p_candidate_id: candidateId,
  });

  if (error || !data) return null;
  return data as InterviewData;
}

export async function startInterview(id: string, questions: string[]) {
  const candidateId = await getCandidateSession();
  if (!candidateId) return { error: "Not authenticated" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("start_candidate_interview", {
    p_interview_id: id,
    p_candidate_id: candidateId,
    p_questions: questions,
  });

  if (error) return { error: error.message };
  revalidatePath("/portal/interview");
  revalidatePath("/pipeline");
  return { success: true };
}

export async function submitAnswer(id: string, response: InterviewResponse) {
  const candidateId = await getCandidateSession();
  if (!candidateId) return { error: "Not authenticated" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_interview_answer", {
    p_interview_id: id,
    p_candidate_id: candidateId,
    p_new_response: response,
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function completeInterview(id: string) {
  const candidateId = await getCandidateSession();
  if (!candidateId) return { error: "Not authenticated" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("complete_candidate_interview", {
    p_interview_id: id,
    p_candidate_id: candidateId,
  });

  if (error) return { error: error.message };

  await generateInterviewAnalysis(candidateId).catch((e) => {
    console.error("[completeInterview] analysis failed:", e);
  });

  revalidatePath("/portal/interview");
  revalidatePath("/portal");
  revalidatePath("/pipeline");
  revalidatePath("/candidates");
  return { success: true };
}
