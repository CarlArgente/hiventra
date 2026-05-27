
const columns = [
  {
    heading: "Product",
    links: [
      { label: "Features",        href: "#features" },
      { label: "How It Works",    href: "#how-it-works" },
      { label: "Analytics",       href: "#analytics" },
      { label: "AI Transparency", href: "#transparency" },
    ],
  },
  {
    heading: "Carl AI",
    links: [
      { label: "Meet Carl",          href: "#meet-carl" },
      { label: "Carl's Personality", href: "#personality" },
      { label: "For Candidates",     href: "#candidates" },
      { label: "For Teams",          href: "#roles" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "Testimonials", href: "#testimonials" },
      { label: "FAQ",          href: "#faq" },
    ],
  },
  {
    heading: "Access",
    links: [
      { label: "Sign In (HR)",       href: "/signin" },
      { label: "Candidate Login",    href: "/candidate/login" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800">
      {/* Main grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img src="/hiventra_icon.png" alt="Hiventra" className="w-8 h-8 rounded-lg object-cover" />
              <span className="text-white font-extrabold text-lg">Hiventra</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Intelligent Hiring, Powered by Carl AI.
              <br /><br />
              AI Talent Intelligence Platform for modern HR teams.
            </p>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.heading}>
              <p className="text-white font-semibold text-sm mb-4">{col.heading}</p>
              <ul className="space-y-2.5">
                {col.links.map(({ label, href }) => (
                  <li key={href}>
                    <a href={href} className="text-slate-400 text-sm hover:text-indigo-400 transition-colors">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <p className="text-slate-500 text-sm text-center sm:text-left">© 2026 Hiventra, Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
