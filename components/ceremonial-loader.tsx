"use client";

import React, { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

interface CeremonialLoaderProps {
  isOpen: boolean;
  title?: string;
  subtitle?: string;
  onComplete?: () => void;
}

const CEREMONIAL_STEPS = [
  "✦ 感应三元九运气场...",
  "✦ 调取五行八字干支大盘...",
  "✦ 凝聚 AI 命理演算图谱...",
  "✦ 显化吉凶趋避天机指南..."
];

export function CeremonialLoader({
  isOpen,
  title = "正在天人感应推演...",
  subtitle = "请静心片刻，AI 命理大师正在为您求卜气场",
  onComplete
}: CeremonialLoaderProps) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setStepIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % CEREMONIAL_STEPS.length);
    }, 600);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050607]/85 p-4 backdrop-blur-2xl animate-in fade-in duration-300">
      {/* Outer ambient glow */}
      <div className="pointer-events-none absolute size-96 rounded-full bg-[#04c9db]/10 blur-[100px]" />
      <div className="pointer-events-none absolute size-96 rounded-full bg-[#C79A54]/15 blur-[120px]" />

      <div className="relative flex max-w-sm flex-col items-center text-center">
        {/* Animated Sacred Hexagram Ring & Center Emblem */}
        <div className="relative mb-8 grid size-44 place-items-center">
          {/* Outer Gold Rotating Bagua Ring */}
          <div className="absolute inset-0 rounded-full border border-[#C79A54]/40 border-t-[#E8D4A8] border-r-[#C79A54] animate-[spin_8s_linear_infinite] shadow-[0_0_30px_rgba(199,154,84,0.2)]" />

          {/* Inner Cyan Rotating Aura Ring */}
          <div className="absolute inset-3 rounded-full border border-[#04c9db]/30 border-b-[#04c9db] border-l-[#04c9db]/60 animate-[spin_5s_linear_infinite_reverse] shadow-[0_0_20px_rgba(4,201,219,0.3)]" />

          {/* Glowing Center Emblem */}
          <div className="relative grid size-24 place-items-center rounded-full border-2 border-[#C79A54]/60 bg-gradient-to-br from-[#13171A] via-[#0D1012] to-[#050607] shadow-[0_0_35px_rgba(199,154,84,0.4)]">
            <span className="font-serif text-4xl font-bold gold-gradient-text animate-pulse">
              风
            </span>
            <span className="absolute -bottom-1 size-3.5 rounded-full border-2 border-[#050607] bg-[#04c9db] shadow-[0_0_12px_#04c9db] animate-ping" />
          </div>

          {/* Floating Sparkle Accents */}
          <Sparkles className="absolute -left-2 top-4 size-5 text-[#04c9db] animate-bounce" />
          <Sparkles className="absolute -right-2 bottom-6 size-5 text-[#E8D4A8] animate-pulse" />
        </div>

        {/* Ceremonial Text */}
        <h3 className="font-serif text-xl font-bold text-white tracking-wide">{title}</h3>
        <p className="mt-1.5 text-xs text-white/60 leading-5">{subtitle}</p>

        {/* Pulsing Step Indicator */}
        <div className="mt-6 rounded-full border border-[#04c9db]/30 bg-[#04c9db]/10 px-4 py-2 text-xs font-bold text-[#04c9db] shadow-[0_0_15px_rgba(4,201,219,0.2)] transition-all duration-300">
          {CEREMONIAL_STEPS[stepIndex]}
        </div>
      </div>
    </div>
  );
}
