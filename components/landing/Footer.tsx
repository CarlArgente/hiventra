
const footerLinks = [
  {
    heading: "Product",
    links: [
      "Job Management", "Resume Intelligence", "Carl AI Interviewer",
      "Candidate Pipeline", "Intelligence Reports", "Team Collaboration",
      "Analytics Dashboard", "Candidate Portal", "AI Transparency",
    ],
  },
  {
    heading: "Company",
    links: ["About Hiventra", "Meet Carl", "Careers", "Blog", "Press", "Contact Us"],
  },
  {
    heading: "Resources",
    links: ["Documentation", "API Reference", "Integrations", "Help Center", "Security", "Status Page"],
  },
  {
    heading: "Get Started",
    links: ["Start Now", "Book a Demo", "View Pricing", "Talk to Sales", "Request Enterprise Quote"],
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
            <p className="text-slate-400 text-sm leading-relaxed mb-5">
              Intelligent Hiring, Powered by Carl AI.
              <br /><br />
              AI Talent Intelligence Platform for modern HR teams.
            </p>
            <div className="flex gap-3">
              {["in", "𝕏", "▶"].map((icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-indigo-400 hover:border-indigo-500 transition-colors text-sm font-bold">
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {footerLinks.map((col) => (
            <div key={col.heading}>
              <p className="text-white font-semibold text-sm mb-4">{col.heading}</p>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-slate-400 text-sm hover:text-indigo-400 transition-colors">
                      {link}
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-slate-500 text-sm">© 2026 Hiventra, Inc. All rights reserved.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-1 justify-center">
            {["Privacy Policy", "Terms of Service", "Cookie Policy", "GDPR", "Security"].map((link) => (
              <a key={link} href="#" className="text-slate-500 text-xs hover:text-indigo-400 transition-colors">
                {link}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
