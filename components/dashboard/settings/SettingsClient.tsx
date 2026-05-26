"use client";

import { useState, useTransition } from "react";
import {
  Users,
  Bot,
  SlidersHorizontal,
  Save,
  Plus,
  X,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  UserX,
  UserCheck,
} from "lucide-react";
import {
  saveCarlDefaults,
  saveScoringThresholds,
  inviteUser,
  updateUserRole,
  setUserStatus,
} from "@/app/actions/settings";
import type {
  CarlDefaults,
  ScoringThresholds,
  UserRow,
} from "@/app/actions/settings";

// ── Constants ────────────────────────────────────────────────────────────────

const TABS = [
  { id: "users", label: "Users & Roles", icon: Users },
  { id: "carl", label: "Carl Defaults", icon: Bot },
  { id: "scoring", label: "Scoring", icon: SlidersHorizontal },
] as const;

type TabId = (typeof TABS)[number]["id"];

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  hr_manager: "HR or Interviewer",
  interviewer: "HR or Interviewer",
  hiring_manager: "Hiring Manager",
  dept_head: "Department Head",
  candidate: "Candidate",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-violet-100 text-violet-700",
  hr_manager: "bg-indigo-100 text-indigo-700",
  interviewer: "bg-indigo-100 text-indigo-700",
  hiring_manager: "bg-blue-100 text-blue-700",
  dept_head: "bg-teal-100 text-teal-700",
  candidate: "bg-slate-100 text-slate-600",
};

const PERSONALITY_OPTIONS = [
  { id: "friendly", label: "Friendly", desc: "Warm, encouraging tone" },
  { id: "professional", label: "Professional", desc: "Balanced, business-focused" },
  { id: "strict", label: "Strict", desc: "Direct, no-nonsense evaluation" },
  { id: "executive", label: "Executive", desc: "Senior-level strategic focus" },
  { id: "technical", label: "Technical Deep Dive", desc: "In-depth technical questions" },
];

// ── Toast ────────────────────────────────────────────────────────────────────

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div
      className={`flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl border ${
        ok
          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
          : "bg-red-50 border-red-200 text-red-700"
      }`}
    >
      {ok ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
      {msg}
    </div>
  );
}

// ── Threshold bar ─────────────────────────────────────────────────────────────

