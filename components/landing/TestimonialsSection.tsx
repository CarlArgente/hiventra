const testimonials = [
  {
    quote:
      "The AI match scores are more accurate than I expected. Carl catches things we used to miss entirely — like candidates who write a great resume but can't explain their own experience.",
    name: "Samantha Park",
    role: "HR Director · CloudBase Solutions",
    initials: "SP",
  },
  {
    quote:
      "Our Hiring Managers used to hate the review process. Now they look forward to opening the Intelligence Reports. Carl gives them something concrete to react to.",
    name: "Marcus Chen",
    role: "VP of Engineering · Orion Systems",
    initials: "MC",
  },
  {
    quote:
      "The transparency features sold our legal team. They wanted to know how every score was calculated. Hiventra had an answer for every question they asked.",
    name: "Priya Nair",
    role: "CHRO · Meridian Financial Group",
    initials: "PN",
  },
];

const companies = ["TechNova", "CloudBase", "Orion Systems", "Meridian Financial", "Apex Global", "Vertex Health"];

export default function TestimonialsSection() {
  return (
    <section className="py-20 lg:py-28 bg-white" id="testimonials">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-block text-indigo-600 text-xs font-bold tracking-widest uppercase mb-3 bg-indigo-50 px-4 py-1.5 rounded-full">
            What Teams Are Saying
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-4">
            HR Teams That Switched to Hiventra{" "}
            <span className="gradient-text">Don't Go Back.</span>
          </h2>
        </div>

        {/* Featured testimonial */}
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-8 lg:p-12 mb-8 relative overflow-hidden">
          <div className="absolute top-4 left-8 text-white/10 text-[120px] font-serif leading-none select-none">"</div>
          <div className="relative">
            <div className="flex gap-1 mb-5">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-yellow-400 text-lg">★</span>
              ))}
            </div>
            <p className="text-white text-xl lg:text-2xl font-semibold leading-relaxed mb-6 max-w-3xl">
              "We cut our average time-to-hire from 34 days to 12. Carl interviewed 200 candidates in 3 weeks —
              something that would have taken our team 6 months to schedule and complete.
              The intelligence reports alone changed how we make decisions."
            </p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-white font-bold">JR</span>
              </div>
              <div>
                <p className="text-white font-bold">Jordan Reyes</p>
                <p className="text-indigo-200 text-sm">Head of Talent Acquisition · TechNova Inc.</p>
              </div>
            </div>
          </div>
        </div>

        {/* 3 cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="bg-white rounded-2xl p-7 border border-slate-100 shadow-soft hover:shadow-hover hover:-translate-y-1 transition-all duration-200"
            >
              <div className="flex gap-1 mb-5">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-sm">★</span>
                ))}
              </div>
              <p className="text-slate-600 text-sm leading-relaxed mb-6 italic">"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                  <span className="text-indigo-600 text-xs font-bold">{t.initials}</span>
                </div>
                <div>
                  <p className="text-slate-900 font-semibold text-sm">{t.name}</p>
                  <p className="text-slate-400 text-xs">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Company logos strip */}
        <div className="text-center">
          <p className="text-slate-400 text-sm font-medium mb-6">Trusted by hiring teams at:</p>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
            {companies.map((c) => (
              <span key={c} className="text-slate-300 font-bold text-sm tracking-wide">{c}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
