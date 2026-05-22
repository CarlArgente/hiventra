"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = ["Product", "Features", "How It Works", "Pricing", "Blog"];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

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
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-btn">
              <span className="text-white font-extrabold text-sm">H</span>
            </div>
            <span
              className={cn(
                "font-extrabold text-lg tracking-tight transition-colors",
                scrolled ? "text-slate-900" : "text-white"
              )}
            >
              Hiventra
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link}
                href={`#${link.toLowerCase().replace(/\s+/g, "-")}`}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-indigo-400",
                  scrolled ? "text-slate-600" : "text-slate-300"
                )}
              >
                {link}
              </a>
            ))}
          </nav>

          {/* CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            <a
              href="#"
              className={cn(
                "text-sm font-medium transition-colors hover:text-indigo-400",
                scrolled ? "text-slate-600" : "text-slate-300"
              )}
            >
              Log In
            </a>
            <a
              href="#"
              className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-btn hover:-translate-y-0.5 transition-all duration-200"
            >
              Start Free Trial
              <span>→</span>
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            className={cn(
              "lg:hidden p-2 rounded-lg transition-colors",
              scrolled
                ? "text-slate-600 hover:bg-slate-100"
                : "text-white hover:bg-white/10"
            )}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-2">
            {navLinks.map((link) => (
              <a
                key={link}
                href={`#${link.toLowerCase().replace(/\s+/g, "-")}`}
                className="text-slate-700 font-medium py-2.5 px-3 rounded-lg hover:bg-slate-50 transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {link}
              </a>
            ))}
            <div className="border-t border-slate-200 mt-2 pt-4 flex flex-col gap-2">
              <a href="#" className="text-slate-600 font-medium py-2.5 px-3 rounded-lg hover:bg-slate-50 text-center">
                Log In
              </a>
              <a href="#" className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold py-3 px-5 rounded-full text-center shadow-btn">
                Start Free Trial →
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
