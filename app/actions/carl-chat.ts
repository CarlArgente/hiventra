"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ChatSession {
  id: string;
  title: string;
  context_type: "general" | "job" | "candidate";
  context_job_id: string | null;
  context_candidate_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export async function getChatSessions(): Promise<ChatSession[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("carl_chat_sessions")
    .select("id, title, context_type, context_job_id, context_candidate_id, created_at, updated_at")
    .eq("profile_id", user.id)
    .order("updated_at", { ascending: false });

  return data ?? [];
}

export async function getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("carl_chat_messages")
    .select("id, session_id, role, content, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  return data ?? [];
}

export async function createChatSession(
  title: string,
  contextType: "general" | "job" | "candidate" = "general",
  contextJobId?: string,
  contextCandidateId?: string
): Promise<{ session: ChatSession | null; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { session: null, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("carl_chat_sessions")
    .insert({
      profile_id: user.id,
      title,
      context_type: contextType,
      context_job_id: contextJobId ?? null,
      context_candidate_id: contextCandidateId ?? null,
    })
    .select("id, title, context_type, context_job_id, context_candidate_id, created_at, updated_at")
    .single();

  if (error) return { session: null, error: error.message };
  revalidatePath("/talk-with-carl");
  return { session: data };
}

export async function updateSessionTitle(
  sessionId: string,
  title: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("carl_chat_sessions")
    .update({ title })
    .eq("id", sessionId)
    .eq("profile_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/talk-with-carl");
  return {};
}

export async function deleteChatSession(sessionId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("carl_chat_sessions")
    .delete()
    .eq("id", sessionId)
    .eq("profile_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/talk-with-carl");
  return {};
}

export async function saveMessage(
  sessionId: string,
  role: "user" | "assistant",
  content: string
): Promise<{ message: ChatMessage | null; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { message: null, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("carl_chat_messages")
    .insert({ session_id: sessionId, role, content })
    .select("id, session_id, role, content, created_at")
    .single();

  if (error) return { message: null, error: error.message };
  return { message: data };
}

// Fetch rich context for Carl's system prompt
export async function getCarlChatContext(
  contextType: "general" | "job" | "candidate",
  contextJobId?: string | null,
  contextCandidateId?: string | null
): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return "";

  const lines: string[] = [];

  if (contextType === "general" || contextType === "job") {
    const { data: jobs } = await supabase
      .from("jobs")
      .select("id, title, department, status, employment_type, location, required_skills, created_at")
      .order("created_at", { ascending: false });

    if (jobs?.length) {
      lines.push("## Jobs");
      for (const j of jobs) {
        lines.push(
          `- ${j.title} (${j.department ?? "N/A"}) | Status: ${j.status} | Type: ${j.employment_type ?? "N/A"} | Location: ${j.location ?? "N/A"} | Skills: ${(j.required_skills ?? []).join(", ") || "N/A"}`
        );
      }
    }

    const { data: allCandidates } = await supabase
      .from("candidates")
      .select("id, full_name, email, stage, ai_score, ai_recommendation, ai_summary, job_id, jobs(title)")
      .order("ai_score", { ascending: false });

    if (allCandidates?.length) {
      const counts: Record<string, number> = {};
      for (const c of allCandidates) counts[c.stage] = (counts[c.stage] ?? 0) + 1;
      lines.push("\n## Pipeline Overview");
      for (const [stage, count] of Object.entries(counts)) {
        lines.push(`- ${stage}: ${count} candidate(s)`);
      }

      lines.push("\n## All Candidates");
      for (const c of allCandidates) {
        const jobTitle = Array.isArray(c.jobs)
          ? (c.jobs[0] as { title: string } | undefined)?.title ?? "N/A"
          : (c.jobs as { title: string } | null)?.title ?? "N/A";
        lines.push(
          `- ${c.full_name} (${c.email}) | Job: ${jobTitle} | Stage: ${c.stage} | Score: ${c.ai_score ?? "N/A"}/100 | Recommendation: ${c.ai_recommendation ?? "N/A"}${c.ai_summary ? ` | Summary: ${c.ai_summary}` : ""}`
        );
      }
    }
  }

  if (contextType === "job" && contextJobId) {
    const { data: job } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", contextJobId)
      .single();

    if (job) {
      lines.push(`\n## Focused Job: ${job.title}`);
      lines.push(`- Department: ${job.department ?? "N/A"}`);
      lines.push(`- Status: ${job.status}`);
      lines.push(`- Description: ${job.description ?? "N/A"}`);
      lines.push(`- Required Skills: ${(job.required_skills ?? []).join(", ") || "N/A"}`);
      lines.push(`- Experience: ${job.experience_min}–${job.experience_max} years`);
      lines.push(`- Carl Personality: ${job.carl_personality}`);
      lines.push(`- Carl Mode: ${job.carl_mode}`);
    }

    const { data: candidates } = await supabase
      .from("candidates")
      .select("full_name, email, stage, ai_score, ai_recommendation, ai_summary")
      .eq("job_id", contextJobId)
      .order("ai_score", { ascending: false });

    if (candidates?.length) {
      lines.push(`\n## Candidates for this Job (${candidates.length} total)`);
      for (const c of candidates) {
        lines.push(
          `- **${c.full_name}** (${c.email}) | Stage: ${c.stage} | Score: ${c.ai_score ?? "N/A"}/100 | Recommendation: ${c.ai_recommendation ?? "N/A"}`
        );
      }
    }
  }

  if (contextType === "candidate" && contextCandidateId) {
    const { data: candidate } = await supabase
      .from("candidates")
      .select(`
        full_name, email, phone, stage, ai_score, ai_recommendation,
        ai_summary, ai_strengths, ai_weaknesses,
        jobs(title, department, company)
      `)
      .eq("id", contextCandidateId)
      .single();

    if (candidate) {
      const jobsRaw = candidate.jobs as unknown;
      const job = Array.isArray(jobsRaw)
        ? (jobsRaw[0] as { title: string; department: string; company: string } | undefined) ?? null
        : (jobsRaw as { title: string; department: string; company: string } | null);
      lines.push(`\n## Candidate Profile: ${candidate.full_name}`);
      lines.push(`- Email: ${candidate.email}`);
      lines.push(`- Phone: ${candidate.phone ?? "N/A"}`);
      lines.push(`- Applied for: ${job?.title ?? "N/A"} at ${job?.company ?? "N/A"} (${job?.department ?? "N/A"})`);
      lines.push(`- Stage: ${candidate.stage}`);
      lines.push(`- AI Score: ${candidate.ai_score ?? "N/A"}/100`);
      lines.push(`- AI Recommendation: ${candidate.ai_recommendation ?? "N/A"}`);
      if (candidate.ai_summary) lines.push(`- Summary: ${candidate.ai_summary}`);
      if (candidate.ai_strengths?.length) lines.push(`- Strengths: ${candidate.ai_strengths.join("; ")}`);
      if (candidate.ai_weaknesses?.length) lines.push(`- Weaknesses: ${candidate.ai_weaknesses.join("; ")}`);
    }

    const { data: interview } = await supabase
      .from("interviews")
      .select("status, ai_score, ai_recommendation, ai_summary, ai_strengths, ai_weaknesses, completed_at")
      .eq("candidate_id", contextCandidateId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (interview) {
      lines.push(`\n## Interview Data`);
      lines.push(`- Interview Status: ${interview.status}`);
      if (interview.ai_score) lines.push(`- Interview Score: ${interview.ai_score}/100`);
      if (interview.ai_recommendation) lines.push(`- Interview Recommendation: ${interview.ai_recommendation}`);
      if (interview.ai_summary) lines.push(`- Interview Summary: ${interview.ai_summary}`);
      if (interview.ai_strengths?.length) lines.push(`- Interview Strengths: ${(interview.ai_strengths as string[]).join("; ")}`);
      if (interview.ai_weaknesses?.length) lines.push(`- Interview Weaknesses: ${(interview.ai_weaknesses as string[]).join("; ")}`);
    }
  }

  return lines.join("\n");
}
