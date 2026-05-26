import { redirect } from "next/navigation";
import { getCandidateSession } from "@/lib/candidate-session";
import { createClient } from "@/lib/supabase/server";
import ProfileClient from "./ProfileClient";

export default async function PortalProfilePage() {
  const candidateId = await getCandidateSession();
  if (!candidateId) redirect("/candidate/login");

  const supabase = await createClient();
  const { data: profile } = await supabase.rpc("get_candidate_profile_data", {
    p_candidate_id: candidateId,
  });

  const p = profile as {
    full_name: string | null;
    email: string | null;
    username: string | null;
    must_change_password: boolean | null;
  } | null;

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-xl font-extrabold text-slate-900">My Profile</h1>
        <p className="text-sm text-slate-500 mt-1">
          View your account details and manage your password.
        </p>
      </div>
      <ProfileClient
        fullName={p?.full_name ?? "Candidate"}
        email={p?.email ?? ""}
        username={p?.username ?? null}
        mustChangePassword={p?.must_change_password ?? false}
      />
    </div>
  );
}
