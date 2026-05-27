import Link from "next/link";

export const metadata = { title: "Privacy Policy — Hiventra" };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-300">
      {/* Header */}
      <div className="border-b border-slate-800">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/hiventra_icon.png" alt="Hiventra" className="w-8 h-8 rounded-lg object-cover" />
            <span className="font-extrabold text-white text-base">Hiventra</span>
          </Link>
          <Link href="/signin" className="text-sm text-slate-400 hover:text-white transition-colors">
            ← Back to Sign In
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-14">
        <h1 className="text-3xl font-extrabold text-white mb-2">Privacy Policy</h1>
        <p className="text-slate-500 text-sm mb-10">Effective date: January 1, 2026</p>

        <div className="space-y-10 text-sm leading-relaxed">

          <section>
            <h2 className="text-white font-bold text-base mb-3">1. Overview</h2>
            <p>
              Hiventra, Inc. ("we", "us", "our") operates the Hiventra AI Talent Intelligence Platform. This Privacy Policy explains how we collect, use, store, and protect information when you use our Platform. By using Hiventra, you consent to the practices described here.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">2. Information We Collect</h2>
            <p className="mb-3 font-medium text-slate-400">From recruiters and HR users:</p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 mb-5">
              <li>Name, email address, and profile picture (via Google OAuth)</li>
              <li>Organization name and role</li>
              <li>Job postings, hiring preferences, and Carl configuration settings</li>
            </ul>
            <p className="mb-3 font-medium text-slate-400">From candidates:</p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400">
              <li>Full name, email address, phone number, and location</li>
              <li>Resume files (PDF or DOCX)</li>
              <li>Interview responses, voice recordings, and transcriptions</li>
              <li>AI-generated scores, summaries, and recommendations</li>
              <li>Login credentials (username; passwords are hashed and never stored in plain text)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400">
              <li>To provide and operate the Platform's core features</li>
              <li>To process resumes and generate AI-based candidate scores via Claude (Anthropic)</li>
              <li>To conduct AI-assisted interviews and transcribe voice responses via Whisper (OpenAI)</li>
              <li>To deliver Carl's voice responses via ElevenLabs TTS</li>
              <li>To send candidate credentials and interview invites via email (MailerSend, Resend)</li>
              <li>To generate audit logs for AI transparency and compliance</li>
              <li>To improve the Platform's performance and detect abuse</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">4. Third-Party Services</h2>
            <p className="mb-3">We share data with the following trusted service providers solely to deliver the Platform's functionality:</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 pr-4 text-slate-400 font-semibold">Provider</th>
                    <th className="text-left py-2 pr-4 text-slate-400 font-semibold">Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {[
                    ["Supabase", "Database, authentication, and file storage"],
                    ["Anthropic (Claude)", "Resume scoring and interview analysis"],
                    ["OpenAI (Whisper)", "Voice transcription"],
                    ["ElevenLabs", "Text-to-speech for Carl's voice"],
                    ["Resend", "Interview invite emails"],
                    ["MailerSend", "Candidate credential emails"],
                    ["Vercel", "Platform hosting and deployment"],
                    ["Simli", "AI avatar video stream (video interview mode)"],
                  ].map(([provider, purpose]) => (
                    <tr key={provider}>
                      <td className="py-2 pr-4 text-white font-medium">{provider}</td>
                      <td className="py-2 text-slate-400">{purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4">
              We do not sell your data to any third party. We do not use your data for advertising.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">5. Data Storage & Security</h2>
            <p className="mb-3">
              All data is stored in Supabase (PostgreSQL) with row-level security (RLS) enforced at the database layer. Candidate passwords are hashed using scrypt before storage. Resume files are stored in Supabase Storage with access controlled by RLS policies.
            </p>
            <p>
              We implement industry-standard security measures including HTTPS, encrypted storage, and role-based access control. However, no method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">6. AI Transparency</h2>
            <p>
              Every AI decision (resume score, interview analysis, recommendation) is logged in an immutable audit trail accessible to HR administrators. Candidates may request an explanation of how their scores were calculated by contacting their HR administrator.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">7. Data Retention</h2>
            <p>
              Candidate data is retained for the duration of the hiring process and may be retained for up to 12 months thereafter for compliance and audit purposes. HR users may delete candidate records at any time from the Platform. Upon account termination, data is removed within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">8. Your Rights</h2>
            <p className="mb-3">Depending on your jurisdiction, you may have the right to:</p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data ("right to be forgotten")</li>
              <li>Object to or restrict certain processing activities</li>
              <li>Data portability (receive your data in a structured, machine-readable format)</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, contact us at <span className="text-indigo-400">support@hiventra.live</span>.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">9. Cookies</h2>
            <p>
              Hiventra uses session cookies to maintain authentication state (managed by Supabase SSR). We do not use tracking or advertising cookies. You can disable cookies in your browser settings, but this may affect Platform functionality.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">10. Children's Privacy</h2>
            <p>
              Hiventra is not intended for use by individuals under the age of 18. We do not knowingly collect personal data from minors.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy periodically. We will notify users of significant changes via email or in-platform notice. Continued use after changes are posted constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">12. Contact</h2>
            <p>
              For privacy-related questions or requests, contact us at{" "}
              <span className="text-indigo-400">support@hiventra.live</span>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
