"use client";

import { useEffect, useState } from "react";

export default function PreLoader() {
  const [fading, setFading] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFading(true), 1800);
    const t2 = setTimeout(() => setHidden(true), 2600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (hidden) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-slate-900 flex flex-col items-center justify-center"
      style={{ opacity: fading ? 0 : 1, transition: "opacity 0.8s ease", pointerEvents: fading ? "none" : "all" }}
    >
      {/* Animated rings + logo */}
      <div className="relative flex items-center justify-center mb-8">
        <div
          className="absolute rounded-full bg-indigo-600/15 animate-ping"
          style={{ width: 108, height: 108, animationDuration: "1.6s" }}
        />
        <div
          className="absolute rounded-full bg-violet-600/10 animate-ping"
          style={{ width: 88, height: 88, animationDuration: "1.6s", animationDelay: "0.35s" }}
        />
        <div
          className="relative w-[68px] h-[68px] rounded-2xl flex items-center justify-center animate-pulse"
          style={{
            background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
            boxShadow: "0 0 50px rgba(79,70,229,0.7), 0 0 20px rgba(124,58,237,0.5)",
            animationDuration: "2s",
          }}
        >
          <span className="text-white text-3xl font-extrabold select-none">H</span>
        </div>
      </div>

      {/* Brand text */}
      <h1
        className="text-white text-2xl font-extrabold tracking-tight mb-1"
        style={{ animation: "preloader-fade-in 0.6s ease 0.2s both" }}
      >
        Hiventra
      </h1>
      <p
        className="text-indigo-400 text-xs font-semibold tracking-widest uppercase mb-10"
        style={{ animation: "preloader-fade-in 0.6s ease 0.4s both" }}
      >
        AI Talent Intelligence Platform
      </p>

      {/* Loading bar */}
      <div
        className="w-44 h-[2px] bg-slate-700/60 rounded-full overflow-hidden"
        style={{ animation: "preloader-fade-in 0.6s ease 0.3s both" }}
      >
        <div
          className="h-full rounded-full"
          style={{
            background: "linear-gradient(90deg, #4f46e5, #7c3aed)",
            animation: "preloader-bar 1.8s cubic-bezier(0.4, 0, 0.2, 1) forwards",
          }}
        />
      </div>
    </div>
  );
}
