"use server";

import { createClient } from "@/lib/supabase/server";
import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";
import { revalidatePath } from "next/cache";

const mailerSend = new MailerSend({ apiKey: process.env.MAILERSEND_API_KEY! });

async function sendEmail(to: string, toName: string, subject: string, html: string) {
  const params = new EmailParams()
    .setFrom(new Sender("noreply@hiventra.live", "Hiventra"))
    .setTo([new Recipient(to, toName)])
    .setSubject(subject)
    .setHtml(html);
  await mailerSend.email.send(params);
}
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function generateUsername(fullName: string): string {
  const base = fullName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join(".");
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${base || "candidate"}${suffix}`;
}

function generatePassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "!@#$";
  const all = upper + lower + digits + special;
  // Guarantee at least one of each class
  const pick = (s: string) => s[Math.floor(Math.random() * s.length)];
  const rest = Array.from({ length: 8 }, () => pick(all));
  return [pick(upper), pick(lower), pick(digits), pick(special), ...rest]
    .sort(() => Math.random() - 0.5)
    .join("");
}

function buildCredentialsEmail(opts: {
  candidateName: string;
  username: string;
  password: string;
  loginUrl: string;
  appUrl: string;
}): string {
  const APP_URL = opts.appUrl;
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Your Hiventra Portal Access</title>
  <style>
    body { margin:0; padding:0; background:#f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .wrap { max-width:560px; margin:40px auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.07); }
    .header { background:linear-gradient(135deg,#4f46e5,#7c3aed); padding:36px 40px; text-align:center; }
    .header h1 { color:#fff; font-size:22px; margin:16px 0 4px; font-weight:800; }
    .header p { color:rgba(255,255,255,0.75); font-size:14px; margin:0; }
    .body { padding:36px 40px; }
    .greeting { font-size:16px; color:#1e293b; margin:0 0 16px; }
    .intro { font-size:14px; color:#64748b; line-height:1.6; margin:0 0 28px; }
    .creds { background:#f8faff; border:1px solid #e0e7ff; border-radius:12px; padding:24px 28px; margin-bottom:28px; }
    .creds h3 { font-size:12px; font-weight:700; color:#6366f1; text-transform:uppercase; letter-spacing:.08em; margin:0 0 16px; }
    .field { display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #e2e8f0; }
    .field:last-child { border-bottom:none; padding-bottom:0; }
    .field-label { font-size:13px; color:#94a3b8; font-weight:500; }
    .field-value { font-size:14px; color:#1e293b; font-weight:700; font-family:monospace; background:#fff; border:1px solid #e2e8f0; border-radius:6px; padding:4px 10px; }
    .notice { font-size:12px; color:#f59e0b; background:#fffbeb; border:1px solid #fde68a; border-radius:8px; padding:10px 14px; margin-bottom:28px; }
    .btn { display:block; text-align:center; background:linear-gradient(135deg,#4f46e5,#7c3aed); color:#fff !important; text-decoration:none; font-weight:700; font-size:15px; padding:14px 28px; border-radius:10px; margin-bottom:28px; }
    .footer { font-size:12px; color:#94a3b8; line-height:1.6; border-top:1px solid #f1f5f9; padding-top:20px; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <img src="https://hiventra-alpha.vercel.app/hiventra_icon.png" width="56" height="56" alt="H" style="display:block;width:56px;height:56px;border-radius:12px;margin:0 auto;" />
      <h1>Welcome to Hiventra</h1>
      <p>Your candidate portal access is ready</p>
    </div>
    <div class="body">
      <p class="greeting">Hi ${opts.candidateName},</p>
      <p class="intro">
        Your application is being reviewed and your candidate portal account has been created.
        Use the credentials below to sign in and track your application progress.
      </p>

      <div class="creds">
        <h3>Your Login Credentials</h3>
        <div class="field">
          <span class="field-label">Username</span>
          <span class="field-value">${opts.username}</span>
        </div>
        <div class="field">
          <span class="field-label">Password</span>
          <span class="field-value">${opts.password}</span>
        </div>
        <div class="field">
          <span class="field-label">Portal URL</span>
          <span class="field-value">${opts.loginUrl}</span>
        </div>
      </div>

      <div class="notice">
        ⚠️ This is a temporary password. You will be prompted to change it after your first sign-in.
      </div>

      <a href="${opts.loginUrl}" class="btn">Sign In to Your Portal →</a>

      <p class="footer">
        If you have any issues signing in, please contact the recruiter who reached out to you.<br/>
        This email was sent by Hiventra on behalf of the company reviewing your application.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export interface CreateAccountsResult {
  created: number;
  skipped: number;
  failed: number;
  errors: string[];
}

export async function createCandidateAccounts(
  jobId: string
): Promise<CreateAccountsResult | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // Fetch all scored candidates for this job
  const { data: candidates, error: fetchError } = await supabase
    .from("candidates")
    .select("id, full_name, email")
    .eq("job_id", jobId)
    .not("ai_score", "is", null);

  if (fetchError) return { error: fetchError.message };
  if (!candidates || candidates.length === 0)
    return { error: "No scored candidates found for this job." };

  // Fetch existing credentials to skip them (via SECURITY DEFINER to bypass RLS)
  const { data: existingIds } = await supabase.rpc("get_credentialed_candidate_ids", {
    p_candidate_ids: candidates.map((c) => c.id),
  });
  const existingCandidateIds = new Set<string>(existingIds ?? []);

  const toCreate = candidates.filter((c) => !existingCandidateIds.has(c.id));
  const skipped = candidates.length - toCreate.length;

  let created = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const candidate of toCreate) {
    try {
      const username = generateUsername(candidate.full_name ?? "candidate");
      const password = generatePassword();
      const email = candidate.email;

      // Create Supabase Auth user via SECURITY DEFINER function
      const { data: authUserId, error: rpcError } = await supabase.rpc(
        "create_candidate_auth_user",
        { p_email: email, p_password: password, p_full_name: candidate.full_name ?? "" }
      );

      if (rpcError) {
        errors.push(`${candidate.full_name}: ${rpcError.message}`);
        failed++;
        continue;
      }

      // Store credentials
      const { error: credError } = await supabase
        .from("candidate_credentials")
        .insert({
          candidate_id: candidate.id,
          username,
          must_change_password: true,
          can_logged_in: true,
        });

      if (credError) {
        errors.push(`${candidate.full_name}: ${credError.message}`);
        failed++;
        continue;
      }

      // Send email
      const loginUrl = `${APP_URL}/candidate/login`;
      const html = buildCredentialsEmail({
        candidateName: candidate.full_name ?? "Candidate",
        username,
        password,
        loginUrl,
        appUrl: APP_URL,
      });

      try {
        await sendEmail(email, candidate.full_name ?? "Candidate", "🎉 Your Hiventra Candidate Portal Access", html);
      } catch (emailErr) {
        const msg = emailErr instanceof Error ? emailErr.message : JSON.stringify(emailErr);
        console.error("[MailerSend error]", msg);
      }

      // Advance stage to invited
      await supabase
        .from("candidates")
        .update({ stage: "invited" })
        .eq("id", candidate.id);

      created++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      errors.push(`${candidate.full_name}: ${msg}`);
      failed++;
    }
  }

  revalidatePath("/upload");
  return { created, skipped, failed, errors };
}

export async function resendCandidateCredentials(
  candidateId: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: candidate } = await supabase
    .from("candidates")
    .select("id, full_name, email")
    .eq("id", candidateId)
    .maybeSingle();

  if (!candidate) return { error: "Candidate not found" };

  const { data: username } = await supabase.rpc("get_candidate_username", {
    p_candidate_id: candidateId,
  });

  if (!username) return { error: "No credentials found for this candidate. Create an account first." };

  const newPassword = generatePassword();

  const { error: rpcError } = await supabase.rpc("create_candidate_auth_user", {
    p_email: candidate.email,
    p_password: newPassword,
    p_full_name: candidate.full_name ?? "",
  });

  if (rpcError) return { error: rpcError.message };

  await supabase
    .from("candidate_credentials")
    .update({ must_change_password: true })
    .eq("candidate_id", candidateId);

  const loginUrl = `${APP_URL}/candidate/login`;
  const html = buildCredentialsEmail({
    candidateName: candidate.full_name ?? "Candidate",
    username,
    password: newPassword,
    loginUrl,
    appUrl: APP_URL,
  });

  await sendEmail(candidate.email, candidate.full_name ?? "Candidate", "🎉 Your Hiventra Candidate Portal Access", html);

  return { success: true };
}
