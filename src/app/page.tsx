"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MediaInput, MediaInputSubmitData } from "@/components/media-input";
import { AnalysisProgress } from "@/components/analysis-progress";
import { ScoreCard } from "@/components/score-card";
import { ReasonCard } from "@/components/reason-card";
import { HistoryDrawer, HistoryItem } from "@/components/history-drawer";
import { VerificationCardExport } from "@/components/verification-card-export";
import { FinalScoreResult } from "@/lib/schemas";
import { ProgressUpdate } from "@/routers/types";
import {
  ShieldAlert,
  RotateCcw,
  ThumbsDown,
  Sparkles,
  CheckCircle,
  Search,
  FileCheck,
  ShieldCheck,
  Share2,
} from "lucide-react";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentProgress, setCurrentProgress] = useState<ProgressUpdate | null>(
    null
  );
  const [analysisResult, setAnalysisResult] =
    useState<FinalScoreResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Session-based history state
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);

  // Load history from session storage on client mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("deepcheck_history");
      if (stored) {
        setHistoryItems(JSON.parse(stored));
      }
    } catch {
      // Ignore storage error
    }
  }, []);

  const saveHistoryItem = (summary: string, result: FinalScoreResult) => {
    const newItem: HistoryItem = {
      id: "hist_" + Date.now(),
      timestamp: Date.now(),
      inputSummary: summary,
      result,
    };
    const updated = [newItem, ...historyItems].slice(0, 20); // Keep max 20
    setHistoryItems(updated);
    try {
      sessionStorage.setItem("deepcheck_history", JSON.stringify(updated));
    } catch { }
  };

  const handleClearHistory = () => {
    setHistoryItems([]);
    try {
      sessionStorage.removeItem("deepcheck_history");
    } catch { }
  };

  const handleDeleteHistoryItem = (id: string) => {
    const filtered = historyItems.filter((i) => i.id !== id);
    setHistoryItems(filtered);
    try {
      sessionStorage.setItem("deepcheck_history", JSON.stringify(filtered));
    } catch { }
  };

  const handleStartAnalysis = async (data: MediaInputSubmitData) => {
    setIsLoading(true);
    setErrorMessage(null);
    setAnalysisResult(null);
    setCurrentProgress({
      step: "R1",
      status: "running",
      label: "Menghubungkan ke sistem analisis DeepCheck AI...",
      timestamp: Date.now(),
    });
    setFeedbackSent(false);

    let summaryText = "";
    if (data.type === "url") summaryText = `Tautan: ${data.url}`;
    else if (data.file) summaryText = `File: ${data.file.name}`;
    else if (data.text) summaryText = `Teks: ${data.text.slice(0, 50)}...`;

    try {
      // Connect to API with streaming support
      const formData = new FormData();
      formData.append("type", data.type);
      if (data.url) formData.append("url", data.url);
      if (data.text) formData.append("text", data.text);
      if (data.file) formData.append("file", data.file);

      const response = await fetch("/api/analyze?stream=true", {
        method: "POST",
        body: formData,
        headers: {
          Accept: "text/event-stream",
        },
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        throw new Error(
          errorJson.error ||
          "Layanan sedang sibuk. Kuota API mungkin terlampaui atau format tidak didukung."
        );
      }

      // Read SSE stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      if (!reader) {
        throw new Error("Gagal membuka aliran data respons (stream reader).");
      }

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const rawJson = line.slice(6);
            try {
              const event = JSON.parse(rawJson);
              if (event.type === "progress") {
                setCurrentProgress(event.progress);
              } else if (event.type === "result") {
                setAnalysisResult(event.result);
                saveHistoryItem(summaryText, event.result);
              } else if (event.type === "error") {
                throw new Error(event.error);
              }
            } catch (parseError: any) {
              console.error("Parse event error:", parseError);
            }
          }
        }
      }
    } catch (err: any) {
      console.error("Submission error:", err);
      setErrorMessage(
        err.message ||
        "Terjadi kendala saat memproses analisis. Harap pastikan koneksi internet dan API key valid."
      );
    } finally {
      setIsLoading(false);
      setCurrentProgress(null);
    }
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setErrorMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div suppressHydrationWarning className="bg-slate-50 text-slate-800 font-sans antialiased selection:bg-blue-100 selection:text-blue-800 min-h-screen relative flex flex-col w-full max-w-full overflow-x-hidden">
      {/* Background decorative light patterns from Stitch */}
      <div className="absolute inset-0 bg-grid-pattern pointer-events-none opacity-60 z-0 h-[650px] w-full overflow-hidden" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[900px] h-[400px] bg-gradient-to-b from-blue-100/70 via-indigo-50/40 to-transparent blur-3xl pointer-events-none z-0 overflow-hidden" />

      {/* Main Header */}
      <Header
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={historyItems.length}
      />

      <main suppressHydrationWarning className="flex-grow z-10 max-w-5xl mx-auto px-3.5 sm:px-6 lg:px-8 w-full pt-4 sm:pt-10 pb-16 space-y-5 sm:space-y-8">
        {/* BEGIN: HeroSection */}
        <section className="text-center max-w-4xl mx-auto space-y-3 sm:space-y-4" data-purpose="hero-section">

          {/* Hero Heading */}
          <h1 className="font-extrabold text-2xl sm:text-4xl md:text-5xl lg:text-6xl text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
            Verifikasi Media &amp; Cek Deepfake <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent">
              Dalam Hitungan Detik
            </span>
          </h1>

          {/* Hero Subtitle */}
          <p className="text-xs sm:text-sm md:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Periksa tautan berita, poster gambar, rekaman video, atau suara sebelum Anda membagikannya. DeepCheck AI menganalisis artefak visual, pola bahasa hoaks, dan rujukan sumber resmi secara terpadu.
          </p>
        </section>
        {/* END: HeroSection */}

        {/* BEGIN: InputConsoleCard */}
        <MediaInput onSubmit={handleStartAnalysis} isLoading={isLoading} />
        {/* END: InputConsoleCard */}

        {/* REAL-TIME PROGRESS INDICATOR */}
        {isLoading && (
          <div className="animate-in fade-in-50 slide-in-from-bottom-3 duration-300">
            <AnalysisProgress currentUpdate={currentProgress} />
          </div>
        )}

        {/* ERROR STATE */}
        {errorMessage && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/95 p-4 sm:p-5 text-rose-900 shadow-2xs space-y-1.5 animate-in fade-in duration-300 max-w-3xl mx-auto">
            <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-rose-800">
              <ShieldAlert className="h-4 w-4 sm:h-5 sm:w-5 text-rose-600 shrink-0" />
              <span>Gagal Menyelesaikan Verifikasi</span>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed text-rose-800 font-normal">
              {errorMessage}
            </p>
            <p className="text-[11px] text-rose-700/80 pt-0.5">
              Tips: Jika kuota Gemini sedang sibuk, silakan tunggu beberapa detik lalu coba periksa kembali.
            </p>
          </div>
        )}

        {/* RESULTS SECTION */}
        {analysisResult && (
          <section className="space-y-6 sm:space-y-8 animate-in fade-in-50 slide-in-from-bottom-5 duration-500" data-purpose="results-section">
            {/* Score Overview with Gauge & 4 Core Pillars */}
            <ScoreCard
              score={analysisResult.score}
              riskCategory={analysisResult.riskCategory}
              headline={analysisResult.headline}
              routersUsed={analysisResult.metadata.routersUsed}
              processingTimeMs={analysisResult.metadata.processingTimeMs}
              indicators={analysisResult.indicators}
              sourcesCount={analysisResult.sources.length}
              onOpenShareModal={() => setIsShareModalOpen(true)}
            />

            {/* Deep Forensic Narrative & 8-Dimension Indicators Grid */}
            <ReasonCard
              reasoning={analysisResult.reasoning}
              indicators={analysisResult.indicators}
            />

            {/* Bottom Actions Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200/80">
              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <button
                  onClick={handleReset}
                  type="button"
                  className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs sm:text-sm font-semibold shadow-xs hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Periksa Media Lainnya</span>
                </button>

                <button
                  onClick={() => setIsShareModalOpen(true)}
                  type="button"
                  className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Ekspor Kartu Debunk</span>
                </button>
              </div>

              <div className="text-center sm:text-right">
                {feedbackSent ? (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                    ✓ Masukan Anda tersimpan
                  </span>
                ) : (
                  <button
                    onClick={() => setFeedbackSent(true)}
                    type="button"
                    className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    <ThumbsDown className="w-4 h-4 text-slate-400" />
                    <span>Hasil ini keliru? Laporkan Masukan Forensik</span>
                  </button>
                )}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Main Footer */}
      <Footer />

      {/* SESSION HISTORY DRAWER */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        items={historyItems}
        onSelectItem={(item) => {
          setAnalysisResult(item.result);
          window.scrollTo({ top: 120, behavior: "smooth" });
        }}
        onClearHistory={handleClearHistory}
        onDeleteItem={handleDeleteHistoryItem}
      />

      {/* VERIFICATION CARD EXPORT MODAL */}
      {analysisResult && (
        <VerificationCardExport
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          result={analysisResult}
        />
      )}
    </div>
  );
}
