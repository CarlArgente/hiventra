"use server";

import { createClient } from "@/lib/supabase/server";
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

  // Resolve username → email via SECURITY DEFINER function (bypasses RLS)
  const { data: email, error: rpcError } = await supabase.rpc(
    "get_candidate_email_for_login",
    { p_username: username }
  );

  if (rpcError || !email) {
    return { error: "Invalid username or password." };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return { error: "Invalid username or password." };
  }

  redirect("/portal");
}
