"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface JobPayload {
  title: string;
  company: string;
  department: string;
  employment_type: string;
  location: string;
  is_remote: boolean;
  salary_min: number | null;
  salary_max: number | null;
  currency: string;
  description: string;
  required_skills: string[];
  experience_min: number;
  experience_max: number;
  status: string;
  carl_mode: string;
  carl_personality: string;
  carl_duration: number;
  carl_max_questions: number;
}

export async function createJob(payload: JobPayload) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase.from("jobs").insert({ ...payload, created_by: user.id });
  if (error) return { error: error.message };

  revalidatePath("/dashboard/jobs");
  return { success: true };
}

export async function updateJob(id: string, payload: JobPayload) {
  const supabase = await createClient();
  await supabase.auth.getUser();

  const { error } = await supabase.from("jobs").update(payload).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/jobs");
  return { success: true };
}

export async function updateJobStatus(id: string, status: string) {
  const supabase = await createClient();
  await supabase.auth.getUser();
  await supabase.from("jobs").update({ status }).eq("id", id);
  revalidatePath("/dashboard/jobs");
}

export async function duplicateJob(id: string) {
  const supabase = await createClient();
  await supabase.auth.getUser();
  const { data: job } = await supabase.from("jobs").select("*").eq("id", id).single();
  if (!job) return;
  const { id: _id, created_at, updated_at, ...rest } = job;
  await supabase.from("jobs").insert({
    ...rest,
    title: `${rest.title} (Copy)`,
    status: "draft",
  });
  revalidatePath("/dashboard/jobs");
}
