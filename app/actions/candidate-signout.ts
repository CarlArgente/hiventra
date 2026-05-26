"use server";

import { redirect } from "next/navigation";
import { clearCandidateSession } from "@/lib/candidate-session";

export async function candidateSignOut(): Promise<never> {
  await clearCandidateSession();
  redirect("/candidate/login");
}
