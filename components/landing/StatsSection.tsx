const stats = [
  { value: "50", label: "Resumes per upload", suffix: "" },
  { value: "64", label: "Faster time-to-hire on average", suffix: "% ↓" },
  { value: "89", label: "AI Score Accuracy Rate", suffix: "%" },
  { value: "10,000+", label: "Candidates Interviewed by Carl", suffix: "" },
];

export default function StatsSection() {
  return (
    <section className="py-20 lg:py-24 bg-gradient-to-r from-indigo-600 to-violet-700 relative overflow-hidden">
      {/* Background effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            The Numbers Speak for Themselves.
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-2 tracking-tight">
                {s.value}{s.suffix && <span className="text-indigo-200">{s.suffix}</span>}
              </div>
              <p className="text-indigo-100 text-sm leading-snug">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
