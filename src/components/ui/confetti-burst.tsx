"use client";

import React, { useEffect, useRef } from "react";

interface ConfettiBurstProps {
  trigger: boolean;
  colors?: string[];
  count?: number;
}

const DEFAULT_COLORS = ["#2563eb", "#06b6d4", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444"];

/**
 * Small burst of confetti on the positive result (authenticity score >= 88%).
 * Renders absolutely-positioned pieces inside the parent container with breakout.
 */
export function ConfettiBurst({ trigger, colors = DEFAULT_COLORS, count = 28 }: ConfettiBurstProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!trigger || !containerRef.current) return;
    const container = containerRef.current;
    const pieces: HTMLDivElement[] = [];

    for (let i = 0; i < count; i++) {
      const piece = document.createElement("div");
      piece.className = "confetti-piece";
      piece.style.left = `${50 + (Math.random() - 0.5) * 80}%`;
      piece.style.top = `${Math.random() * 30}%`;
      piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDelay = `${Math.random() * 0.4}s`;
      piece.style.width = `${6 + Math.random() * 5}px`;
      piece.style.height = `${8 + Math.random() * 6}px`;
      piece.style.position = "absolute";
      piece.style.borderRadius = "2px";
      piece.style.animation = `confettiFall ${1.8 + Math.random() * 1.2}s ease-in forwards`;
      piece.style.animationDelay = `${Math.random() * 0.3}s`;
      container.appendChild(piece);
      pieces.push(piece);
    }

    const timer = setTimeout(() => {
      pieces.forEach((p) => p.remove());
    }, 3000);

    return () => {
      clearTimeout(timer);
      pieces.forEach((p) => p.remove());
    };
  }, [trigger, colors, count]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden z-50"
    />
  );
}
