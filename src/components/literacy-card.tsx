"use client";

import React, { useState } from "react";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
  CheckSquare2,
  Square,
  BookMarked,
  X,
  HelpCircle,
} from "lucide-react";

interface LiteracyTip {
  title: string;
  tips: string[];
  actionSuggestion: string;
}

interface LiteracyCardProps {
  literacyTip: LiteracyTip;
}

const GLOSSARY_ITEMS = [
  {
    term: "Deepfake",
    def: "Teknologi rekayasa wajah, ekspresi, atau gerak bibir sintetis menggunakan model kecerdasan buatan (seperti GAN/Diffusion) hingga menyerupai rekaman asli.",
  },
  {
    term: "Voice Cloning",
    def: "Sintesis audio digital yang meniru warna suara, intonasi, dan aksen seseorang hanya dari sampel audio pendek berdurasi beberapa detik.",
  },
  {
    term: "Cheapfake",
    def: "Manipulasi media non-AI berkemampuan rendah, seperti mempercepat/memperlambat video, memotong durasi di luar konteks, atau memberi teks judul palsu.",
  },
  {
    term: "Phishing & Social Engineering",
    def: "Metode manipulasi psikologis yang memanfaatkan rasa takut atau iming-iming hadiah mendesak untuk memaksa korban menyerahkan OTP SMS atau data perbankan.",
  },
  {
    term: "Astroturfing",
    def: "Pengerahan akun anonim atau bot media sosial secara serentak untuk menciptakan ilusi seolah-olah suatu klaim hoaks dipercaya oleh ribuan orang.",
  },
];

