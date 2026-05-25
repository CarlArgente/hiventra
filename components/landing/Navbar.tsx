"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    label: "Platform",
    items: [
      { label: "Overview", href: "#product", desc: "What Hiventra does" },
      { label: "Features", href: "#features", desc: "Everything the platform offers" },
      { label: "How It Works", href: "#how-it-works", desc: "Step-by-step hiring flow" },
      { label: "The Problem", href: "#problems", desc: "Why traditional hiring fails" },
    ],
  },
  {
    label: "Carl AI",
    items: [
      { label: "Meet Carl", href: "#meet-carl", desc: "Your AI interviewer" },
      { label: "Personalities", href: "#personality", desc: "Friendly, strict, technical & more" },
      { label: "AI Transparency", href: "#transparency", desc: "Fairness & audit trail" },
    ],
  },
  {
    label: "Results",
    items: [
      { label: "Analytics", href: "#analytics", desc: "Hiring metrics & insights" },
      { label: "Stats", href: "#stats", desc: "Numbers that speak for themselves" },
      { label: "Testimonials", href: "#testimonials", desc: "What teams are saying" },
    ],
  },
  {
    label: "Solutions",
    items: [
      { label: "For HR Teams", href: "#roles", desc: "Built for every hiring role" },
      { label: "For Candidates", href: "#candidates", desc: "A great candidate experience" },
    ],
  },
];

const standaloneLinks = [{ label: "FAQ", href: "#faq" }];

function NavDropdown({
  group,
  scrolled,
  onClose,
}: {
  group: (typeof navGroups)[0];
  scrolled: boolean;
  onClose: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-1 text-sm font-medium transition-colors hover:text-indigo-400",
          scrolled ? "text-slate-600" : "text-slate-300"
        )}
      >
        {group.label}
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50">
          {group.items.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={() => { setOpen(false); onClose(); }}
              className="flex flex-col px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors group"
            >
              <span className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600">{item.label}</span>
              <span className="text-xs text-slate-400 mt-0.5">{item.desc}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const linkClass = cn(
    "text-sm font-medium transition-colors hover:text-indigo-400",
    scrolled ? "text-slate-600" : "text-slate-300"
  );

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-18">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <img src="/hiventra_icon.png" alt="Hiventra" className="w-8 h-8 rounded-lg object-cover" />
            <span className={cn("font-extrabold text-lg tracking-tight transition-colors", scrolled ? "text-slate-900" : "text-white")}>
              Hiventra
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-7">
            {navGroups.map((group) => (
              <NavDropdown key={group.label} group={group} scrolled={scrolled} onClose={() => {}} />
            ))}
            {standaloneLinks.map((link) => (
              <a key={link.label} href={link.href} className={linkClass}>{link.label}</a>
            ))}
          </nav>

          {/* CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            <a href="/signin" className={linkClass}>Log In</a>
            <a href="/signin" className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-btn hover:-translate-y-0.5 transition-all duration-200">
              Start Now <span>→</span>
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            className={cn("lg:hidden p-2 rounded-lg transition-colors", scrolled ? "text-slate-600 hover:bg-slate-100" : "text-white hover:bg-white/10")}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 shadow-lg max-h-[80vh] overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
            {navGroups.map((group) => (
              <div key={group.label}>
                <button
                  onClick={() => setMobileExpanded(mobileExpanded === group.label ? null : group.label)}
                  className="w-full flex items-center justify-between text-slate-700 font-semibold py-2.5 px-3 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  {group.label}
                  <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", mobileExpanded === group.label && "rotate-180")} />
                </button>
                {mobileExpanded === group.label && (
                  <div className="ml-3 mb-1 flex flex-col gap-0.5">
                    {group.items.map((item) => (
                      <a
                        key={item.label}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className="text-slate-600 text-sm py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        {item.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="border-t border-slate-100 my-1" />
            {standaloneLinks.map((link) => (
              <a key={link.label} href={link.href} className="text-slate-700 font-medium py-2.5 px-3 rounded-lg hover:bg-slate-50 transition-colors" onClick={() => setMobileOpen(false)}>
                {link.label}
              </a>
            ))}
            <div className="border-t border-slate-200 mt-2 pt-4 flex flex-col gap-2">
              <a href="/signin" className="text-slate-600 font-medium py-2.5 px-3 rounded-lg hover:bg-slate-50 text-center">Log In</a>
              <a href="/signin" className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold py-3 px-5 rounded-full text-center shadow-btn">Start Now →</a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}


