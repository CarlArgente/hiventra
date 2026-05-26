import { redirect } from "next/navigation";
import { getCandidateSession } from "@/lib/candidate-session";
import { createClient } from "@/lib/supabase/server";
import PortalHeader from "./PortalHeader";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const candidateId = await getCandidateSession();
  if (!candidateId) redirect("/candidate/login");

  const supabase = await createClient();
  const { data: name } = await supabase.rpc("get_candidate_name_by_id", {
    p_candidate_id: candidateId,
  });

  const displayName = (name as string | null) ?? "Candidate";
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <PortalHeader displayName={displayName} initials={initials} />
      <div className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8">
        {children}
      </div>
    </div>
  );
}
