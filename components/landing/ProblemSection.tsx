import { Clock, ClipboardList, Inbox, CalendarX } from "lucide-react";

const pains = [
  {
    icon: Clock,
    color: "text-amber-500",
    bg: "bg-amber-50",
    title: "Weeks of wasted hours",
    body: "The average hire takes 36 days. HR teams spend 70% of that time on manual screening, scheduling, and writing the same interview questions for every role.",
  },
  {
    icon: ClipboardList,
    color: "text-indigo-500",
    bg: "bg-indigo-50",
    title: "Every interview is different",
    body: "Without a structured process, two candidates for the same role may get entirely different questions, depth, and scoring — making fair comparison nearly impossible.",
  },
  {
    icon: Inbox,
    color: "text-violet-500",
    bg: "bg-violet-50",
    title: "Resumes pile up, talent walks away",
    body: "When 80 resumes land in your inbox, most never get a proper look. The best candidates move on while you're still working through page one.",
  },
  {
    icon: CalendarX,
    color: "text-rose-500",
    bg: "bg-rose-50",
    title: "Not every applicant deserves an hour",
    body: "HR teams spend hours conducting initial screening interviews — only to find out 10 minutes in that the candidate doesn't meet basic requirements. Every unqualified interview is time stolen from candidates who actually matter.",
    stat: "The average HR team wastes 14 hours per week on unqualified screening interviews.",
  },
];

export default function ProblemSection() {
  return (
    <section className="py-20 lg:py-28 bg-slate-50" id="problems">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-block text-indigo-600 text-xs font-bold tracking-widest uppercase mb-3 bg-indigo-50 px-4 py-1.5 rounded-full">
            The Hiring Problem
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-4">
            Great Talent Is Out There.{" "}
            <span className="gradient-text">Your Process Is the Bottleneck.</span>
          </h2>
          <p className="text-slate-500 text-lg leading-relaxed">
            Traditional hiring is slow, inconsistent, and expensive. Your team is buried under resumes,
            scheduling conflicts, and gut-feel decisions — while top candidates move on.
          </p>
        </div>

        {/* Pain cards — 2×2 grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {pains.map((pain) => {
            const Icon = pain.icon;
            return (
              <div
                key={pain.title}
                className="bg-white rounded-2xl p-7 border border-slate-100 shadow-soft hover:shadow-hover hover:-translate-y-1 transition-all duration-200 group"
              >
                <div className={`w-12 h-12 ${pain.bg} rounded-xl flex items-center justify-center mb-5`}>
                  <Icon className={`w-6 h-6 ${pain.color}`} />
                </div>
                <h3 className="text-slate-900 font-bold text-lg mb-2">{pain.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{pain.body}</p>
                {pain.stat && (
                  <p className="mt-4 text-rose-600 text-xs font-semibold border-t border-rose-100 pt-3">
                    📊 {pain.stat}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
