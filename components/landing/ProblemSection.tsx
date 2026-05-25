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
    body: "HR teams spend hours conducting initial screening interviews — only to find out 10 minutes in that the candidate doesn't meet basic requirements.",
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

        {/* Two-column: image left, problems right */}
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left: image */}
          <div className="flex-[1.4] flex items-center justify-center">
            <img
              src="/problem.png"
              alt="The Hiring Problem"
              className="w-full"
            />
          </div>

          {/* Right: pain cards stacked */}
          <div className="flex-1 flex flex-col gap-5">
            {pains.map((pain) => {
              const Icon = pain.icon;
              return (
                <div
                  key={pain.title}
                  className="bg-white rounded-2xl p-6 border border-slate-100 shadow-soft hover:shadow-hover hover:-translate-y-1 transition-all duration-200 group flex items-start gap-4"
                >
                  <div className={`w-11 h-11 ${pain.bg} rounded-xl flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 ${pain.color}`} />
                  </div>
                  <div>
                    <h3 className="text-slate-900 font-bold text-base mb-1">{pain.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{pain.body}</p>
                    {pain.stat && (
                      <p className="mt-3 text-rose-600 text-xs font-semibold border-t border-rose-100 pt-2">
                        📊 {pain.stat}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
