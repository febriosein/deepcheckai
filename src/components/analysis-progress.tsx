"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  Loader2,
  Sparkles,
  Shield,
  Cpu,
  FileCheck,
  Activity,
  ChevronDown,
} from "lucide-react";
import { ProgressUpdate } from "../routers/types";

interface AnalysisProgressProps {
  currentUpdate?: ProgressUpdate | null;
}

interface PhaseInfo {
  phase: number;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  routers: string[];
}

const PHASES: PhaseInfo[] = [
  {
    phase: 1,
    title: "Validasi & Ekstraksi Media",
    subtitle: "Tipe file, sanitasi URL & sampling",
    icon: Shield,
    routers: ["R1", "R2"],
  },
  {
    phase: 2,
    title: "Deteksi Artefak AI & Deepfake",
    subtitle: "Anomali visual, lip-sync, kloning suara",
    icon: Cpu,
    routers: ["R4", "R5", "R6"],
  },
  {
    phase: 3,
    title: "Korelasi Narasi & Sumber",
    subtitle: "OCR klaim, NLP & cek fakta resmi",
    icon: FileCheck,
    routers: ["R3", "R7", "R8"],
  },
  {
    phase: 4,
    title: "Sintesis Skor & Literasi",
    subtitle: "Kalkulasi akurasi probabilistik",
    icon: Sparkles,
    routers: ["R9"],
  },
];

// Curated synthetic "detection log" entries tied to each router transition.
const LOG_TEMPLATES: Record<string, string[]> = {
  R1: ["✔ Format media terdeteksi", "✔ Metadata & tipe file selesai diperiksa"],
  R2: ["✔ Sampling frame video berhasil", "✔ Pra-pemrosesan sinyal selesai"],
  R3: ["⠙ Ekstraksi klaim OCR berjalan...", "⠙ OCR recognizer aktif..."],
  R4: ["⠙ Pemindaian anomali piksel...", "⠙ Analisis tekstur generatif..."],
  R5: ["⠙ Cek lip-sync frame...", "⠙ Analisis artefak video..."],
  R6: ["⠙ Deteksi kloning suara...", "⠙ Spektogram audio diproses..."],
  R7: ["⠙ Analisis pola bahasa NLP...", "⠙ Sentimen & urgensi diproses..."],
  R8: ["⠙ Sinkron kominfo / mafindo...", "⠙ Cek fakta sumber resmi..."],
  R9: ["⠙ Menyintesis skor final...", "⠙ Mengolah literasi 60 detik..."],
};

