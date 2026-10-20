"use client";

import React, { useState } from "react";
import {
  X,
  Share2,
  Copy,
  Check,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Info,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { FinalScoreResult } from "../lib/schemas";
import { getRiskBadge } from "../lib/utils";

interface VerificationCardExportProps {
  isOpen: boolean;
  onClose: () => void;
  result: FinalScoreResult;
}

export function VerificationCardExport({
  isOpen,
  onClose,
  result,
}: VerificationCardExportProps) {
  const [copiedText, setCopiedText] = useState(false);

  if (!isOpen) return null;

  const badge = getRiskBadge(result.score);

  // Generate WhatsApp-friendly debunk message
  const handleCopyWhatsApp = () => {
    const riskEmoji =
      result.score < 35
        ? "🚨 [PERINGATAN HOAKS / DEEPFAKE]"
        : result.score < 60
        ? "⚠️ [WASPADA: INFORMASI MERAGUKAN]"
        : "✅ [INFORMASI TERVERIFIKASI]";

    const message = `
${riskEmoji}
*Hasil Cek Fakta DeepCheck AI*

📌 *Klaim/Konten:* ${result.headline}
📊 *Skor Keaslian:* ${result.score}% (Kategori: Risiko ${badge.category})

🔍 *Catatan Pemeriksaan:*
${result.reasoning}

💡 *Rekomendasi Tindakan:*
${result.literacyTip.actionSuggestion}

🔗 *Rujukan Resmi:*
${
  result.sources.length > 0
    ? result.sources.map((s) => `• ${s.title}: ${s.url}`).join("\n")
    : "• Cek portal resmi: https://turnbackhoax.id atau https://kominfo.go.id"
}

_Diverifikasi melalui DeepCheck AI (Proyek PTIK). Selalu terapkan prinsip 3C: Cek Sumber, Cek Konteks, Tahan Sebar._
    `.trim();

    navigator.clipboard.writeText(message);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl sm:rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200 my-auto sm:my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <Share2 className="h-4 w-4 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Bagikan Kartu Klarifikasi / Debunk
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 active:scale-95 transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
            aria-label="Tutup modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Shareable Card Canvas Preview */}
        <div className="p-4 sm:p-6 bg-slate-50/60">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-4">
            {/* Brand Card Bar */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <img
                  src="/logo-icon.png"
                  alt="DeepCheck AI Logo"
                  className="w-5 h-5 object-contain"
                />
                <span className="font-black tracking-tight text-slate-900 text-sm">
                  DeepCheck <span className="text-blue-600">AI</span>
                </span>
                <span className="rounded-full bg-blue-50 px-2 py-0.2 text-[9px] font-bold text-blue-700 border border-blue-200">
                  PTIK Kelompok 4
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                Saring Sebelum Sharing
              </span>
            </div>

            {/* Verdict Box */}
            <div
              className={`rounded-xl p-3.5 border flex items-center justify-between ${badge.bgClass} ${badge.borderClass}`}
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Status Verifikasi
                </span>
                <h4 className={`text-base font-extrabold ${badge.colorClass}`}>
                  Risiko {badge.category.toUpperCase()}
                </h4>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-slate-900">
                  {result.score}%
                </span>
                <p className="text-[9px] font-bold uppercase text-slate-400">
                  Skor Keaslian
                </p>
              </div>
            </div>

            {/* Content summary */}
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-slate-900 leading-snug">
                {result.headline}
              </p>
              <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-3">
                {result.reasoning}
              </p>
            </div>

            {/* Key Action Recommendation */}
            <div className="rounded-xl bg-blue-50/70 border border-blue-200/80 p-3 text-[11px] text-blue-900">
              <strong className="font-bold">Langkah Mahasiswa:</strong>{" "}
              {result.literacyTip.actionSuggestion}
            </div>

            {/* Micro Ethics Disclaimer */}
            <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-2 flex items-center justify-between">
              <span>Analisis multi-jalur AI Gemini</span>
              <span>Bebas biometrik</span>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 sm:p-5 border-t border-slate-100 bg-white">
          <p className="text-xs text-slate-500 text-center sm:text-left">
            Gunakan format teks untuk klarifikasi cepat di WhatsApp atau Telegram.
          </p>

          <button
            onClick={handleCopyWhatsApp}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold px-5 py-3 text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all cursor-pointer min-h-[44px]"
          >
            {copiedText ? (
              <>
                <Check className="h-4 w-4" />
                <span>Format WA Disalin!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Salin Teks WhatsApp</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
