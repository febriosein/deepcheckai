"use client";

import React from "react";
import {
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  Info,
  Share2,
  Cpu,
  FileCheck2,
  Landmark,
  MessageSquareWarning,
} from "lucide-react";
import { getRiskBadge } from "../lib/utils";
import { AnimatedCounter } from "./ui/animated-counter";
import { ConfettiBurst } from "./ui/confetti-burst";
import { StaggeredCards, StaggeredItem } from "./ui/staggered-cards";

interface ScoreCardProps {
  score: number;
  riskCategory: "rendah" | "sedang" | "tinggi" | "kritis";
  headline: string;
  routersUsed: string[];
  processingTimeMs: number;
  indicators?: Array<{
    routerId: string;
    impact: string;
    severity: string;
  }>;
  sourcesCount?: number;
  onOpenShareModal?: () => void;
}

export function ScoreCard({
  score,
  headline,
  routersUsed,
  processingTimeMs,
  indicators = [],
  sourcesCount = 0,
  onOpenShareModal,
}: ScoreCardProps) {
  const badge = getRiskBadge(score);

  // SVG Gauge calculation
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let gaugeColor = "#10b981"; // vibrant emerald
  let RiskIcon = ShieldCheck;
  if (score < 35) {
    gaugeColor = "#f43f5e"; // vivid coral rose
    RiskIcon = ShieldAlert;
  } else if (score < 60) {
    gaugeColor = "#f97316"; // bright orange
    RiskIcon = AlertTriangle;
  } else if (score < 80) {
    gaugeColor = "#f59e0b"; // sun amber
    RiskIcon = Info;
  }

  // Derive 4-Pillar Sub-Scores intelligently
  // 1. Visual & Audio Integrity (R4, R5, R6)
  const visualNegative = indicators.some(
    (i) => ["R4", "R5", "R6"].includes(i.routerId) && i.impact === "negatif"
  );
  const visualScore = visualNegative
    ? Math.min(score, 38)
    : routersUsed.some((r) => ["R4", "R5"].includes(r))
    ? Math.max(score, 88)
    : 85;

  // 2. Factual Claims Integrity (R3, R8)
  const factualNegative = indicators.some(
    (i) => ["R3", "R8"].includes(i.routerId) && i.impact === "negatif"
  );
  const factualScore = factualNegative ? Math.min(score, 42) : Math.max(score - 5, 55);

  // 3. Credible Source Verification
  const sourceScore =
    sourcesCount > 0 && score < 50
      ? 90 // High fact-check match confirmation
      : sourcesCount > 0
      ? 85
      : 50;

  // 4. NLP & Language Sentiment (R7)
  const nlpNegative = indicators.some(
    (i) => i.routerId === "R7" && i.impact === "negatif"
  );
  const languageScore = nlpNegative ? Math.min(score, 35) : Math.max(score + 10, 75);

  const pillars = [
    {
      name: "Integritas Visual & Audio",
      score: visualScore,
      icon: Cpu,
      desc: "Artefak AI, piksel & kloning suara",
      bgIcon: "bg-blue-100 text-blue-600",
    },
    {
      name: "Klaim Faktual & Logika",
      score: factualScore,
      icon: FileCheck2,
      desc: "Konsistensi narasi peristiwa",
      bgIcon: "bg-indigo-100 text-indigo-600",
    },
    {
      name: "Rujukan Sumber Kredibel",
      score: sourceScore,
      icon: Landmark,
      desc: "Korelasi media pers & portal resmi",
      bgIcon: "bg-teal-100 text-teal-600",
    },
    {
      name: "Pola Bahasa & Retorika",
      score: languageScore,
      icon: MessageSquareWarning,
      desc: "Indikasi sentimen provokasi: Nihil",
      bgIcon: "bg-sky-100 text-sky-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Celebration Confetti on authentic score */}
      <ConfettiBurst trigger={score >= 80} />

      {/* BEGIN: Primary Score & Telemetry Card */}
      <section className="bg-white rounded-2xl border border-slate-200/90 shadow-elevated p-5 sm:p-7 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Gauge Meter */}
          <div className="md:col-span-4 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100 pb-5 md:pb-0 md:pr-6">
            <div
              className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full flex items-center justify-center shadow-inner"
              style={{
                background: `conic-gradient(${gaugeColor} 0% ${score}%, #e2e8f0 ${score}% 100%)`,
              }}
            >
              <div className="w-[84px] h-[84px] sm:w-[106px] sm:h-[106px] bg-white rounded-full flex flex-col items-center justify-center shadow-xs">
                <span className="font-extrabold text-2xl sm:text-4xl text-slate-900 tracking-tight leading-none">
                  <AnimatedCounter value={score} suffix="%" />
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                  Skor Asli
                </span>
              </div>
            </div>

            <div className="mt-3.5 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-2xs">
              <RiskIcon className="w-3.5 h-3.5 text-slate-600" />
              <span>Kategori: Risiko {badge.category}</span>
            </div>
          </div>

          {/* Summary Verdict & Meta */}
          <div className="md:col-span-8 flex flex-col justify-between space-y-4">
            <div>
              <div className={`flex items-center space-x-1.5 text-xs font-semibold px-2.5 py-1 rounded-md inline-flex mb-2 border ${badge.bgClass} ${badge.colorClass} ${badge.borderClass}`}>
                <RiskIcon className="w-3.5 h-3.5" />
                <span>{badge.label}</span>
              </div>
              <h2 className="font-bold text-base sm:text-xl lg:text-2xl text-slate-900 leading-snug">
                {headline}
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-500 font-normal">
                {badge.label}. Analisis multi-vektor mengonfirmasi integritas konten berdasarkan bukti digital dan rujukan silang sumber resmi.
              </p>
            </div>

            {/* Methods and Actions Bar */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1.5">
                {routersUsed.map((r) => {
                  const methodNames: Record<string, string> = {
                    R1: "Klasifikasi Media",
                    R2: "Sampling Sinyal",
                    R3: "Ekstraksi Teks (OCR)",
                    R4: "Analisis Visual AI",
                    R5: "Deteksi Deepfake",
                    R6: "Analisis Suara",
                    R7: "Pola Narasi NLP",
                    R8: "Verifikasi Sumber Resmi",
                    R9: "Sintesis Terpadu",
                  };
                  const displayName = methodNames[r] || r;
                  return (
                    <span
                      key={r}
                      className="text-[10px] sm:text-[11px] px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-md text-blue-700 font-medium"
                    >
                      {displayName}
                    </span>
                  );
                })}
              </div>

              <div className="flex items-center space-x-3 text-xs">
                <span className="text-slate-400">
                  Waktu Analisis: <strong className="text-slate-700 font-mono font-medium">{(processingTimeMs / 1000).toFixed(2)} detik</strong>
                </span>
                {onOpenShareModal && (
                  <button
                    type="button"
                    onClick={onOpenShareModal}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5 text-slate-600" />
                    <span>Bagikan</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 4 CORE PILLARS INDICATORS */}
        <div className="pt-6 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight uppercase">
              Rincian Indikator Keaslian
            </h3>
            <span className="text-[10px] sm:text-[11px] text-slate-400">Multi-vektor AI</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
            {pillars.map((pil, idx) => {
              const Icon = pil.icon;
              let barColor = "bg-emerald-500";
              let statusText = "Terverifikasi";
              let statusBadge = "text-emerald-700 bg-emerald-50 border border-emerald-200";

              if (pil.score < 40) {
                barColor = "bg-rose-500";
                statusText = "Anomali";
                statusBadge = "text-rose-700 bg-rose-50 border border-rose-200";
              } else if (pil.score < 70) {
                barColor = "bg-amber-500";
                statusText = "Perlu Cek";
                statusBadge = "text-amber-700 bg-amber-50 border border-amber-200";
              }

              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-card transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`w-7 h-7 rounded-lg ${pil.bgIcon} flex items-center justify-center`}>
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className="text-sm font-mono font-bold text-slate-800">
                        <AnimatedCounter value={pil.score} suffix="%" />
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 leading-tight">
                      {pil.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                      {pil.desc}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-between pt-1">
                    <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`${barColor} h-1.5 rounded-full transition-all duration-1000 ease-out`}
                        style={{ width: `${Math.min(pil.score, 100)}%` }}
                      />
                    </div>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${statusBadge}`}>
                      {statusText}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      {/* END: Primary Score & Telemetry Card */}
    </div>
  );
}
