import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PortalHeader from "./PortalHeader";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/candidate/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const displayName = profile?.full_name ?? user.email ?? "Candidate";
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
