import Link from "next/link";

export const metadata = { title: "Terms of Service — Hiventra" };

export default function TermsPage() {
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
        <h1 className="text-3xl font-extrabold text-white mb-2">Terms of Service</h1>
        <p className="text-slate-500 text-sm mb-10">Effective date: January 1, 2026</p>

        <div className="space-y-10 text-sm leading-relaxed">

          <section>
            <h2 className="text-white font-bold text-base mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Hiventra ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Platform. These terms apply to all users, including recruiters, hiring managers, and candidates.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">2. Description of Service</h2>
            <p>
              Hiventra is an AI-powered talent intelligence platform that automates resume screening, conducts AI-assisted interviews via Carl, and generates candidate intelligence reports. The Platform is intended for use by HR professionals and the candidates they evaluate.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">3. User Accounts</h2>
            <p className="mb-3">
              Recruiter accounts are created via Google OAuth. Candidate accounts are provisioned by HR administrators and accessed via username and password credentials sent by email.
            </p>
            <p>
              You are responsible for maintaining the confidentiality of your credentials and for all activity that occurs under your account. You must notify us immediately of any unauthorized use.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">4. AI-Generated Content</h2>
            <p className="mb-3">
              Hiventra uses AI models (including Anthropic Claude and OpenAI Whisper) to score resumes, conduct interviews, and generate candidate reports. AI-generated scores, recommendations, and summaries are advisory only and should not be the sole basis for hiring decisions.
            </p>
            <p>
              Users are responsible for reviewing AI outputs and applying their own judgment. Hiventra does not guarantee the accuracy or completeness of AI-generated assessments.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">5. Acceptable Use</h2>
            <p className="mb-3">You agree not to:</p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400">
              <li>Use the Platform for any unlawful purpose or in violation of applicable employment laws</li>
              <li>Discriminate against candidates based on protected characteristics</li>
              <li>Attempt to reverse-engineer, scrape, or bypass any security feature</li>
              <li>Upload malicious files or attempt to compromise the Platform's infrastructure</li>
              <li>Share candidate data with unauthorized third parties</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">6. Data Ownership</h2>
            <p>
              You retain ownership of all candidate data, resumes, and interview recordings you upload to the Platform. By uploading data, you grant Hiventra a limited license to process that data solely to provide the services described herein. We do not sell or share your data with third parties for marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">7. Intellectual Property</h2>
            <p>
              All software, design, and content of the Hiventra Platform — including Carl AI — is the intellectual property of Hiventra, Inc. You may not copy, reproduce, or create derivative works without written permission.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">8. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, Hiventra shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Platform, including but not limited to hiring decisions made based on AI recommendations.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">9. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account at any time for violation of these Terms or for any other reason at our sole discretion, with or without notice.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">10. Changes to Terms</h2>
            <p>
              We may update these Terms at any time. Continued use of the Platform after changes are posted constitutes acceptance of the revised Terms. We will notify users of material changes via email or in-platform notice.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">11. Governing Law</h2>
            <p>
              These Terms are governed by the laws of the applicable jurisdiction. Any disputes shall be resolved through binding arbitration or in courts of competent jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-3">12. Contact</h2>
            <p>
              For questions about these Terms, contact us at{" "}
              <span className="text-indigo-400">support@hiventra.live</span>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
