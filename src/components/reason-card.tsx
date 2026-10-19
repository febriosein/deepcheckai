"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Globe,
  FileCheck2,
  MessageSquareWarning,
  Cpu,
  Clock,
  ShieldAlert,
  Sparkles,
  Info,
} from "lucide-react";

interface IndicatorItem {
  routerId: string;
  name: string;
  finding: string;
  impact: "positif" | "negatif" | "netral";
  severity: "low" | "medium" | "high";
}

interface ReasonCardProps {
  reasoning: string;
  indicators: IndicatorItem[];
}

export function ReasonCard({ reasoning, indicators }: ReasonCardProps) {
  const [activeFilter, setActiveFilter] = useState<"all" | "negatif" | "netral" | "positif">(
    "all"
  );

  const filteredIndicators = indicators.filter((item) => {
    if (activeFilter === "all") return true;
    return item.impact === activeFilter;
  });

  const negativeCount = indicators.filter((i) => i.impact === "negatif").length;
  const neutralCount = indicators.filter((i) => i.impact === "netral").length;
  const positiveCount = indicators.filter((i) => i.impact === "positif").length;

  // Split reasoning by double or single newlines into distinct analytical sections
  const reasoningParagraphs = reasoning
    .split(/\n\s*\n|\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  // Helper to determine indicator icon based on name
  const getIndicatorIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("sumber") || lower.includes("domain")) return Globe;
    if (lower.includes("fakta") || lower.includes("klaim")) return FileCheck2;
    if (lower.includes("bahasa") || lower.includes("retorika") || lower.includes("emosional"))
      return MessageSquareWarning;
    if (lower.includes("visual") || lower.includes("ai") || lower.includes("forensik"))
      return Cpu;
    if (lower.includes("waktu") || lower.includes("kronologis") || lower.includes("peristiwa"))
      return Clock;
    if (lower.includes("sosial") || lower.includes("phishing") || lower.includes("transaksional"))
      return ShieldAlert;
    return Info;
  };

  return (
    <div className="space-y-6">
      {/* BEGIN: AnalysisExplanationSection */}
      <section className="bg-white rounded-2xl border border-slate-200/90 shadow-elevated p-5 sm:p-7 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 sm:pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-sm sm:text-lg font-bold text-slate-900 font-display">
                Alasan &amp; Penjelasan Hasil Analisis
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Sintesis argumentatif forensik digital multi-vektor
              </p>
            </div>
          </div>
          <span className="text-[10px] sm:text-xs bg-blue-50 text-blue-700 font-semibold px-2.5 py-1 rounded-full border border-blue-200">
            Analisis Multidimensi
          </span>
        </div>

        <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-3 font-normal">
          {reasoningParagraphs.map((paragraph, idx) => (
            <p key={idx}>{paragraph}</p>
          ))}
        </div>
      </section>
      {/* END: AnalysisExplanationSection */}

      {/* BEGIN: ForensicFindingsSection */}
      <section className="bg-white rounded-2xl border border-slate-200/90 shadow-elevated p-5 sm:p-7 space-y-4">
        {/* Findings Header with Filter Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 sm:pb-4">
          <div>
            <h3 className="text-sm sm:text-lg font-bold text-slate-900 font-display">
              Indikator Temuan Pemeriksaan Forensik
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500">
              Evaluasi mendalam lintas {indicators.length} dimensi akurasi, reputasi portal, dan integritas data
            </p>
          </div>

          <div className="flex items-center space-x-1.5 text-xs">
            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                activeFilter === "all"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Semua ({indicators.length})
            </button>
            {positiveCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveFilter("positif")}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                  activeFilter === "positif"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                }`}
              >
                Valid ({positiveCount})
              </button>
            )}
            {negativeCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveFilter("negatif")}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                  activeFilter === "negatif"
                    ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                    : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                }`}
              >
                Anomali ({negativeCount})
              </button>
            )}
          </div>
        </div>

        {/* Forensic Cards Grid (1 col on mobile, 2 cols on desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
          {filteredIndicators.map((item, idx) => {
            const PillarIcon = getIndicatorIcon(item.name);
            let statusBadge = "text-emerald-700 bg-emerald-50 border-emerald-200/60";
            let statusText = "✓ Valid & Kredibel";

            if (item.impact === "negatif") {
              statusBadge = "text-rose-700 bg-rose-50 border-rose-200/60";
              statusText = "✕ Anomali Terdeteksi";
            } else if (item.impact === "netral") {
              statusBadge = "text-amber-800 bg-amber-50 border-amber-200/60";
              statusText = "⚠ Perlu Konfirmasi";
            }

            const severityText =
              item.severity === "high"
                ? "Tinggi Resiko"
                : item.severity === "medium"
                ? "Sedang Resiko"
                : "Rendah Resiko";

            return (
              <div
                key={`${item.routerId}-${idx}`}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-card transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className="text-blue-600 shrink-0">
                        <PillarIcon className="w-4 h-4" />
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {item.name}
                      </h4>
                    </div>
                    <span className={`inline-flex items-center text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded border shrink-0 ${statusBadge}`}>
                      {statusText}
                    </span>
                  </div>

                  <p className="mt-2.5 text-xs text-slate-600 leading-relaxed font-normal">
                    {item.finding}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    Tingkat: <strong className="text-slate-700 font-medium">{severityText}</strong>
                  </span>
                  <span className="font-mono text-slate-500">
                    Modul: {item.routerId}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      {/* END: ForensicFindingsSection */}
    </div>
  );
}
