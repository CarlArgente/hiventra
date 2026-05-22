import { Check, X } from "lucide-react";

const plans = [
  {
    name: "Starter",
    tagline: "For small teams getting started with AI hiring",
    price: "$0",
    period: "/ month",
    cta: "Start Free →",
    ctaStyle: "border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50",
    trust: "No credit card required",
    features: [
      { text: "Up to 3 active jobs", included: true },
      { text: "Up to 100 resumes / month", included: true },
      { text: "Carl Text Interviews", included: true },
      { text: "AI Match Scoring", included: true },
      { text: "Basic Candidate Pipeline", included: true },
      { text: "1 user seat", included: true },
      { text: "Voice & Video Interviews", included: false },
      { text: "Team Collaboration", included: false },
      { text: "Analytics Dashboard", included: false },
    ],
    popular: false,
  },
  {
    name: "Growth",
    tagline: "For growing HR teams that need to move fast",
    price: "$149",
    period: "/ month",
    cta: "Start Free Trial →",
    ctaStyle: "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-btn hover:-translate-y-0.5",
    trust: "14-day free trial · No credit card required",
    features: [
      { text: "Up to 15 active jobs", included: true },
      { text: "Up to 500 resumes / month", included: true },
      { text: "Carl Text, Voice & Video Interviews", included: true },
      { text: "All 5 Carl Personality Modes", included: true },
      { text: "AI Match Scoring + Intelligence Reports", included: true },
      { text: "Full Candidate Pipeline Automation", included: true },
      { text: "Team Collaboration (up to 10 users)", included: true },
      { text: "Analytics Dashboard", included: true },
      { text: "ATS Integrations", included: false },
      { text: "SSO & SAML", included: false },
    ],
    popular: true,
  },
  {
    name: "Enterprise",
    tagline: "For large organizations with complex hiring needs",
    price: "Custom",
    period: "",
    cta: "Contact Sales →",
    ctaStyle: "border-2 border-slate-700 text-slate-700 hover:bg-slate-50",
    trust: "Dedicated Customer Success Manager",
    features: [
      { text: "Unlimited active jobs", included: true },
      { text: "Unlimited resumes", included: true },
      { text: "All Carl Interview Modes & Personalities", included: true },
      { text: "Full Intelligence Reports + AI Audit Trail", included: true },
      { text: "Unlimited user seats", included: true },
      { text: "Full Team Collaboration + Approval Workflows", included: true },
      { text: "Advanced Analytics + Custom Reports", included: true },
      { text: "ATS Integrations (Greenhouse, Lever, Workday)", included: true },
      { text: "SSO / SAML", included: true },
      { text: "SLA Guarantee", included: true },
    ],
    popular: false,
  },
];

export default function PricingSection() {
  return (
    <section className="py-20 lg:py-28 bg-slate-50" id="pricing">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-14">
          <span className="inline-block text-indigo-600 text-xs font-bold tracking-widest uppercase mb-3 bg-indigo-50 px-4 py-1.5 rounded-full">
            Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-4">
            Simple Pricing.{" "}
            <span className="gradient-text">No Surprises.</span>
          </h2>
          <p className="text-slate-500 text-lg">Start free. Scale as you grow. Enterprise contracts available.</p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-white rounded-2xl border overflow-hidden transition-all duration-200 flex flex-col ${
                plan.popular
                  ? "border-indigo-500 shadow-[0_10px_40px_-5px_rgba(79,70,229,0.25)] md:scale-105"
                  : "border-slate-200 shadow-soft hover:shadow-hover hover:-translate-y-1"
              }`}
            >
              {plan.popular && (
                <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold text-center py-2 tracking-wide">
                  ✦ MOST POPULAR
                </div>
              )}

              <div className="p-7 flex flex-col flex-1">
                <div className="mb-6">
                  <h3 className="text-slate-900 font-extrabold text-xl mb-1">{plan.name}</h3>
                  <p className="text-slate-500 text-sm">{plan.tagline}</p>
                </div>

                <div className="mb-7">
                  <span className="text-4xl font-extrabold text-slate-900">{plan.price}</span>
                  {plan.period && <span className="text-slate-400 text-base ml-1">{plan.period}</span>}
                </div>

                <a
                  href="#"
                  className={`block text-center font-semibold py-3.5 px-6 rounded-full mb-2 transition-all duration-200 ${plan.ctaStyle}`}
                >
                  {plan.cta}
                </a>
                <p className="text-center text-slate-400 text-xs mb-7">{plan.trust}</p>

                <div className="space-y-2.5 flex-1">
                  {plan.features.map((f) => (
                    <div key={f.text} className="flex items-start gap-2.5">
                      {f.included ? (
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                      )}
                      <span className={`text-sm ${f.included ? "text-slate-700" : "text-slate-400"}`}>
                        {f.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center mt-8 text-slate-400 text-sm">
          Have questions about pricing?{" "}
          <a href="#faq" className="text-indigo-600 font-semibold hover:underline">Read our FAQ →</a>
        </p>
      </div>
    </section>
  );
}
