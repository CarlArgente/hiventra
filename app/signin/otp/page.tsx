import { redirect } from "next/navigation";
import Link from "next/link";
import { OtpVerifyForm } from "@/components/auth/OtpVerifyForm";

export default async function OtpPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  if (!email) redirect("/signin");

  const decoded = decodeURIComponent(email);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <img src="/hiventra_icon.png" alt="Hiventra" className="w-9 h-9 rounded-xl object-cover shadow-lg" />
          <span className="font-extrabold text-xl text-white tracking-tight">Hiventra</span>
        </div>

        {/* Heading */}
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-extrabold text-white mb-1">Check your email</h2>
          <p className="text-slate-400 text-sm">We sent a verification code to confirm it&apos;s you.</p>
        </div>

        <OtpVerifyForm email={decoded} />

        {/* Back */}
        <div className="mt-8 text-center">
          <Link href="/signin" className="text-slate-500 hover:text-slate-300 text-xs transition-colors">
            ← Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
