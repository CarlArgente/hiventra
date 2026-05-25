"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
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
  const supabase = await createClient();
  await supabase.auth.getUser();

  const { data } = await supabase
    .from("interviews")
    .select(`
      id, candidate_id, mode, status, questions, responses, started_at, completed_at,
      candidate:candidates(full_name),
      job:jobs(title, company, carl_max_questions, carl_duration, carl_mode, carl_personality, carl_topics)
    `)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as InterviewData | null) ?? null;
}

export async function startInterview(id: string, questions: string[]) {
  const supabase = await createClient();
  await supabase.auth.getUser();

  const { data: interview, error } = await supabase
    .from("interviews")
    .update({ status: "started", started_at: new Date().toISOString(), questions })
    .eq("id", id)
    .select("candidate_id")
    .single();

  if (error) return { error: error.message };

  if (interview?.candidate_id) {
    await supabase
      .from("candidates")
      .update({ stage: "interview_started" })
      .eq("id", interview.candidate_id);
  }

  revalidatePath("/portal/interview");
  revalidatePath("/pipeline");
  return { success: true };
}

export async function submitAnswer(id: string, response: InterviewResponse) {
  const supabase = await createClient();
  await supabase.auth.getUser();

  const { data: interview } = await supabase
    .from("interviews")
    .select("responses")
    .eq("id", id)
    .single();

  if (!interview) return { error: "Interview not found" };

  const responses = [...((interview.responses as InterviewResponse[]) ?? []), response];
  const { error } = await supabase
    .from("interviews")
    .update({ responses })
    .eq("id", id);

  if (error) return { error: error.message };
  return { success: true };
}

export async function completeInterview(id: string) {
  const supabase = await createClient();
  await supabase.auth.getUser();

  const { data: interview, error } = await supabase
    .from("interviews")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", id)
    .select("candidate_id")
    .single();

  if (error) return { error: error.message };

  if (interview?.candidate_id) {
    await supabase
      .from("candidates")
      .update({ stage: "completed" })
      .eq("id", interview.candidate_id);

    // Run analysis server-side so it isn't affected by the client closing the tab
    await generateInterviewAnalysis(interview.candidate_id).catch((e) => {
      console.error("[completeInterview] analysis failed:", e);
    });
  }

  revalidatePath("/portal/interview");
  revalidatePath("/portal");
  revalidatePath("/pipeline");
  revalidatePath("/candidates");
  return { success: true };
}
