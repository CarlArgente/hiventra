"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { writeAuditEntry } from "./audit";

export interface InterviewHighlight {
  question: string;
  excerpt: string;
  tag: "Positive" | "Neutral" | "Concern";
}

export interface InterviewAnalysis {
  ai_score: number | null;
  ai_recommendation: string | null;
  ai_summary: string | null;
  ai_strengths: string[] | null;
  ai_weaknesses: string[] | null;
  ai_skill_breakdown: Record<string, number> | null;
  ai_interview_highlights: InterviewHighlight[] | null;
  ai_risks: string[] | null;
  ai_analyzed_at: string | null;
}

export interface ResumeUploadSummary {
  id: string;
  ai_score: number | null;
  ai_summary: string | null;
  ai_strengths: string[] | null;
  ai_weaknesses: string[] | null;
  status: string;
  created_at: string;
}

export interface ReportCandidateData {
  id: string;
  full_name: string;
  email: string;
  stage: string;
  created_at: string;
  job_id: string;
  // Resume-based AI scoring (candidates table — fallback)
  ai_score: number | null;
  ai_recommendation: string | null;
  ai_summary: string | null;
  ai_strengths: string[] | null;
  ai_weaknesses: string[] | null;
  // Resume uploads (primary source for Resume Summary tab)
  resume_uploads: ResumeUploadSummary[] | null;
  jobs: { id: string; title: string; department: string | null; company: string } | null;
  interviews: Array<{
    id: string;
    mode: string;
    status: string;
    started_at: string | null;
    completed_at: string | null;
    responses: Array<{ question: string; answer: string; submitted_at: string }> | null;
  } & InterviewAnalysis>;
}

export async function getCandidateReport(id: string): Promise<ReportCandidateData | null> {
  const supabase = await createClient();
  await supabase.auth.getUser();

  const { data } = await supabase
    .from("candidates")
    .select(`
      id, full_name, email, stage, created_at, job_id,
      ai_score, ai_recommendation, ai_summary, ai_strengths, ai_weaknesses,
      resume_uploads (id, ai_score, ai_summary, ai_strengths, ai_weaknesses, status, created_at),
      jobs (id, title, department, company),
      interviews (
        id, mode, status, started_at, completed_at, responses,
        ai_score, ai_recommendation, ai_summary, ai_strengths, ai_weaknesses,
        ai_skill_breakdown, ai_interview_highlights, ai_risks, ai_analyzed_at
      )
    `)
    .eq("id", id)
    .single();

  return (data as ReportCandidateData | null) ?? null;
}

export async function generateInterviewAnalysis(candidateId: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { error: "Anthropic API not configured" };

  const supabase = await createClient();
  await supabase.auth.getUser();

  const { data: candidate } = await supabase
    .from("candidates")
    .select(`
      id, full_name, job_id,
      jobs (title),
      interviews (id, responses, status)
    `)
    .eq("id", candidateId)
    .single();

  if (!candidate) return { error: "Candidate not found" };

  const interview = (candidate.interviews as any[])?.[0];
  const interviewId: string = interview?.id;
  const responses: Array<{ question: string; answer: string }> = interview?.responses ?? [];
  if (!responses.length) return { error: "No interview responses found" };

  const jobTitle = (candidate.jobs as any)?.title ?? "this role";

  const responsesText = responses
    .map((r, i) => `Q${i + 1}: ${r.question}\nA: ${r.answer || "[No answer provided]"}`)
    .join("\n\n");

  const prompt = `You are Carl, an AI interviewer. Analyze these interview responses for the "${jobTitle}" role.

INTERVIEW TRANSCRIPT:
${responsesText}

Return ONLY raw JSON (no markdown, no explanation):
{
  "score": <integer 0-100 based solely on interview performance>,
  "recommendation": <"strongly_recommend" | "recommend" | "review_further" | "do_not_recommend">,
  "summary": "<2–3 sentence paragraph assessing the candidate based on their interview answers only>",
  "strengths": ["<strength demonstrated in interview>", "<another strength>"],
  "weaknesses": ["<gap or concern from interview>"],
  "skill_breakdown": {
    "Technical Expertise": <integer 0-100>,
    "Communication": <integer 0-100>,
    "Problem Solving": <integer 0-100>,
    "Culture Alignment": <integer 0-100>,
    "Leadership Potential": <integer 0-100>,
    "Domain Knowledge": <integer 0-100>
  },
  "highlights": [
    {
      "question": "<exact question text>",
      "excerpt": "<direct quote from answer, max 200 chars>",
      "tag": "Positive"
    }
  ],
  "risks": ["<specific concern based on responses>"]
}
Rules:
- score and all analysis must be based on interview answers, not resume assumptions
- strengths: 3–6 specific things the candidate showed in their answers
- weaknesses: 1–4 gaps or concerns observed from answers (empty array if none)
- highlights: 3–5 most insightful Q&A pairs; tag each Positive/Neutral/Concern
- risks: 0–3 genuine concerns or empty array`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) throw new Error(`Anthropic error: ${response.status}`);

    const data = await response.json();
    const raw: string = data.content?.[0]?.text ?? "";
    const text = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    const parsed = JSON.parse(text);

    // Write analysis to interviews table — never touches candidates resume fields
    await supabase
      .from("interviews")
      .update({
        ai_score: parsed.score,
        ai_recommendation: parsed.recommendation,
        ai_summary: parsed.summary,
        ai_strengths: parsed.strengths ?? [],
        ai_weaknesses: parsed.weaknesses ?? [],
        ai_skill_breakdown: parsed.skill_breakdown,
        ai_interview_highlights: parsed.highlights,
        ai_risks: parsed.risks ?? [],
        ai_analyzed_at: new Date().toISOString(),
      })
      .eq("id", interviewId);

    // Keep ai_analyzed_at on candidates as a quick "analysis done" flag
    await supabase
      .from("candidates")
      .update({ ai_analyzed_at: new Date().toISOString() })
      .eq("id", candidateId);

    // Write immutable audit entry for this analysis
    await writeAuditEntry({
      event_type: "interview_analyzed",
      candidate_id: candidateId,
      candidate_name: (candidate as any).full_name ?? candidateId,
      job_id: (candidate as any).job_id ?? interviewId,
      job_title: jobTitle,
      ai_score: parsed.score,
      ai_recommendation: parsed.recommendation,
      human_action: "no_action",
      is_override: false,
      ai_justification: parsed.summary,
    });

    revalidatePath(`/candidates/${candidateId}/report`);

    return {
      score: parsed.score as number,
      recommendation: parsed.recommendation as string,
      summary: parsed.summary as string,
      strengths: (parsed.strengths ?? []) as string[],
      weaknesses: (parsed.weaknesses ?? []) as string[],
      skill_breakdown: parsed.skill_breakdown as Record<string, number>,
      highlights: parsed.highlights as InterviewHighlight[],
      risks: (parsed.risks ?? []) as string[],
    };
  } catch (e) {
    console.error("generateInterviewAnalysis error:", e);
    return { error: "Failed to analyze interview" };
  }
}
