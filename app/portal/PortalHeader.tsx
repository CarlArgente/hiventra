"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const NAV_LINKS = [
  { label: "Home", href: "/portal" },
  { label: "My Interview", href: "/portal/interview" },
  { label: "Profile", href: "/portal/profile" },
];

interface Props {
  displayName: string;
  initials: string;
}

export default function PortalHeader({ displayName, initials }: Props) {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/candidate/login");
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src="/hiventra_icon.png"
            alt="Hiventra"
            className="w-7 h-7 rounded-lg object-cover"
          />
          <span className="font-extrabold text-slate-900 text-sm tracking-tight">
            Hiventra
          </span>
        </div>

        <nav className="flex items-center gap-6">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold hover:ring-2 hover:ring-indigo-300 transition-all focus:outline-none"
              title={displayName}
            >
              {initials}
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="bg-white rounded-xl border border-slate-200 shadow-lg p-1 min-w-[180px] z-50"
            >
              <div className="px-3 py-2 mb-1 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-800 truncate">
                  {displayName}
                </p>
              </div>

              <DropdownMenu.Item
                onSelect={handleSignOut}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg cursor-pointer outline-none transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