export function LiteracyCard({ literacyTip }: LiteracyCardProps) {
  const [copied, setCopied] = useState(false);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);

  // Interactive 3C Checklist State
  const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>({
    c1: false,
    c2: false,
    c3: false,
  });

  const toggleCheck = (key: string) => {
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const completedCount = Object.values(checkedItems).filter(Boolean).length;

  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator
        .share({
          title: "DeepCheck AI - Literasi 60 Detik",
          text: "Saring Sebelum Sharing: Verifikasi keaslian media sebelum membagikannya dengan DeepCheck AI.",
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(
        "Saring Sebelum Sharing! Cek keaslian media di DeepCheck AI: " +
          window.location.href
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div
      id="literasi"
      className="rounded-2xl sm:rounded-3xl border border-indigo-200/90 bg-gradient-to-br from-indigo-50/90 via-white to-sky-50/90 p-4 sm:p-7 shadow-xl shadow-indigo-500/5 backdrop-blur-xl transition-all space-y-5"
    >
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 text-indigo-900 font-bold text-sm sm:text-base">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 shrink-0">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <span>{literacyTip.title || "Modul Literasi 60 Detik: Saring Sebelum Sharing"}</span>
        </div>

        <button
          type="button"
          onClick={() => setIsGlossaryOpen(true)}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-white/95 px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-2xs hover:bg-indigo-50 active:scale-95 transition-all cursor-pointer min-h-[36px]"
        >
          <BookMarked className="h-3.5 w-3.5 text-indigo-600" />
          <span>Kamus Istilah AI</span>
        </button>
      </div>

      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
        Terapkan kebiasaan verifikasi mandiri sebelum membagikan narasi, tangkapan layar, atau video ke grup obrolan dan media sosial.
      </p>

      {/* 3 Step Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3.5">
        {literacyTip.tips.map((tip, idx) => (
          <div
            key={idx}
            className="flex items-start gap-3 rounded-2xl border border-indigo-100/80 bg-white/90 p-3.5 sm:p-4 shadow-2xs hover:shadow-xs transition-all"
          >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-blue-600 text-white text-xs font-bold mt-0.5 shadow-xs">
              {idx + 1}
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">{tip}</p>
          </div>
        ))}
      </div>

      {/* INTERACTIVE 3C CHECKLIST */}
      <div className="rounded-2xl border border-indigo-200/80 bg-white/95 p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare2 className="h-4 w-4 text-indigo-600" />
            <h4 className="text-xs font-bold text-slate-900">
              Checklist Interaktif 3C Mahasiswa:
            </h4>
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              completedCount === 3
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-indigo-50 text-indigo-700 border-indigo-200"
            }`}
          >
            {completedCount}/3 Langkah Selesai
          </span>
        </div>

        <div className="space-y-2">
          {/* C1 */}
          <div
            onClick={() => toggleCheck("c1")}
            className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
          >
            <button type="button" className="mt-0.5 text-indigo-600 shrink-0">
              {checkedItems.c1 ? (
                <CheckSquare2 className="h-4.5 w-4.5 text-indigo-600" />
              ) : (
                <Square className="h-4.5 w-4.5 text-slate-300" />
              )}
            </button>
            <div className="text-xs text-slate-700">
              <strong className="text-slate-900 font-bold">1. Cek Sumber Resmi:</strong>{" "}
              Apakah informasi ini diterbitkan oleh domain pemerintah resmi (.go.id) atau pers terverifikasi Dewan Pers?
            </div>
          </div>

          {/* C2 */}
          <div
            onClick={() => toggleCheck("c2")}
            className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
          >
            <button type="button" className="mt-0.5 text-indigo-600 shrink-0">
              {checkedItems.c2 ? (
                <CheckSquare2 className="h-4.5 w-4.5 text-indigo-600" />
              ) : (
                <Square className="h-4.5 w-4.5 text-slate-300" />
              )}
            </button>
            <div className="text-xs text-slate-700">
              <strong className="text-slate-900 font-bold">2. Cek Konteks Peristiwa:</strong>{" "}
              Apakah video atau foto ini merupakan rekaman kejadian lama yang didaur ulang dengan narasi baru?
            </div>
          </div>

          {/* C3 */}
          <div
            onClick={() => toggleCheck("c3")}
            className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
          >
            <button type="button" className="mt-0.5 text-indigo-600 shrink-0">
              {checkedItems.c3 ? (
                <CheckSquare2 className="h-4.5 w-4.5 text-indigo-600" />
              ) : (
                <Square className="h-4.5 w-4.5 text-slate-300" />
              )}
            </button>
            <div className="text-xs text-slate-700">
              <strong className="text-slate-900 font-bold">3. Tahan Sebar:</strong>{" "}
              Jangan teruskan pesan jika masih ada keraguan sekecil apa pun. Putus rantai hoaks di perangkat Anda.
            </div>
          </div>
        </div>
      </div>

      {/* Concrete Action Suggestion */}
      <div className="rounded-2xl border border-indigo-200/90 bg-indigo-50/80 p-3.5 sm:p-4.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 shadow-2xs">
        <div className="flex items-start sm:items-center gap-2.5 text-xs sm:text-sm text-indigo-950 font-medium">
          <ShieldCheck className="h-5 w-5 shrink-0 text-indigo-600 mt-0.5 sm:mt-0" />
          <span>
            <strong className="text-indigo-900 font-bold">Rekomendasi Tindakan:</strong>{" "}
            {literacyTip.actionSuggestion}
          </span>
        </div>

        <button
          onClick={handleShare}
          className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold px-4 py-3 sm:py-2.5 text-xs sm:text-sm shadow-md shadow-indigo-500/20 active:scale-[0.98] transition-all cursor-pointer min-h-[44px]"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              <span>Tautan Disalin!</span>
            </>
          ) : (
            <>
              <span>Ajak Teman Verifikasi</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>

      {/* GLOSSARY MODAL DIALOG */}
      {isGlossaryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200 p-5 sm:p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <BookMarked className="h-5 w-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Kamus Singkat Istilah AI &amp; Hoaks
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsGlossaryOpen(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {GLOSSARY_ITEMS.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1"
                >
                  <h4 className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-600"></span>
                    <span>{item.term}</span>
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    {item.def}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsGlossaryOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Tutup Kamus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
