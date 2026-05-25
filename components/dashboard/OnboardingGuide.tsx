"use client";

import { useState, useEffect } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Briefcase,
  Upload,
  Users,
  Bot,
  BarChart2,
  Shield,
  Users2,
  MessageCircle,
  Settings,
  CheckCircle2,
} from "lucide-react";
import { useOnboarding } from "./DashboardShell";

const STORAGE_KEY = "hiventra_onboarding_v1_done";
const CARD_W = 320;
const CARD_H = 310;

const STEPS: { navHref: string | null; icon: React.ReactNode; title: string; description: string }[] = [
  {
    navHref: null,
    icon: (
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
        <span className="text-white font-extrabold text-base">H</span>
      </div>
    ),
    title: "Welcome to Hiventra",
    description: "Your AI-powered talent intelligence platform. Let's take a quick tour so you can hit the ground running.",
  },
  {
    navHref: "/dashboard",
    icon: <LayoutDashboard className="w-5 h-5 text-indigo-500" />,
    title: "Dashboard",
    description: "Your command center. See active jobs, pipeline health, recent activity, and key hiring metrics — all at a glance.",
  },
  {
    navHref: "/jobs",
    icon: <Briefcase className="w-5 h-5 text-indigo-500" />,
    title: "Job Management",
    description: "Create and manage job postings. Each job has its own candidate pool, AI configuration, and pipeline stages.",
  },
  {
    navHref: "/upload",
    icon: <Upload className="w-5 h-5 text-indigo-500" />,
    title: "Resume Upload",
    description: "Upload resumes in bulk — PDF or DOCX. Carl AI scores and ranks each candidate automatically within seconds.",
  },
  {
    navHref: "/pipeline",
    icon: <Users className="w-5 h-5 text-indigo-500" />,
    title: "Candidate Pipeline",
    description: "Track every candidate through hiring stages with a visual kanban board or list view. Drag to advance stages.",
  },
  {
    navHref: "/carl-config",
    icon: <Bot className="w-5 h-5 text-indigo-500" />,
    title: "Carl Config",
    description: "Configure Carl, your AI interviewer — set his personality, interview topics, question count, and duration per job.",
  },
  {
    navHref: "/talk-with-carl",
    icon: <MessageCircle className="w-5 h-5 text-indigo-500" />,
    title: "Talk with Carl",
    description: "Chat directly with Carl AI to ask hiring questions, get candidate insights, or brainstorm interview strategies.",
  },
  {
    navHref: "/collaboration",
    icon: <Users2 className="w-5 h-5 text-indigo-500" />,
    title: "Collaboration",
    description: "Invite teammates and leave notes on candidates. Share assessments and align your team before making decisions.",
  },
  {
    navHref: "/analytics",
    icon: <BarChart2 className="w-5 h-5 text-indigo-500" />,
    title: "Analytics",
    description: "Monitor hiring velocity, pass rates, interview completion, and pipeline conversion — updated in real time.",
  },
  {
    navHref: "/audit",
    icon: <Shield className="w-5 h-5 text-indigo-500" />,
    title: "AI Audit",
    description: "Every AI decision is logged here. Full transparency on how Carl scored and ranked each candidate.",
  },
  {
    navHref: "/settings",
    icon: <Settings className="w-5 h-5 text-indigo-500" />,
    title: "Settings",
    description: "Manage your account, team members, notification preferences, and platform configuration.",
  },
  {
    navHref: null,
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    title: "You're all set!",
    description: "Start by creating your first job posting. Once candidates are uploaded, Carl takes it from there.",
  },
];

