"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCandidateSession } from "@/lib/candidate-session";
import { hashPassword } from "@/lib/candidate-crypto";

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
  const candidateId = await getCandidateSession();
  if (!candidateId) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_candidate_portal_data", {
    p_candidate_id: candidateId,
  });

  if (error || !data) return null;

  const raw = data as {
    candidate: Record<string, unknown>;
    job: Record<string, unknown> | null;
    interview: Record<string, unknown> | null;
    documents: Array<Record<string, unknown>>;
  };

  if (!raw.candidate || !raw.job) return null;

  const documents: PortalDocument[] = await Promise.all(
    (raw.documents ?? []).map(async (doc) => {
      let fileUrl = (doc.file_url as string | null) ?? null;
      if (!fileUrl && doc.storage_path) {
        const { data: signed } = await supabase.storage
          .from("candidate-documents")
          .createSignedUrl(doc.storage_path as string, 3600);
        fileUrl = signed?.signedUrl ?? null;
      }
      return {
        id: doc.id as string,
        filename: doc.filename as string,
        doc_type: doc.doc_type as string,
        file_url: fileUrl,
        storage_path: (doc.storage_path as string | null) ?? null,
        file_size: (doc.file_size as number | null) ?? null,
        created_at: doc.created_at as string,
      };
    })
  );

  const c = raw.candidate;
  const j = raw.job;
  const i = raw.interview;

  return {
    candidate: {
      id: c.id as string,
      full_name: c.full_name as string,
      email: c.email as string,
      phone: (c.phone as string | null) ?? null,
      linkedin_url: (c.linkedin_url as string | null) ?? null,
      availability: (c.availability as string | null) ?? null,
      preferred_location: (c.preferred_location as string | null) ?? null,
      stage: c.stage as string,
      resume_filename: (c.resume_filename as string | null) ?? null,
    },
    job: {
      id: j.id as string,
      title: j.title as string,
      company: j.company as string,
      carl_mode: (j.carl_mode as string) ?? "text",
      carl_duration: (j.carl_duration as number) ?? 30,
      carl_max_questions: (j.carl_max_questions as number) ?? 10,
    },
    interview: i
      ? {
          id: i.id as string,
          status: i.status as string,
          mode: (i.mode as string) ?? "text",
          questions: (i.questions as string[] | null) ?? null,
          responses:
            (i.responses as Array<{ question: string; answer: string }> | null) ?? null,
          window_start: (i.window_start as string | null) ?? null,
          window_end: (i.window_end as string | null) ?? null,
          expires_at: (i.expires_at as string | null) ?? null,
          started_at: (i.started_at as string | null) ?? null,
          completed_at: (i.completed_at as string | null) ?? null,
          ai_weaknesses: (i.ai_weaknesses as string[] | null) ?? null,
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
  const candidateId = await getCandidateSession();
  if (!candidateId) return { error: "Not authenticated" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_candidate_profile_direct", {
    p_candidate_id: candidateId,
    p_full_name: data.full_name,
    p_phone: data.phone,
    p_linkedin_url: data.linkedin_url,
    p_availability: data.availability,
    p_preferred_location: data.preferred_location,
  });

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
  const candidateId = await getCandidateSession();
  if (!candidateId) return { error: "Not authenticated" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("save_candidate_document_direct", {
    p_candidate_id: candidateId,
    p_filename: data.filename,
    p_storage_path: data.storage_path,
    p_doc_type: data.doc_type,
    p_file_size: data.file_size,
  });

  if (error) return { error: error.message };
  revalidatePath("/portal");
  return { success: true };
}

export async function changePassword(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const candidateId = await getCandidateSession();
  if (!candidateId) return { error: "Not authenticated" };

  const newPass = formData.get("new_password") as string;
  const confirm = formData.get("confirm_password") as string;

  if (!newPass || newPass.length < 8)
    return { error: "Password must be at least 8 characters" };
  if (newPass !== confirm) return { error: "Passwords do not match" };

  const newHash = hashPassword(newPass);
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_candidate_password_hash", {
    p_candidate_id: candidateId,
    p_hash: newHash,
    p_must_change: false,
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function deleteDocument(id: string, storagePath: string | null) {
  const candidateId = await getCandidateSession();
  if (!candidateId) return { error: "Not authenticated" };

  const supabase = await createClient();

  if (storagePath) {
    await supabase.storage.from("candidate-documents").remove([storagePath]);
  }

  const { error } = await supabase.rpc("delete_candidate_document_direct", {
    p_candidate_id: candidateId,
    p_doc_id: id,
  });

  if (error) return { error: error.message };
  revalidatePath("/portal");
  return { success: true };
}
