import { ClipboardList, FileText, GitBranch, Bot, BarChart2, Users, TrendingUp, User, ShieldCheck } from "lucide-react";

const features = [
  {
    icon: ClipboardList,
    title: "Job Management",
    body: "Create, edit, duplicate, and manage job postings with full control over status (Draft / Active / Closed). Every job is the intelligence source Carl and the AI engine use to screen and interview candidates.",
    carl: false,
  },
  {
    icon: FileText,
    title: "AI Resume Intelligence",
    body: "Upload up to 50 resumes at once. Hiventra parses every file and generates AI Match Scores across 5 dimensions: Skill Match, Experience, Industry Fit, Leadership, Communication.",
    carl: true,
  },
  {
    icon: GitBranch,
    title: "Automated Candidate Pipeline",
    body: "Hiventra automatically creates candidate accounts, sends secure interview invitations, and tracks every candidate across 8 pipeline stages — from Uploaded to Hired. Zero manual setup required.",
    carl: false,
  },
  {
    icon: Bot,
    title: "Carl — AI Interviewer",
    body: "Carl conducts adaptive, role-specific interviews for every candidate. He reads the job and the resume, generates contextual questions, analyzes answers, and probes deeper when needed — at any scale.",
    carl: true,
  },
  {
    icon: BarChart2,
    title: "Candidate Intelligence Reports",
    body: "After every interview, Carl generates a comprehensive report: Overall Score, Hiring Recommendation, Strengths, Weaknesses, Skill Breakdown, Interview Highlights, and full AI Justification.",
    carl: true,
  },
  {
    icon: Users,
    title: "Team Collaboration",
    body: "Compare candidates side-by-side. Run multi-stage approval workflows. Add comments and private notes. Align every stakeholder — from HR to Department Head — in one workspace.",
    carl: false,
  },
  {
    icon: TrendingUp,
    title: "Analytics Dashboard",
    body: "Track Time to Hire, Interview Completion Rate, Resume Acceptance, AI Recommendation Accuracy, and Skill Gaps — with charts, funnels, and trend lines across all your active jobs.",
    carl: false,
  },
  {
    icon: User,
    title: "Candidate Portal",
    body: "Candidates get their own professional portal — with application status, interview access, progress tracker, document upload, and profile management. A great experience on both sides of hiring.",
    carl: false,
  },
  {
    icon: ShieldCheck,
    title: "AI Transparency & Fairness",
    body: "Every AI decision comes with a plain-English explanation. Full audit trail. Fairness monitoring. Score override logs. Hiventra never uses black-box scoring — every recommendation is explainable.",
    carl: false,
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-20 lg:py-28 bg-slate-900" id="features">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-block text-indigo-400 text-xs font-bold tracking-widest uppercase mb-3">
            Platform Features
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-[1.1] tracking-tight mb-4">
            Everything Your Hiring Team Needs.{" "}
            <span className="gradient-text">Nothing They Don't.</span>
          </h2>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group bg-slate-800/60 border border-slate-700/60 rounded-2xl p-7 hover:border-indigo-500/40 hover:-translate-y-1 hover:bg-slate-800 transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="w-11 h-11 bg-indigo-600/20 rounded-xl flex items-center justify-center group-hover:bg-indigo-600/30 transition-colors">
                    <Icon className="w-5 h-5 text-indigo-400" />
                  </div>
                  {f.carl && (
                    <span className="inline-flex items-center gap-1 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 text-[10px] font-bold px-2.5 py-1 rounded-full">
                      ✦ Carl Powered
                    </span>
                  )}
                </div>
                <h3 className="text-white font-bold text-base mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
