"use client";

import { useActionState } from "react";
import { candidateSignIn } from "@/app/actions/candidate-signin";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export default function CandidateLoginPage() {
  const [state, action, pending] = useActionState(candidateSignIn, null);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel — branding ── */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center overflow-hidden bg-slate-900">
        {/* Animated gradient orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "4000ms" }} />
          <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "6000ms" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-2xl animate-pulse" style={{ animationDuration: "5000ms" }} />
        </div>

        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center px-12 max-w-lg">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <img src="/hiventra_icon.png" alt="Hiventra" className="w-12 h-12 rounded-2xl object-cover shadow-[0_0_30px_rgba(99,102,241,0.4)]" />
            <span className="font-extrabold text-2xl text-white tracking-tight">Hiventra</span>
          </div>

          {/* Tagline */}
          <h1 className="text-4xl font-extrabold text-white leading-tight mb-4 tracking-tight">
            Intelligent Hiring,<br />
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Powered by Carl AI.
            </span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed mb-10">
            Your interview is waiting. Sign in with the credentials sent to your email to get started.
          </p>

          {/* Steps */}
          <div className="flex flex-col gap-3 w-full">
            {[
              { step: "1", label: "Sign in with your credentials" },
              { step: "2", label: "Meet Carl, your AI interviewer" },
              { step: "3", label: "Complete your interview at your own pace" },
            ].map(({ step, label }) => (
              <div key={step} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-left">
                <span className="w-6 h-6 rounded-full bg-indigo-600/40 border border-indigo-500/50 flex items-center justify-center text-indigo-300 text-xs font-bold shrink-0">{step}</span>
                <span className="text-slate-300 text-sm">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom back link */}
        <div className="absolute bottom-6 left-6">
          <Link href="/" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-sm transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center min-h-screen bg-slate-950 px-6 relative">
        {/* Mobile back link */}
        <div className="absolute top-6 left-6 lg:hidden">
          <Link href="/" className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
        </div>

        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-2.5 mb-10 lg:hidden">
            <img src="/hiventra_icon.png" alt="Hiventra" className="w-9 h-9 rounded-xl object-cover shadow-lg" />
            <span className="font-extrabold text-xl text-white tracking-tight">Hiventra</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-extrabold text-white mb-1">Candidate Portal</h2>
            <p className="text-slate-400 text-sm">Sign in with the credentials sent to your email</p>
          </div>

          <form action={action} className="space-y-4">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-1.5">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                placeholder="e.g. john.doe1234"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="Your temporary password"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 pr-11 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {state?.error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                <span className="shrink-0">⚠</span>
                {state.error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={pending}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold px-6 py-3.5 rounded-full hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-[0_4px_14px_0_rgba(79,70,229,0.35)] mt-2"
            >
              {pending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="text-center text-slate-600 text-xs mt-8 leading-relaxed">
            Are you a recruiter?{" "}
            <Link href="/signin" className="text-indigo-400 hover:text-indigo-300 transition-colors">
              Sign in here
            </Link>
          </p>
        </div>
      </div>

    </div>
  );
}
