"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface PortalCandidate {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  linkedin_url: string | null;
  availability: string | null;
  preferred_location: string | null;
  stage: string;
  resume_filename: string | null;
}

export interface PortalJob {
  id: string;
  title: string;
  company: string;
  carl_mode: string;
  carl_duration: number;
  carl_max_questions: number;
}

export interface PortalInterview {
  id: string;
  status: string;
  mode: string;
  questions: string[] | null;
  responses: Array<{ question: string; answer: string }> | null;
  window_start: string | null;
  window_end: string | null;
  expires_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  ai_weaknesses: string[] | null;
}

export interface PortalDocument {
  id: string;
  filename: string;
  doc_type: string;
  file_url: string | null;
  storage_path: string | null;
  file_size: number | null;
  created_at: string;
}

export interface PortalData {
  candidate: PortalCandidate;
  job: PortalJob;
  interview: PortalInterview | null;
  documents: PortalDocument[];
}

export async function getPortalData(): Promise<PortalData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: candidate } = await supabase
    .from("candidates")
    .select(
      "id, full_name, email, phone, linkedin_url, availability, preferred_location, stage, resume_filename, job_id"
    )
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!candidate) return null;

  const [{ data: job }, { data: interview }, { data: docRows }] =
    await Promise.all([
      supabase
        .from("jobs")
        .select("id, title, company, carl_mode, carl_duration, carl_max_questions")
        .eq("id", candidate.job_id)
        .maybeSingle(),
      supabase
        .from("interviews")
        .select(
          "id, status, mode, questions, responses, window_start, window_end, expires_at, started_at, completed_at, ai_weaknesses"
        )
        .eq("candidate_id", candidate.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("candidate_documents")
        .select(
          "id, filename, doc_type, file_url, storage_path, file_size, created_at"
        )
        .eq("candidate_id", candidate.id)
        .order("created_at", { ascending: false }),
    ]);

  if (!job) return null;

  const documents: PortalDocument[] = await Promise.all(
    (docRows ?? []).map(async (doc: any) => {
      let fileUrl: string | null = doc.file_url ?? null;
      if (!fileUrl && doc.storage_path) {
        const { data: signed } = await supabase.storage
          .from("candidate-documents")
          .createSignedUrl(doc.storage_path, 3600);
        fileUrl = signed?.signedUrl ?? null;
      }
      return {
        id: doc.id,
        filename: doc.filename,
        doc_type: doc.doc_type,
        file_url: fileUrl,
        storage_path: doc.storage_path ?? null,
        file_size: doc.file_size ?? null,
        created_at: doc.created_at,
      };
    })
  );

  return {
    candidate: {
      id: candidate.id,
      full_name: candidate.full_name,
      email: candidate.email,
      phone: candidate.phone ?? null,
      linkedin_url: candidate.linkedin_url ?? null,
      availability: candidate.availability ?? null,
      preferred_location: candidate.preferred_location ?? null,
      stage: candidate.stage,
      resume_filename: candidate.resume_filename ?? null,
    },
    job: {
      id: job.id,
      title: job.title,
      company: job.company,
      carl_mode: (job.carl_mode as string) ?? "text",
      carl_duration: (job.carl_duration as number) ?? 30,
      carl_max_questions: (job.carl_max_questions as number) ?? 10,
    },
    interview: interview
      ? {
          id: interview.id,
          status: interview.status as string,
          mode: (interview.mode as string) ?? "text",
          questions: (interview.questions as string[] | null) ?? null,
          responses:
            (interview.responses as Array<{
              question: string;
              answer: string;
            }> | null) ?? null,
          window_start: (interview.window_start as string | null) ?? null,
          window_end: (interview.window_end as string | null) ?? null,
          expires_at: (interview.expires_at as string | null) ?? null,
          started_at: (interview.started_at as string | null) ?? null,
          completed_at: (interview.completed_at as string | null) ?? null,
          ai_weaknesses: (interview.ai_weaknesses as string[] | null) ?? null,
        }
      : null,
    documents,
  };
}

export async function updateCandidateProfile(data: {
  candidateId: string;
  full_name: string;
  phone: string;
  linkedin_url: string;
  availability: string;
  preferred_location: string;
}) {
  const supabase = await createClient();
  await supabase.auth.getUser();

  const { error } = await supabase
    .from("candidates")
    .update({
      full_name: data.full_name || undefined,
      phone: data.phone || null,
      linkedin_url: data.linkedin_url || null,
      availability: data.availability || null,
      preferred_location: data.preferred_location || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", data.candidateId);

  if (error) return { error: error.message };
  revalidatePath("/portal");
  return { success: true };
}

export async function saveDocument(data: {
  candidate_id: string;
  filename: string;
  storage_path: string;
  doc_type: string;
  file_size: number;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("candidate_documents").insert({
    candidate_id: data.candidate_id,
    uploaded_by: user.id,
    filename: data.filename,
    storage_path: data.storage_path,
    doc_type: data.doc_type,
    file_size: data.file_size,
  });

  if (error) return { error: error.message };
  revalidatePath("/portal");
  return { success: true };
}

export async function changePassword(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const newPass = formData.get("new_password") as string;
  const confirm = formData.get("confirm_password") as string;

  if (!newPass || newPass.length < 8)
    return { error: "Password must be at least 8 characters" };
  if (newPass !== confirm) return { error: "Passwords do not match" };

  const { error } = await supabase.auth.updateUser({ password: newPass });
  if (error) return { error: error.message };

  await supabase.rpc("clear_must_change_password");

  return { success: true };
}

export async function deleteDocument(id: string, storagePath: string | null) {
  const supabase = await createClient();
  await supabase.auth.getUser();

  if (storagePath) {
    await supabase.storage.from("candidate-documents").remove([storagePath]);
  }

  const { error } = await supabase
    .from("candidate_documents")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/portal");
  return { success: true };
}
