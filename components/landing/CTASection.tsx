export default function CTASection() {
  return (
    <section className="py-20 lg:py-28 bg-slate-900 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
        {/* Carl avatar */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-[0_0_40px_rgba(79,70,229,0.5)] animate-pulse" style={{ animationDuration: "3000ms" }}>
              <span className="text-white text-2xl font-extrabold">C</span>
            </div>
          </div>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight mb-6">
          Your Next Great Hire{" "}
          <span className="gradient-text">Is Already in Your Inbox.</span>{" "}
          Let Carl Find Them.
        </h2>

        <p className="text-slate-400 text-lg leading-relaxed mb-10">
          Join the HR teams using Hiventra to hire faster, smarter, and fairer.
          No credit card required. Carl is ready when you are.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <a
            href="/signin"
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold px-8 py-4 rounded-full shadow-btn hover:-translate-y-0.5 transition-all duration-200 text-base"
          >
            Start Now →
          </a>
        </div>

        {/* Trust signals */}
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-slate-400">
          {["SOC 2 Compliant", "GDPR Ready"].map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <span className="text-emerald-400">✓</span> {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
