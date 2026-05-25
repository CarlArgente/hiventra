"use client";

import { useState } from "react";
import { X } from "lucide-react";

export default function HeroSection() {
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <>
    <section className="relative min-h-screen bg-slate-900 overflow-hidden flex items-center">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "4000ms" }} />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "6000ms", animationDelay: "1000ms" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-900/30 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 w-full">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

          {/* Left: copy */}
          <div className="flex-1 text-center lg:text-left max-w-2xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-indigo-600/20 border border-indigo-500/30 rounded-full px-4 py-1.5 mb-6">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
              <span className="text-indigo-300 text-xs font-semibold tracking-wide uppercase">AI Talent Intelligence Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight mb-6">
              Stop Screening.<br />
              Start Deciding.<br />
              <span className="gradient-text">Carl Does the Rest.</span>
            </h1>

            <p className="text-slate-400 text-lg lg:text-xl leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
              Hiventra is the AI Talent Intelligence Platform that automates resume screening,
              conducts adaptive AI interviews, and delivers deep candidate intelligence —
              so your team spends time on decisions, not administration.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-6">
              <a
                href="/signin"
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold px-8 py-4 rounded-full shadow-btn hover:-translate-y-0.5 transition-all duration-200 text-base"
              >
                Start Now →
              </a>
              <button
                onClick={() => setDemoOpen(true)}
                className="flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white font-semibold px-8 py-4 rounded-full hover:bg-white/15 transition-all duration-200 text-base"
              >
                <span className="text-indigo-300">▶</span> Watch Demo
              </button>
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap gap-x-5 gap-y-2 justify-center lg:justify-start text-sm text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="text-emerald-400">✓</span> No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-emerald-400">✓</span> Up to 50 resumes per upload
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-emerald-400">✓</span> Carl ready in minutes
              </span>
            </div>
          </div>

          {/* Right: hero image (desktop only) */}
          <div className="flex-1 hidden lg:flex items-center justify-center">
            <div className="relative w-[540px] animate-float">
              <img
                src="/hiventra_hero_new.png"
                alt="Hiventra Dashboard"
                className="w-full"
              />

              {/* Top-right badge */}
              <div className="absolute top-6 -right-4 z-20">
                <div className="bg-slate-800/95 border border-indigo-500/30 rounded-full px-3.5 py-1.5 flex items-center gap-2 shadow-lg">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-slate-200 text-[11px] font-medium">3 interviews live right now</span>
                </div>
              </div>

              {/* Bottom-left badge */}
              <div className="absolute bottom-10 -left-4 z-20">
                <div className="bg-white rounded-full px-3.5 py-1.5 flex items-center gap-2 shadow-lg border border-slate-100">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-slate-700 text-[11px] font-medium">AI Report Ready · Maria Santos</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

      {/* Demo modal */}
      {demoOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={() => setDemoOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

          {/* Modal */}
          <div
            className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setDemoOpen(false)}
              className="absolute top-3 right-3 z-10 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors"
              aria-label="Close demo"
            >
              <X className="w-4 h-4" />
            </button>
            <iframe
              src="https://www.youtube.com/embed/Vh1dUG1wBDI?autoplay=1"
              title="Hiventra Demo"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>
      )}
    </>
  );
}
