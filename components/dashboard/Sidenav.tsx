"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Upload,
  Users,
  Bot,
  Users2,
  BarChart3,
  ShieldCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useMobileNav } from "./DashboardShell";

const navGroups = [
  {
    label: "Main",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Job Management", href: "/dashboard/jobs", icon: Briefcase },
      { label: "Resume Upload", href: "/dashboard/upload", icon: Upload },
      { label: "Candidate Pipeline", href: "/dashboard/pipeline", icon: Users },
      { label: "Carl Config", href: "/dashboard/carl-config", icon: Bot },
    ],
  },
  {
    label: "Team",
    items: [
      { label: "Collaboration", href: "/dashboard/collaboration", icon: Users2 },
      { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Admin",
    items: [
      { label: "AI Audit", href: "/dashboard/audit", icon: ShieldCheck },
      { label: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

function SidenavInner({ collapsed, onLinkClick }: { collapsed: boolean; onLinkClick?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
      {navGroups.map((group) => (
        <div key={group.label}>
          {!collapsed && (
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest px-2 mb-2">
              {group.label}
            </p>
          )}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    onClick={onLinkClick}
                    className={cn(
                      "flex items-center gap-3 px-2 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                      collapsed && "justify-center",
                      active
                        ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export default function Sidenav() {
  const [collapsed, setCollapsed] = useState(false);
  const { mobileOpen, closeMobileNav } = useMobileNav();

  const logoArea = (show: boolean) => (
    <div className={cn("flex items-center gap-2.5 px-4 py-5 border-b border-slate-800", !show && "justify-center px-0")}>
      <img src="/hiventra_icon.png" alt="Hiventra" className="w-8 h-8 shrink-0 rounded-lg object-cover shadow-lg" />
      {show && <span className="font-extrabold text-white text-base tracking-tight">Hiventra</span>}
    </div>
  );

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside
        className={cn(
          "relative hidden lg:flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300 shrink-0",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {logoArea(!collapsed)}
        <SidenavInner collapsed={collapsed} />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-slate-700 border border-slate-600 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors z-10"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            onClick={closeMobileNav}
          />
          {/* Drawer */}
          <aside className="fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-slate-900 border-r border-slate-800 lg:hidden">
            <div className="flex items-center justify-between px-4 py-5 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <img src="/hiventra_icon.png" alt="Hiventra" className="w-8 h-8 shrink-0 rounded-lg object-cover shadow-lg" />
                <span className="font-extrabold text-white text-base tracking-tight">Hiventra</span>
              </div>
              <button
                onClick={closeMobileNav}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <SidenavInner collapsed={false} onLinkClick={closeMobileNav} />
          </aside>
        </>
      )}
    </>
  );
}
