import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileClient from "./ProfileClient";

export default async function PortalProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/candidate/login");

  const [{ data: profile }, { data: candidate }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    supabase
      .from("candidates")
      .select("id")
      .eq("email", user.email!)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const { data: creds } = candidate
    ? await supabase
        .from("candidate_credentials")
        .select("username, must_change_password")
        .eq("candidate_id", candidate.id)
        .maybeSingle()
    : { data: null };

  const fullName = profile?.full_name ?? user.email ?? "Candidate";

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-xl font-extrabold text-slate-900">My Profile</h1>
        <p className="text-sm text-slate-500 mt-1">View your account details and manage your password.</p>
      </div>
      <ProfileClient
        fullName={fullName}
        email={user.email ?? ""}
        username={creds?.username ?? null}
        mustChangePassword={creds?.must_change_password ?? false}
      />
    </div>
  );
}
