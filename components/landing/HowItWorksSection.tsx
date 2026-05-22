const steps = [
  {
    num: "01",
    title: "Create Your Job",
    body: "Define the role in minutes. Add the job title, description, required skills, and years of experience. Then configure Carl's interview style — personality, format, and depth. Hiventra uses every detail to power AI-driven screening and generate the right interview for every candidate.",
    badge: "Job Setup",
  },
  {
    num: "02",
    title: "Upload Resumes. Let AI Do the Rest.",
    body: "Drag and drop up to 50 resumes at once. Hiventra parses every file, extracts structured candidate data, creates profiles automatically, and scores each candidate against your job requirements — in minutes. No manual data entry. No spreadsheets. Just results.",
    badge: "AI Screening",
  },
  {
    num: "03",
    title: "Carl Interviews Every Candidate",
    body: "Each candidate receives a secure invitation link. When they click it, Carl takes over — conducting a fully adaptive, role-specific AI interview personalized to their resume. Carl never asks the same question twice. Every interview is generated fresh, in real time, for every person.",
    badge: "AI Interviews",
    highlight: true,
  },
  {
    num: "04",
    title: "Read the Intelligence Report",
    body: "When each interview is complete, Hiventra generates a detailed Candidate Intelligence Report — with an overall score, skill breakdown, strengths, weaknesses, risk indicators, and a clear hiring recommendation. All in one place. Ready before your next meeting.",
    badge: "Insights",
  },
  {
    num: "05",
    title: "Decide. Together.",
    body: "Compare candidates side by side. Run your approval workflow. Add comments and internal notes. Align your team — HR, Hiring Manager, and Department Head — on a single platform. Make the call with confidence.",
    badge: "Team Decision",
  },
];

export default function HowItWorksSection() {
  return (
    <section className="py-20 lg:py-28 bg-white" id="how-it-works">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block text-indigo-600 text-xs font-bold tracking-widest uppercase mb-3 bg-indigo-50 px-4 py-1.5 rounded-full">
            How It Works
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-4">
            From Job Post to Hire Decision.{" "}
            <span className="gradient-text">In Five Intelligent Steps.</span>
          </h2>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Vertical connector line */}
          <div className="hidden lg:block absolute left-[calc(50%-1px)] top-8 bottom-8 w-0.5 bg-gradient-to-b from-indigo-200 via-indigo-400 to-violet-200" />

          <div className="space-y-12 lg:space-y-16">
            {steps.map((step, i) => {
              const isRight = i % 2 === 0;
              return (
                <div
                  key={step.num}
                  className={`relative flex flex-col lg:flex-row items-center gap-6 lg:gap-12 ${
                    isRight ? "lg:flex-row" : "lg:flex-row-reverse"
                  }`}
                >
                  {/* Content */}
                  <div className="flex-1 w-full">
                    <div className={`max-w-md ${isRight ? "lg:ml-auto lg:mr-8" : "lg:mr-auto lg:ml-8"} bg-white rounded-2xl p-7 border border-slate-100 shadow-soft hover:shadow-hover hover:-translate-y-1 transition-all duration-200`}>
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-extrabold text-sm shadow-btn shrink-0 shadow-[0_0_20px_rgba(79,70,229,0.3)]">
                          {step.num}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full ${step.highlight ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                              {step.badge}
                            </span>
                          </div>
                          <h3 className="text-slate-900 font-bold text-xl mb-2 leading-snug">{step.title}</h3>
                          <p className="text-slate-500 text-sm leading-relaxed">{step.body}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Center dot for desktop */}
                  <div className="hidden lg:flex w-5 h-5 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 ring-4 ring-indigo-100 shrink-0 shadow-[0_0_15px_rgba(79,70,229,0.4)]" />

                  {/* Empty flex spacer */}
                  <div className="flex-1 hidden lg:block" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
