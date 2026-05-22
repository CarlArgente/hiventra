import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Candidate top nav */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
              <span className="text-white font-extrabold text-xs">H</span>
            </div>
            <span className="font-extrabold text-slate-900 text-sm tracking-tight">Hiventra</span>
          </div>
          <nav className="flex items-center gap-6">
            {[
              { label: "Home", href: "/portal" },
              { label: "My Interview", href: "/portal/interview" },
            ].map((l) => (
              <Link key={l.href} href={l.href} className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">
            C
          </div>
        </div>
      </header>
      <div className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8">
        {children}
      </div>
    </div>
  );
}
