"use client";

import React from "react";
import Image from "next/image";
import { ShieldCheck, BookOpen } from "lucide-react";

export function Header({
  onOpenHistory,
  historyCount = 0,
}: {
  onOpenHistory?: () => void;
  historyCount?: number;
}) {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/85 border-b border-slate-200/80 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 sm:h-18">
          {/* DeepCheck Brand & Info */}
          <div className="flex items-center space-x-2.5 sm:space-x-3.5">
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white border border-blue-100 shadow-sm shadow-blue-500/10 flex items-center justify-center p-0.5 shrink-0 overflow-hidden">
              <Image
                src="/logo-icon.png"
                alt="DeepCheck AI Logo"
                width={40}
                height={40}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div>
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <span className="font-extrabold text-base sm:text-xl text-slate-900 tracking-tight">
                  DeepCheck <span className="text-blue-600">AI</span>
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  PTIK Kelompok 4
                </span>
              </div>
              <span className="sm:hidden text-[10px] text-slate-400 font-medium block">PTIK Kelompok 4</span>
            </div>
          </div>

          {/* Right Quick Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={onOpenHistory}
              type="button"
              className="inline-flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-xs transition-colors cursor-pointer"
              title="Riwayat Pemeriksaan"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
              <span>Riwayat<span className="hidden sm:inline"> Verifikasi</span></span>
              {historyCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] sm:text-[11px] bg-blue-600 text-white font-bold">
                  {historyCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
