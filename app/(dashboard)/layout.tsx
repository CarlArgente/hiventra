import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidenav from "@/components/dashboard/Sidenav";
import DashboardShell from "@/components/dashboard/DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role === "candidate") {
    redirect("/portal");
  }

  return (
    <DashboardShell>
      <div className="flex h-screen bg-slate-50 overflow-hidden">
        <Sidenav />
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {children}
        </div>
      </div>
    </DashboardShell>
  );
}