function ThresholdBar({
  stronglyMin,
  recommendMin,
  reviewMin,
}: {
  stronglyMin: number;
  recommendMin: number;
  reviewMin: number;
}) {
  const bands = [
    { from: 0, to: reviewMin, color: "bg-red-400", label: "Not Recommended" },
    { from: reviewMin, to: recommendMin, color: "bg-amber-400", label: "Review Further" },
    { from: recommendMin, to: stronglyMin, color: "bg-green-400", label: "Recommend" },
    { from: stronglyMin, to: 100, color: "bg-emerald-500", label: "Highly Recommended" },
  ];

  return (
    <div className="space-y-2">
      <div className="flex h-6 rounded-lg overflow-hidden">
        {bands.map((b) => (
          <div
            key={b.label}
            className={`${b.color} transition-all`}
            style={{ width: `${b.to - b.from}%` }}
            title={`${b.label}: ${b.from}–${b.to}`}
          />
        ))}
      </div>
      <div className="flex gap-3 flex-wrap">
        {bands.map((b) => (
          <div key={b.label} className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className={`w-3 h-3 rounded-sm ${b.color}`} />
            {b.label} ({b.from}–{b.to})
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Props ────────────────────────────────────────────────────────────────────

interface Props {
  carlDefaults: CarlDefaults | null;
  thresholds: ScoringThresholds | null;
  users: UserRow[];
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function SettingsClient({
  carlDefaults,
  thresholds,
  users: initialUsers,
}: Props) {
  const [tab, setTab] = useState<TabId>("users");
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-0 min-h-0 flex-1">
      {/* ── Left sub-nav ──────────────────────────────────────────────────── */}
      <nav className="w-full sm:w-52 shrink-0 bg-white border-b sm:border-b-0 sm:border-r border-slate-200 py-3 sm:py-4 flex sm:flex-col flex-row flex-wrap gap-1 space-y-0 sm:space-y-0.5 px-2">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
              tab === id
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </button>
        ))}
      </nav>

      {/* ── Content area ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-brand-bg p-4 sm:p-6">
        {toast && (
          <div className="mb-4">
            <Toast msg={toast.msg} ok={toast.ok} />
          </div>
        )}

        {tab === "users" && (
          <UsersTab users={initialUsers} onSave={showToast} />
        )}
        {tab === "carl" && (
          <CarlTab defaults={carlDefaults} onSave={showToast} />
        )}
        {tab === "scoring" && (
          <ScoringTab thresholds={thresholds} onSave={showToast} />
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// TAB — Users & Roles
// ──────────────────────────────────────────────────────────────────────────────

function UsersTab({
  users: initialUsers,
  onSave,
}: {
  users: UserRow[];
  onSave: (msg: string, ok: boolean) => void;
}) {
  const [users, setUsers] = useState(initialUsers);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("hr_manager");
  const [saving, startSave] = useTransition();

  const handleInvite = () => {
    startSave(async () => {
      const result = await inviteUser(inviteEmail, inviteRole);
      if (result.error) {
        onSave(result.error, false);
      } else {
        onSave(`Invite sent to ${inviteEmail}.`, true);
        setShowInvite(false);
        setInviteEmail("");
      }
    });
  };

  const handleRoleChange = (userId: string, role: string) => {
    startSave(async () => {
      const result = await updateUserRole(userId, role);
      if (!result.error) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
        onSave("Role updated.", true);
      } else {
        onSave(result.error, false);
      }
    });
  };

  const handleStatusToggle = (userId: string, current: string) => {
    const next = current === "active" ? "deactivated" : "active";
    startSave(async () => {
      const result = await setUserStatus(userId, next as "active" | "deactivated");
      if (!result.error) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: next } : u)));
        onSave(`User ${next === "active" ? "reactivated" : "deactivated"}.`, true);
      } else {
        onSave(result.error, false);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SectionHeader title="Users & Roles" desc="Manage team members and their access levels." />
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 text-sm font-medium bg-indigo-600 text-white rounded-xl px-4 py-2 hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Invite User
        </button>
      </div>

      {/* Invite modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">Invite Team Member</h3>
              <button onClick={() => setShowInvite(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <Field label="Email Address">
                <input
                  type="email"
                  className="input"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                />
              </Field>
              <Field label="Role">
                <select
                  className="input"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                >
                  {Object.entries(ROLE_LABELS)
                    .filter(([k]) => k !== "candidate" && k !== "interviewer")
                    .map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                </select>
              </Field>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowInvite(false)}
                  className="flex-1 text-sm text-slate-600 border border-slate-200 rounded-xl py-2 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInvite}
                  disabled={!inviteEmail.trim() || saving}
                  className="flex-1 text-sm font-medium bg-indigo-600 text-white rounded-xl py-2 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  Send Invite
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {users.map((u) => (
          <div key={u.id} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {u.full_name ?? <span className="text-slate-400 italic">—</span>}
                </p>
                <p className="text-xs text-slate-500 truncate mt-0.5">{u.email}</p>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${u.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                {u.status === "active" ? "Active" : "Deactivated"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="relative inline-block">
                <select
                  className={`text-xs font-semibold rounded-full pl-2.5 pr-6 py-1 border-0 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-300 ${ROLE_COLORS[u.role] ?? "bg-slate-100 text-slate-600"}`}
                  value={u.role}
                  onChange={(e) => handleRoleChange(u.id, e.target.value)}
                >
                  {Object.entries(ROLE_LABELS)
                    .filter(([k]) => k !== "candidate" && k !== "interviewer")
                    .map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none text-current opacity-60" />
              </div>
              <button
                onClick={() => handleStatusToggle(u.id, u.status)}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
              >
                {u.status === "active" ? <><UserX className="w-3.5 h-3.5" /> Deactivate</> : <><UserCheck className="w-3.5 h-3.5" /> Reactivate</>}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <Card noPad>
        <div className="hidden sm:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="bg-slate-50 text-xs text-slate-500 font-medium uppercase tracking-wide border-b border-slate-100">
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Last Login</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                    {u.full_name ?? <span className="text-slate-400 italic">—</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs whitespace-nowrap">{u.email}</td>
                  <td className="px-4 py-3">
                    <div className="relative inline-block">
                      <select
                        className={`text-xs font-semibold rounded-full pl-2.5 pr-6 py-1 border-0 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-300 ${ROLE_COLORS[u.role] ?? "bg-slate-100 text-slate-600"}`}
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      >
                        {Object.entries(ROLE_LABELS)
                          .filter(([k]) => k !== "candidate" && k !== "interviewer")
                          .map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                      <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none text-current opacity-60" />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${u.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {u.status === "active" ? "Active" : "Deactivated"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                    {u.last_login_at
                      ? new Date(u.last_login_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                      : <span className="text-slate-300">Never</span>}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleStatusToggle(u.id, u.status)}
                      className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors whitespace-nowrap"
                    >
                      {u.status === "active" ? <><UserX className="w-3.5 h-3.5" /> Deactivate</> : <><UserCheck className="w-3.5 h-3.5" /> Reactivate</>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// TAB — Carl Defaults
// ──────────────────────────────────────────────────────────────────────────────

function CarlTab({
  defaults,
  onSave,
}: {
  defaults: CarlDefaults | null;
  onSave: (msg: string, ok: boolean) => void;
}) {
  const [personality, setPersonality] = useState(defaults?.personality ?? "professional");
  const [mode, setMode] = useState(defaults?.mode ?? "text");
  const [duration, setDuration] = useState(defaults?.duration ?? 30);
  const [maxQ, setMaxQ] = useState(defaults?.max_questions ?? 10);
  const [saving, startSave] = useTransition();

  const handleSave = () => {
    startSave(async () => {
      const result = await saveCarlDefaults({ personality, mode, duration, max_questions: maxQ });
      onSave(result.error ?? "Carl defaults saved.", !result.error);
    });
  };

  return (
    <div className="max-w-2xl space-y-6">
      <SectionHeader title="Carl Defaults" desc="Default interview configuration for all new jobs." />

      <Card>
        <Field label="Default Personality">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PERSONALITY_OPTIONS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPersonality(p.id)}
                className={`text-left p-3 rounded-xl border-2 transition-all ${
                  personality === p.id
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <p className={`text-sm font-semibold ${personality === p.id ? "text-indigo-700" : "text-slate-800"}`}>
                  {p.label}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{p.desc}</p>
              </button>
            ))}
          </div>
        </Field>

        <Field label="Default Interview Mode">
          <SegmentedControl
            options={[
              { value: "text", label: "Text" },
              { value: "voice", label: "Voice" },
              { value: "video", label: "Video" },
            ]}
            value={mode}
            onChange={setMode}
          />
        </Field>

        <Field label="Default Duration">
          <SegmentedControl
            options={[15, 30, 45, 60].map((v) => ({ value: String(v), label: `${v} min` }))}
            value={String(duration)}
            onChange={(v) => setDuration(Number(v))}
          />
        </Field>

        <Field label="Default Max Questions">
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              max={30}
              className="input w-24"
              value={maxQ}
              onChange={(e) => setMaxQ(Number(e.target.value))}
            />
            <span className="text-xs text-slate-500">questions per interview</span>
          </div>
        </Field>

        <p className="text-xs text-slate-400 italic -mt-2">
          These defaults apply to all new jobs unless overridden per job.
        </p>

        <SaveButton loading={saving} onClick={handleSave} />
      </Card>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// TAB — Scoring Thresholds
// ──────────────────────────────────────────────────────────────────────────────

function ScoringTab({
  thresholds,
  onSave,
}: {
  thresholds: ScoringThresholds | null;
  onSave: (msg: string, ok: boolean) => void;
}) {
  const [stronglyMin, setStronglyMin] = useState(thresholds?.strongly_recommend_min ?? 85);
  const [recommendMin, setRecommendMin] = useState(thresholds?.recommend_min ?? 70);
  const [reviewMin, setReviewMin] = useState(thresholds?.review_further_min ?? 50);
  const [saving, startSave] = useTransition();

  const clampStrongly = (v: number) => Math.min(100, Math.max(recommendMin + 1, v));
  const clampRecommend = (v: number) => Math.min(stronglyMin - 1, Math.max(reviewMin + 1, v));
  const clampReview = (v: number) => Math.min(recommendMin - 1, Math.max(1, v));

  const handleSave = () => {
    startSave(async () => {
      const result = await saveScoringThresholds({
        strongly_recommend_min: stronglyMin,
        recommend_min: recommendMin,
        review_further_min: reviewMin,
      });
      onSave(result.error ?? "Scoring thresholds saved.", !result.error);
    });
  };

  const thresholdRows = [
    {
      label: "Highly Recommended",
      color: "bg-emerald-500",
      range: `${stronglyMin} – 100`,
      value: stronglyMin,
      onChange: (v: number) => setStronglyMin(clampStrongly(v)),
      min: recommendMin + 1,
      max: 100,
    },
    {
      label: "Recommended",
      color: "bg-green-400",
      range: `${recommendMin} – ${stronglyMin - 1}`,
      value: recommendMin,
      onChange: (v: number) => setRecommendMin(clampRecommend(v)),
      min: reviewMin + 1,
      max: stronglyMin - 1,
    },
    {
      label: "Review Further",
      color: "bg-amber-400",
      range: `${reviewMin} – ${recommendMin - 1}`,
      value: reviewMin,
      onChange: (v: number) => setReviewMin(clampReview(v)),
      min: 1,
      max: recommendMin - 1,
    },
    {
      label: "Not Recommended",
      color: "bg-red-400",
      range: `0 – ${reviewMin - 1}`,
      value: null,
      onChange: null,
      min: 0,
      max: 0,
    },
  ];

  return (
    <div className="max-w-2xl space-y-6">
      <SectionHeader title="Scoring Thresholds" desc="Set the score ranges for each recommendation level." />

      <Card>
        <ThresholdBar stronglyMin={stronglyMin} recommendMin={recommendMin} reviewMin={reviewMin} />

        <div className="space-y-5 mt-4">
          {thresholdRows.map((row) => (
            <div key={row.label} className="flex items-center gap-4">
              <div className={`w-3 h-3 rounded-sm shrink-0 ${row.color}`} />
              <div className="w-40 shrink-0">
                <p className="text-sm font-medium text-slate-700">{row.label}</p>
                <p className="text-xs text-slate-400">{row.range}</p>
              </div>
              {row.onChange && row.value !== null ? (
                <div className="flex-1 flex items-center gap-3">
                  <input
                    type="range"
                    min={row.min}
                    max={row.max}
                    value={row.value}
                    onChange={(e) => row.onChange!(Number(e.target.value))}
                    className="flex-1 accent-indigo-600"
                  />
                  <span className="text-sm font-semibold text-slate-800 w-8 text-right">
                    {row.value}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-slate-400 italic">Below Review Further threshold</span>
              )}
            </div>
          ))}
        </div>

        <SaveButton loading={saving} onClick={handleSave} />
      </Card>
    </div>
  );
}

// ── Shared primitives ─────────────────────────────────────────────────────────

function SectionHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      <p className="text-sm text-slate-500 mt-0.5">{desc}</p>
    </div>
  );
}

function Card({ children, noPad }: { children: React.ReactNode; noPad?: boolean }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 ${noPad ? "" : "p-5"} space-y-5`}>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}

function SaveButton({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <div className="pt-1">
      <button
        onClick={onClick}
        disabled={loading}
        className="flex items-center gap-2 text-sm font-medium bg-indigo-600 text-white rounded-xl px-5 py-2.5 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        <Save className="w-4 h-4" />
        {loading ? "Saving…" : "Save Changes"}
      </button>
    </div>
  );
}

function SegmentedControl({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="inline-flex rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            value === opt.value
              ? "bg-indigo-600 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
