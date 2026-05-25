"use client";

import { useActionState } from "react";
import { changePassword } from "@/app/actions/portal";
import { User, Mail, AtSign, Eye, EyeOff, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useState } from "react";

interface Props {
  fullName: string;
  email: string;
  username: string | null;
  mustChangePassword: boolean;
}

export default function ProfileClient({
  fullName,
  email,
  username,
  mustChangePassword,
}: Props) {
  const [state, action, pending] = useActionState(changePassword, null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="space-y-6">
      {/* Account info */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-5">
          Account Information
        </h2>
        <div className="space-y-1">
          <InfoRow icon={<User className="w-4 h-4 text-indigo-500" />} label="Full Name" value={fullName} />
          <InfoRow icon={<Mail className="w-4 h-4 text-indigo-500" />} label="Email" value={email} />
          {username && (
            <InfoRow
              icon={<AtSign className="w-4 h-4 text-indigo-500" />}
              label="Username"
              value={username}
              mono
            />
          )}
        </div>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
            Change Password
          </h2>
          {mustChangePassword && !state?.success && (
            <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200 rounded-full px-2 py-0.5 font-medium">
              Required
            </span>
          )}
        </div>
        {mustChangePassword && !state?.success && (
          <p className="text-sm text-amber-600 mb-4">
            You&apos;re using a temporary password. Please change it now.
          </p>
        )}

        <form action={action} className="mt-4 space-y-4">
          <PasswordField
            id="new_password"
            name="new_password"
            label="New Password"
            show={showNew}
            onToggle={() => setShowNew((v) => !v)}
          />
          <PasswordField
            id="confirm_password"
            name="confirm_password"
            label="Confirm New Password"
            show={showConfirm}
            onToggle={() => setShowConfirm((v) => !v)}
          />

          {state?.error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {state.error}
            </div>
          )}
          {state?.success && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
              <CheckCircle className="w-4 h-4 shrink-0" />
              Password changed successfully.
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            {pending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Updating…
              </>
            ) : (
              "Update Password"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-400 font-medium">{label}</p>
        <p className={`text-sm text-slate-800 font-medium ${mono ? "font-mono" : ""}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

function PasswordField({
  id,
  name,
  label,
  show,
  onToggle,
}: {
  id: string;
  name: string;
  label: string;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={show ? "text" : "password"}
          required
          minLength={8}
          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 pr-11 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          tabIndex={-1}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
