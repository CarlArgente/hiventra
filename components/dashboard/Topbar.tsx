"use client";

import { LogOut, Menu } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMobileNav } from "./DashboardShell";
import AIExplainabilityPopup from "./AIExplainabilityPopup";

interface TopbarProps {
  title: string;
  subtitle?: string;
}

interface UserProfile {
  avatar_url: string | null;
  full_name: string | null;
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

export default function Topbar({ title, subtitle }: TopbarProps) {
  const router = useRouter();
  const { openMobileNav } = useMobileNav();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("profiles")
        .select("avatar_url, full_name")
        .eq("id", user.id)
        .single()
        .then(({ data }) => setProfile(data));
    });
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/signin");
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger — mobile only */}
        <button
          onClick={openMobileNav}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate">{title}</h1>
          {subtitle && <p className="text-xs text-slate-500 truncate">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <AIExplainabilityPopup />
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="w-9 h-9 rounded-full overflow-hidden focus:outline-none ring-2 ring-transparent hover:ring-indigo-300 transition-all">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name ?? "User"} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <span className="w-full h-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
                  {getInitials(profile?.full_name ?? null)}
                </span>
              )}
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="z-50 min-w-[160px] bg-white rounded-xl border border-slate-200 shadow-lg p-1"
            >
              <DropdownMenu.Item
                onSelect={handleSignOut}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 rounded-lg cursor-pointer hover:bg-red-50 outline-none"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
