"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { PipelineStage } from "@/components/dashboard/pipeline/pipeline-types";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function buildInviteEmail(opts: {
  candidateName: string;
  jobTitle: string;
  company: string;
  mode: string;
  duration: number;
  maxQuestions: number;
  interviewUrl: string;
}): string {
  const modeLabel = opts.mode.charAt(0).toUpperCase() + opts.mode.slice(1);
  const modeIcon = opts.mode === "voice" ? "🎙️" : opts.mode === "video" ? "🎥" : "💬";
  const firstName = opts.candidateName.split(" ")[0];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Interview Invitation from Carl</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- Header -->
        <tr><td style="padding-bottom:24px;" align="center">
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="width:32px;height:32px;background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:8px;text-align:center;vertical-align:middle;">
                <span style="color:#fff;font-weight:800;font-size:16px;">H</span>
              </td>
              <td style="padding-left:10px;font-size:18px;font-weight:800;color:#0f172a;vertical-align:middle;">Hiventra</td>
            </tr>
          </table>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#fff;border-radius:16px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

          <!-- Carl avatar + greeting -->
          <div style="text-align:center;margin-bottom:28px;">
            <div style="width:72px;height:72px;background:linear-gradient(135deg,#6366f1,#7c3aed);border-radius:50%;line-height:72px;text-align:center;margin:0 auto 12px;">
              <span style="color:#fff;font-weight:800;font-size:28px;line-height:72px;vertical-align:middle;">C</span>
            </div>
            <p style="margin:0;font-size:13px;color:#6366f1;font-weight:600;">Hi, I&apos;m Carl — AI Interviewer at Hiventra</p>
          </div>

          <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0f172a;text-align:center;">
            You&apos;re Invited to Interview
          </h1>
          <p style="margin:0 0 28px;font-size:15px;color:#64748b;text-align:center;line-height:1.6;">
            Hi ${firstName}, you&apos;ve been selected to interview for <strong style="color:#0f172a;">${opts.jobTitle}</strong> at <strong style="color:#0f172a;">${opts.company}</strong>.
          </p>

          <!-- Details grid -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:28px;">
            <tr>
              <td style="text-align:center;padding:8px 16px;border-right:1px solid #e2e8f0;">
                <div style="font-size:20px;margin-bottom:4px;">${modeIcon}</div>
                <div style="font-size:12px;font-weight:700;color:#0f172a;">${modeLabel} Interview</div>
                <div style="font-size:11px;color:#94a3b8;">Mode</div>
              </td>
              <td style="text-align:center;padding:8px 16px;border-right:1px solid #e2e8f0;">
                <div style="font-size:20px;margin-bottom:4px;">⏱️</div>
                <div style="font-size:12px;font-weight:700;color:#0f172a;">~${opts.duration} min</div>
                <div style="font-size:11px;color:#94a3b8;">Duration</div>
              </td>
              <td style="text-align:center;padding:8px 16px;">
                <div style="font-size:20px;margin-bottom:4px;">❓</div>
                <div style="font-size:12px;font-weight:700;color:#0f172a;">~${opts.maxQuestions} questions</div>
                <div style="font-size:11px;color:#94a3b8;">Questions</div>
              </td>
            </tr>
          </table>

          <!-- Tips -->
          <p style="margin:0 0 12px;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;">Before you start</p>
          <ul style="margin:0 0 28px;padding:0;list-style:none;">
            ${["Find a quiet, distraction-free space", "Read each question carefully before answering", "Answer as naturally and honestly as you can"].map((tip, i) => `
            <li style="margin-bottom:10px;">
              <table cellpadding="0" cellspacing="0" style="width:100%;">
                <tr>
                  <td style="width:24px;vertical-align:top;padding-top:1px;">
                    <span style="display:inline-block;width:20px;height:20px;background:#ede9fe;color:#6366f1;border-radius:50%;font-size:11px;font-weight:700;line-height:20px;text-align:center;">${i + 1}</span>
                  </td>
                  <td style="padding-left:8px;">
                    <span style="font-size:14px;color:#475569;line-height:1.5;">${tip}</span>
                  </td>
                </tr>
              </table>
            </li>`).join("")}
          </ul>

          <!-- CTA -->
          <div style="text-align:center;margin-bottom:24px;">
            <a href="${opts.interviewUrl}"
               style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:12px;box-shadow:0 4px 14px rgba(79,70,229,0.35);">
              Start Interview with Carl →
            </a>
          </div>

          <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;line-height:1.6;">
            Carl uses AI to conduct this interview. Your responses will be recorded and analyzed by the hiring team.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding-top:20px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#94a3b8;">Powered by Hiventra AI Talent Intelligence</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

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

export async function updateCandidateInfo(
  candidateId: string,
  data: { full_name: string; email: string; phone: string | null }
) {
  const supabase = await createClient();
  await supabase.auth.getUser();

  const { error } = await supabase
    .from("candidates")
    .update({ full_name: data.full_name, email: data.email, phone: data.phone || null })
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

  // Fetch candidate + job data for the email
  const [{ data: candidate }, { data: job }] = await Promise.all([
    supabase.from("candidates").select("full_name, email").eq("id", candidateId).single(),
    supabase
      .from("jobs")
      .select("title, company, carl_duration, carl_max_questions")
      .eq("id", jobId)
      .single(),
  ]);

  // Upsert interview record
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

  // Send invite email via Resend
  if (candidate && job) {
    const html = buildInviteEmail({
      candidateName: candidate.full_name,
      jobTitle: job.title,
      company: job.company,
      mode,
      duration: job.carl_duration ?? 30,
      maxQuestions: job.carl_max_questions ?? 10,
      interviewUrl: `${APP_URL}/portal/interview`,
    });

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Carl at Hiventra <onboarding@resend.dev>",
      to: candidate.email,
      subject: `Your interview invitation for ${job.title} at ${job.company}`,
      html,
    });
    if (emailError) console.error("[Resend error]", emailError);
    else console.log("[Resend sent]", emailData?.id, "→", candidate.email);
  }

  revalidatePath(`/dashboard/candidates/${candidateId}`);
  revalidatePath("/dashboard/pipeline");
  return { success: true };
}
