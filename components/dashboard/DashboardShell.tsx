"use client";

import { createContext, useContext, useState, useCallback } from "react";
import OnboardingGuide from "./OnboardingGuide";

interface MobileNavContextValue {
  mobileOpen: boolean;
  openMobileNav: () => void;
  closeMobileNav: () => void;
}

interface OnboardingContextValue {
  onboardingHighlight: string | null;
  setOnboardingHighlight: (href: string | null) => void;
}

const MobileNavContext = createContext<MobileNavContextValue>({
  mobileOpen: false,
  openMobileNav: () => {},
  closeMobileNav: () => {},
});

const OnboardingContext = createContext<OnboardingContextValue>({
  onboardingHighlight: null,
  setOnboardingHighlight: () => {},
});

export function useMobileNav() {
  return useContext(MobileNavContext);
}

export function useOnboarding() {
  return useContext(OnboardingContext);
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const openMobileNav = useCallback(() => setMobileOpen(true), []);
  const closeMobileNav = useCallback(() => setMobileOpen(false), []);
  const [onboardingHighlight, setOnboardingHighlight] = useState<string | null>(null);

  return (
    <MobileNavContext.Provider value={{ mobileOpen, openMobileNav, closeMobileNav }}>
      <OnboardingContext.Provider value={{ onboardingHighlight, setOnboardingHighlight }}>
        {children}
        <OnboardingGuide />
      </OnboardingContext.Provider>
    </MobileNavContext.Provider>
  );
}
