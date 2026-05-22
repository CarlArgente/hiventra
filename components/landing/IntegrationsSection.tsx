const integrationGroups = [
  {
    category: "ATS & HRIS",
    items: [
      { name: "Greenhouse", tagline: "Push candidates and hiring data directly", logo: "🌿" },
      { name: "Lever", tagline: "Sync job postings and candidate records", logo: "⚙️" },
      { name: "Workday", tagline: "Enterprise HRIS integration", logo: "🏢" },
      { name: "BambooHR", tagline: "Connect your HR record system", logo: "🎋" },
    ],
  },
  {
    category: "Calendar & Communication",
    items: [
      { name: "Google Calendar", tagline: "Interview scheduling and reminders", logo: "📅" },
      { name: "Outlook", tagline: "Calendar sync for hiring teams", logo: "📧" },
      { name: "Slack", tagline: "Real-time hiring team notifications", logo: "💬" },
      { name: "SendGrid", tagline: "Custom email delivery for invitations", logo: "✉️" },
    ],
  },
  {
    category: "SSO & Security",
    items: [
      { name: "Google SSO", tagline: "One-click login for your team", logo: "🔐" },
      { name: "Microsoft SSO", tagline: "Azure AD / SAML integration", logo: "🔒" },
    ],
  },
];

export default function IntegrationsSection() {
  return (
    <section className="py-20 lg:py-28 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-block text-indigo-600 text-xs font-bold tracking-widest uppercase mb-3 bg-indigo-50 px-4 py-1.5 rounded-full">
            Integrations
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-4">
            Hiventra Fits Into Your Stack.{" "}
            <span className="gradient-text">Not the Other Way Around.</span>
          </h2>
          <p className="text-slate-500 text-lg leading-relaxed">
            Connect your existing tools in minutes. Hiventra integrates with the ATS,
            calendar, and communication platforms your team already uses.
          </p>
        </div>

        {/* Groups */}
        <div className="space-y-10">
          {integrationGroups.map((group) => (
            <div key={group.category}>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">{group.category}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {group.items.map((item) => (
                  <div
                    key={item.name}
                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-soft hover:shadow-hover hover:-translate-y-1 transition-all duration-200 group flex flex-col items-start gap-3"
                  >
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 text-xl">
                      {item.logo}
                    </div>
                    <div>
                      <p className="text-slate-800 font-semibold text-sm">{item.name}</p>
                      <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{item.tagline}</p>
                    </div>
                    <div className="mt-auto">
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400 border border-slate-200 rounded-full px-2.5 py-1 group-hover:border-indigo-300 group-hover:text-indigo-500 transition-colors">
                        Connect →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <a href="#" className="inline-flex items-center gap-2 text-indigo-600 font-semibold hover:text-violet-600 transition-colors">
            View All Integrations →
          </a>
        </div>
      </div>
    </section>
  );
}