function getCardPosition(href: string | null): { top: number; left: number; anchored: boolean; arrowY: number } {
  const centered = {
    top: window.innerHeight / 2 - CARD_H / 2,
    left: window.innerWidth / 2 - CARD_W / 2,
    anchored: false,
    arrowY: CARD_H / 2,
  };

  if (!href) return centered;

  const el = document.querySelector<HTMLElement>(`[data-onboarding="${href}"]`);
  if (!el) return centered;

  const rect = el.getBoundingClientRect();
  const GAP = 20;
  const navCenterY = rect.top + rect.height / 2;

  let top = navCenterY - CARD_H / 2;
  top = Math.max(16, Math.min(top, window.innerHeight - CARD_H - 16));

  // Arrow Y = nav item center relative to where the card actually ended up
  const arrowY = navCenterY - top;

  const left = rect.right + GAP;

  return { top, left, anchored: true, arrowY };
}

export default function OnboardingGuide() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [pos, setPos] = useState<{ top: number; left: number; anchored: boolean; arrowY: number } | null>(null);
  const { setOnboardingHighlight } = useOnboarding();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  useEffect(() => {
    if (!visible) {
      setOnboardingHighlight(null);
      return;
    }
    const href = STEPS[step].navHref;
    setOnboardingHighlight(href);

    requestAnimationFrame(() => {
      setPos(getCardPosition(href));
    });
  }, [visible, step, setOnboardingHighlight]);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setOnboardingHighlight(null);
    setVisible(false);
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else dismiss();
  };

  const back = () => setStep((s) => Math.max(0, s - 1));

  if (!visible || !pos) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <>
      {/* Blocking overlay — prevents any click on the app while guide is open */}
      <div className="fixed inset-0 z-40 bg-black/50" />

      {/* Guide card */}
      <div
        style={{
          top: pos.top,
          left: pos.left,
          width: CARD_W,
          transition: "top 0.35s cubic-bezier(0.4,0,0.2,1), left 0.35s cubic-bezier(0.4,0,0.2,1)",
        }}
        className="fixed z-50 rounded-2xl shadow-2xl border border-white/10 bg-white"
      >
        {/* Left-pointing arrow aligned to the highlighted nav item */}
        {pos.anchored && (
          <div
            style={{
              position: "absolute",
              top: pos.arrowY - 9,
              left: -9,
              width: 0,
              height: 0,
              borderTop: "9px solid transparent",
              borderBottom: "9px solid transparent",
              borderRight: "9px solid #4f46e5",
            }}
          />
        )}

        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 flex items-center gap-3 rounded-t-2xl">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-extrabold text-sm">H</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm leading-tight">Carl</p>
            <p className="text-white/70 text-xs">Your onboarding guide</p>
          </div>
          <button onClick={dismiss} className="text-white/60 hover:text-white transition-colors" aria-label="Dismiss">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
              {current.icon}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 text-sm leading-tight mb-1">{current.title}</h3>
              <p className="text-slate-500 text-xs leading-relaxed">{current.description}</p>
            </div>
          </div>

          {/* Progress dots */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1 flex-1">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    i === step ? "bg-indigo-600 w-5" : i < step ? "bg-indigo-300 w-1.5" : "bg-slate-200 w-1.5"
                  }`}
                  aria-label={`Step ${i + 1}`}
                />
              ))}
            </div>
            <span className="text-slate-400 text-xs font-medium flex-shrink-0">{step + 1}/{STEPS.length}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={back}
              disabled={step === 0}
              className="flex items-center gap-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-medium px-3 py-2 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Back
            </button>
            <button
              onClick={next}
              className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-4 rounded-lg transition-colors ${
                isLast ? "bg-emerald-500 hover:bg-emerald-400 text-white" : "bg-indigo-600 hover:bg-indigo-500 text-white"
              }`}
            >
              {isLast ? "Get Started" : <>Next <ChevronRight className="w-3.5 h-3.5" /></>}
            </button>
          </div>

          <button onClick={dismiss} className="w-full text-center text-slate-400 hover:text-slate-600 text-xs mt-2 py-1 transition-colors">
            Skip tour
          </button>
        </div>
      </div>
    </>
  );
}
