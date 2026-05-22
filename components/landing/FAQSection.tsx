"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const faqs = [
  {
    q: "Does Carl replace human interviewers?",
    a: "No. Carl handles the early-stage screening interview — the repetitive, time-consuming part that every HR team dreads. Human interviewers still conduct final-round conversations for shortlisted candidates. Carl gives your team better candidates to talk to, faster.",
  },
  {
    q: "How does Carl generate interview questions?",
    a: "Carl reads the full job description and the candidate's resume before generating a single question. He doesn't use pre-written templates. Every question is generated in real time based on the specific role and the specific person — and every follow-up adapts to the answer given.",
  },
  {
    q: "Is Hiventra fair? Can AI screening be biased?",
    a: "We take this seriously. Hiventra does not use demographic data in scoring. Every AI decision comes with a plain-English explanation. Our fairness monitoring system flags statistical anomalies in scoring patterns. Full audit logs are available for compliance review at any time.",
  },
  {
    q: "How long does it take to get started?",
    a: "You can create your first job posting and upload resumes within minutes of signing up. Carl is ready to conduct interviews as soon as candidates receive their invitations — no setup or training required.",
  },
  {
    q: "What resume formats does Hiventra support?",
    a: "Hiventra supports PDF and DOCX files. You can upload up to 50 resumes per session. The AI parses each file automatically and creates structured candidate profiles — no manual data entry needed.",
  },
  {
    q: "Can candidates choose how they interview?",
    a: "HR teams configure the interview mode (Text, Voice, or Video) when setting up each job. The selected mode is applied consistently across all candidates for that job to ensure a fair comparison.",
  },
  {
    q: "Does Hiventra integrate with our existing ATS?",
    a: "Yes. Hiventra integrates with Greenhouse, Lever, Workday, and BambooHR. Additional integrations for calendar, communication, and SSO are available on Growth and Enterprise plans.",
  },
  {
    q: "Is our candidate data secure?",
    a: "All candidate data is encrypted at rest (AES-256) and in transit (TLS 1.3). Hiventra is SOC 2 Type II compliant and GDPR/CCPA ready. Candidate invitation links are tokenized and time-limited. Role-based access control is enforced at every level.",
  },
];

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(0);
  const half = Math.ceil(faqs.length / 2);
  const left = faqs.slice(0, half);
  const right = faqs.slice(half);

  function FAQItem({ item, index }: { item: typeof faqs[0]; index: number }) {
    const isOpen = open === index;
    return (
      <button
        className="w-full text-left border-b border-slate-100 last:border-0 py-5 group"
        onClick={() => setOpen(isOpen ? null : index)}
      >
        <div className="flex items-start justify-between gap-4">
          <p className="text-slate-800 font-semibold text-sm leading-relaxed pr-2">{item.q}</p>
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${isOpen ? "border-indigo-600 bg-indigo-600" : "border-slate-300"}`}>
            {isOpen ? (
              <Minus className="w-3 h-3 text-white" />
            ) : (
              <Plus className="w-3 h-3 text-slate-500" />
            )}
          </div>
        </div>
        {isOpen && (
          <p className="text-slate-500 text-sm leading-relaxed mt-3 pr-8">{item.a}</p>
        )}
      </button>
    );
  }

  return (
    <section className="py-20 lg:py-28 bg-white" id="faq">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-14">
          <span className="inline-block text-indigo-600 text-xs font-bold tracking-widest uppercase mb-3 bg-indigo-50 px-4 py-1.5 rounded-full">
            Frequently Asked Questions
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-4">
            Got Questions?{" "}
            <span className="gradient-text">Carl Has Answers. So Do We.</span>
          </h2>
        </div>

        {/* Two-column FAQ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-soft px-6 py-2">
            {left.map((item, i) => (
              <FAQItem key={item.q} item={item} index={i} />
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-soft px-6 py-2 mt-4 lg:mt-0">
            {right.map((item, i) => (
              <FAQItem key={item.q} item={item} index={i + half} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
