import Link from "next/link";
import { signInWithGoogle } from "@/app/actions/auth";

export default function SignInPage() {
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
            Automate screening, conduct AI interviews, and make faster, fairer hiring decisions — all in one platform.
          </p>

          {/* Feature pills */}
          <div className="flex flex-col gap-3 w-full">
            {[
              { icon: "✦", label: "AI resume scoring in seconds" },
              { icon: "✦", label: "Carl conducts voice & video interviews" },
              { icon: "✦", label: "Deep candidate intelligence reports" },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-left">
                <span className="text-indigo-400 text-xs">{icon}</span>
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
            <h2 className="text-2xl font-extrabold text-white mb-1">Welcome back</h2>
            <p className="text-slate-400 text-sm">Sign in to your Hiventra account</p>
          </div>

          {/* Google OAuth */}
          <form action={signInWithGoogle}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 bg-white text-slate-800 font-semibold px-6 py-3.5 rounded-full hover:bg-slate-100 transition-all duration-200 shadow-md hover:-translate-y-0.5"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-slate-600 text-xs">OR</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          {/* Candidate login link */}
          <Link
            href="/candidate/login"
            className="w-full flex items-center justify-center gap-2 border border-slate-700 text-slate-300 font-medium px-6 py-3.5 rounded-full hover:border-indigo-500 hover:text-white transition-all duration-200 text-sm"
          >
            Sign in as Candidate
          </Link>

          {/* Terms */}
          <p className="text-center text-slate-600 text-xs mt-8 leading-relaxed">
            By continuing, you agree to Hiventra&apos;s{" "}
            <Link href="/terms" className="text-indigo-400 hover:text-indigo-300 transition-colors">Terms of Service</Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-indigo-400 hover:text-indigo-300 transition-colors">Privacy Policy</Link>.
          </p>
        </div>
      </div>

    </div>
  );
}
