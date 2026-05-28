"use client";

import { useState, useTransition, useEffect } from "react";
import { sendOtp, verifyOtpToken } from "@/app/actions/auth";

export function OtpVerifyForm({ email }: { email: string }) {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const result = await sendOtp(email);
      if (result.error) setError(result.error);
      else setSent(true);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleResend() {
    setError("");
    setToken("");
    startTransition(async () => {
      const result = await sendOtp(email);
      if (result.error) setError(result.error);
      else setSent(true);
    });
  }

  function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await verifyOtpToken(email, token);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {!sent && !error && (
        <p className="text-slate-400 text-sm text-center">Sending code…</p>
      )}

      {sent && (
        <>
          <p className="text-slate-400 text-sm text-center">
            Code sent to <span className="text-white font-medium">{email}</span>
          </p>
          <form onSubmit={handleVerify} className="flex flex-col gap-3">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={8}
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
              placeholder="Verification code"
              autoFocus
              required
              className="w-full bg-slate-900 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3.5 text-sm text-center tracking-[0.4em] focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {error && <p className="text-red-400 text-xs text-center">{error}</p>}
            <button
              type="submit"
              disabled={isPending || token.length < 4}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-3.5 rounded-full transition-all duration-200 text-sm"
            >
              {isPending ? "Verifying…" : "Verify & Sign In"}
            </button>
          </form>
          <button
            type="button"
            onClick={handleResend}
            disabled={isPending}
            className="text-slate-500 hover:text-slate-300 text-xs text-center transition-colors disabled:opacity-50"
          >
            Resend code
          </button>
        </>
      )}

      {error && !sent && (
        <p className="text-red-400 text-xs text-center">{error}</p>
      )}
    </div>
  );
}
