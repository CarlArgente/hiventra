"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface MobileNavContextValue {
  mobileOpen: boolean;
  openMobileNav: () => void;
  closeMobileNav: () => void;
}

const MobileNavContext = createContext<MobileNavContextValue>({
  mobileOpen: false,
  openMobileNav: () => {},
  closeMobileNav: () => {},
});

export function useMobileNav() {
  return useContext(MobileNavContext);
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const openMobileNav = useCallback(() => setMobileOpen(true), []);
  const closeMobileNav = useCallback(() => setMobileOpen(false), []);

  return (
    <MobileNavContext.Provider value={{ mobileOpen, openMobileNav, closeMobileNav }}>
      {children}
    </MobileNavContext.Provider>
  );
}