export function AnalysisProgress({ currentUpdate }: AnalysisProgressProps) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [logEntries, setLogEntries] = useState<string[]>([]);
  const [expandedLog, setExpandedLog] = useState(true);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      setElapsedMs(Date.now() - startTime);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Determine active phase based on current router step
  const activeRouter = currentUpdate?.step || "R1";
  let activePhaseNumber = 1;
  if (["R4", "R5", "R6"].includes(activeRouter)) activePhaseNumber = 2;
  else if (["R3", "R7", "R8"].includes(activeRouter)) activePhaseNumber = 3;
  else if (activeRouter === "R9") activePhaseNumber = 4;

  const overallProgress = Math.min(98, Math.round(((activePhaseNumber - 1) / 3) * 85 + 8));

  // Add rolling log entries as router changes
  useEffect(() => {
    if (!currentUpdate?.step) return;
    const templates = LOG_TEMPLATES[currentUpdate.step];
    if (!templates) return;
    const entry = `${templates[Math.floor(Math.random() * templates.length)]}`;
    setLogEntries((prev) => [...prev.slice(-6), entry]);
  }, [currentUpdate?.step]);

  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl glass-card-elevated p-4 sm:p-7 space-y-5 transition-all">
      {/* TOP SHIMMER LINE - gradient flowing */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500 transition-all duration-700 progress-shimmer"
          style={{ width: `${Math.max(8, overallProgress)}%` }}
        />
      </div>

      {/* HEADER TELEMETRY */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/20 pulse-glow">
            <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
              Analisis Multi-Jalur AI Berjalan...
            </h3>
            <p className="text-xs text-blue-600 font-medium mt-0.5 truncate">
              {currentUpdate?.label || "Menghubungkan ke orkestrator pipeline..."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 rounded-full bg-slate-100 border border-slate-200/70 px-3 py-1 text-xs font-mono font-bold text-slate-700">
          <Clock className="h-3.5 w-3.5 text-blue-600 animate-pulse" />
          <span>{(elapsedMs / 1000).toFixed(1)}s</span>
        </div>
      </div>

      {/* OVERALL PROGRESS BAR */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-slate-700">
            <Activity className="h-3.5 w-3.5 text-indigo-600" />
            <span>Progres Analisis</span>
          </div>
          <span className="font-mono font-bold text-indigo-600">{overallProgress}%</span>
        </div>

        <div className="relative h-2 rounded-full bg-slate-200/70 overflow-hidden">
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: `${Math.max(8, overallProgress)}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400 relative overflow-hidden"
          >
            <div className="absolute inset-0 shimmer-sweep opacity-60" />
          </motion.div>
        </div>

        <p className="text-[10px] sm:text-[11px] text-slate-500 text-center">
          Pemeriksaan dilakukan oleh {PHASES.length} tahap pipeline forensik terpadu
        </p>
      </div>

      {/* 4-PHASE PIPELINE STEPPER */}
      {/* Desktop: horizontal grid */}
      <div className="hidden sm:grid grid-cols-4 gap-2.5 sm:gap-3">
        {PHASES.map((p) => {
          const isCurrent = p.phase === activePhaseNumber;
          const isCompleted = p.phase < activePhaseNumber;
          const isPending = p.phase > activePhaseNumber;
          const Icon = p.icon;

          return (
            <div
              key={p.phase}
              className={`p-3.5 rounded-2xl border transition-all ${
                isCurrent
                  ? "bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 border-indigo-200 ring-2 ring-indigo-400/30 shadow-md relative pulse-glow"
                  : isCompleted
                  ? "bg-emerald-50/60 border-emerald-200/80 text-emerald-950"
                  : "bg-slate-50/70 border-slate-200/60 text-slate-400"
              }`}
            >
              {isCurrent && (
                <div
                  className="absolute inset-0 rounded-2xl opacity-[0.15] pointer-events-none holo-ring"
                  aria-hidden="true"
                />
              )}

              <div className="relative flex items-center justify-between mb-2">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-xl text-xs font-bold transition-all ${
                    isCurrent
                      ? "bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-md scale-110 pulse-glow"
                      : isCompleted
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : isCurrent ? (
                    <Icon className="h-4 w-4 animate-pulse" />
                  ) : (
                    p.phase
                  )}
                </div>

                <span
                  className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    isCurrent
                      ? "bg-indigo-100 text-indigo-800"
                      : isCompleted
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {isCurrent ? "Berjalan" : isCompleted ? "Selesai" : "Menunggu"}
                </span>
              </div>

              <h4
                className={`relative text-xs font-bold ${
                  isCurrent
                    ? "text-indigo-950 font-extrabold"
                    : isCompleted
                    ? "text-emerald-950"
                    : "text-slate-700"
                }`}
              >
                {p.title}
              </h4>

              <p className="relative text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                {p.subtitle}
              </p>
            </div>
          );
        })}
      </div>

      {/* MOBILE: Vertical Timeline Stepper */}
      <div className="sm:hidden space-y-2.5">
        {PHASES.map((p, idx) => {
          const isCurrent = p.phase === activePhaseNumber;
          const isCompleted = p.phase < activePhaseNumber;
          const isLast = idx === PHASES.length - 1;
          const Icon = p.icon;

          return (
            <div key={p.phase} className="flex gap-3">
              {/* Bullet & Connector */}
              <div className="flex flex-col items-center shrink-0">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    isCurrent
                      ? "bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-md scale-110 pulse-glow"
                      : isCompleted
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : isCurrent ? (
                    <Icon className="h-4 w-4 animate-pulse" />
                  ) : (
                    p.phase
                  )}
                </div>
                {!isLast && (
                  <div
                    className={`flex-1 w-0.5 min-h-[28px] my-1 rounded-full ${
                      isCompleted
                        ? "bg-emerald-400"
                        : isCurrent
                        ? "bg-gradient-to-b from-blue-500 to-cyan-300"
                        : "bg-slate-200"
                    }`}
                  />
                )}
              </div>

              {/* Card */}
              <div
                className={`flex-1 rounded-xl border p-2.5 mb-1 transition-all ${
                  isCurrent
                    ? "bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 border-indigo-200 ring-1 ring-indigo-300/40"
                    : isCompleted
                    ? "bg-emerald-50/50 border-emerald-200/60"
                    : "bg-slate-50/60 border-slate-200/60"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <h4
                    className={`text-[11px] font-bold ${
                      isCurrent
                        ? "text-indigo-950"
                        : isCompleted
                        ? "text-emerald-950"
                        : "text-slate-500"
                    }`}
                  >
                    {p.title}
                  </h4>
                  {isCurrent && (
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                      Berjalan
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 leading-snug">{p.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* DETECTION LOG (Rolling terminal-style) */}
      {logEntries.length > 0 && (
        <div className="rounded-2xl overflow-hidden border border-slate-800/90 bg-slate-900/95 shadow-lg">
          <button
            type="button"
            onClick={() => setExpandedLog((v) => !v)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-800/70 cursor-pointer min-h-[44px]"
            aria-expanded={expandedLog}
          >
            <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-300">
              <span className="flex gap-1 shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider">
                Log forensik live
              </span>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-slate-400 transition-transform ${
                expandedLog ? "rotate-0" : "-rotate-90"
              }`}
            />
          </button>

          {expandedLog && (
            <div className="px-3.5 py-3 space-y-1 max-h-36 overflow-y-auto">
              {logEntries.map((entry, idx) => (
                <p
                  key={idx}
                  className="roll-in font-mono text-[10px] sm:text-[11px] text-emerald-300/90 leading-relaxed"
                >
                  {entry}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
