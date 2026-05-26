"use server";

import { createClient } from "@/lib/supabase/server";
import { verifyPassword } from "@/lib/candidate-crypto";
import { setCandidateSession } from "@/lib/candidate-session";
import { redirect } from "next/navigation";

export async function candidateSignIn(
  _prev: { error: string } | null,
  formData: FormData
): Promise<{ error: string }> {
  const username = (formData.get("username") as string | null)?.trim() ?? "";
  const password = (formData.get("password") as string | null) ?? "";

  if (!username || !password) {
    return { error: "Username and password are required." };
  }

  const supabase = await createClient();

  const { data: rows, error: rpcError } = await supabase.rpc("verify_candidate_login", {
    p_username: username,
  });

  if (rpcError || !rows || rows.length === 0) {
    return { error: "Invalid username or password." };
  }

  const row = rows[0] as {
    candidate_id: string;
    password_hash: string;
    can_logged_in: boolean;
  };

  if (!row.can_logged_in) {
    return { error: "This account has been disabled." };
  }

  if (!verifyPassword(password, row.password_hash)) {
    return { error: "Invalid username or password." };
  }

  await setCandidateSession(row.candidate_id);
  redirect("/portal");
}
