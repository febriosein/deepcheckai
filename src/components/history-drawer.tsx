"use client";

import React, { useState } from "react";
import { X, Trash2, Clock, Search, Download, FileJson } from "lucide-react";
import { FinalScoreResult } from "../lib/schemas";

export interface HistoryItem {
  id: string;
  timestamp: number;
  inputSummary: string;
  result: FinalScoreResult;
}

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: HistoryItem[];
  onSelectItem: (item: HistoryItem) => void;
  onClearHistory: () => void;
  onDeleteItem: (id: string) => void;
}

export function HistoryDrawer({
  isOpen,
  onClose,
  items,
  onSelectItem,
  onClearHistory,
  onDeleteItem,
}: HistoryDrawerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<"all" | "tinggi" | "sedang" | "rendah">("all");

  if (!isOpen) return null;

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.inputSummary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.result.headline.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (riskFilter === "all") return true;
    if (riskFilter === "tinggi") return item.result.score < 40;
    if (riskFilter === "sedang") return item.result.score >= 40 && item.result.score < 80;
    if (riskFilter === "rendah") return item.result.score >= 80;
    return true;
  });

  const handleExportJSON = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(items, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `deepcheck_history_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white border-l border-slate-200 h-full flex flex-col shadow-2xl p-4 sm:p-6 overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 sm:pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shrink-0">
              <Clock className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Riwayat Sesi Pemeriksaan
              </h3>
              <p className="text-[11px] text-slate-400">Tersimpan di sesi browser lokal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 active:scale-95 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Tutup riwayat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        {items.length > 0 && (
          <div className="py-3 space-y-2 border-b border-slate-100">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari dalam riwayat..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 pl-9 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              <button
                type="button"
                onClick={() => setRiskFilter("all")}
                className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold transition-all cursor-pointer ${
                  riskFilter === "all"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setRiskFilter("tinggi")}
                className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold transition-all cursor-pointer ${
                  riskFilter === "tinggi"
                    ? "bg-rose-600 text-white"
                    : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                }`}
              >
                Risiko Tinggi
              </button>
              <button
                type="button"
                onClick={() => setRiskFilter("sedang")}
                className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold transition-all cursor-pointer ${
                  riskFilter === "sedang"
                    ? "bg-amber-600 text-white"
                    : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                }`}
              >
                Risiko Sedang
              </button>
              <button
                type="button"
                onClick={() => setRiskFilter("rendah")}
                className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold transition-all cursor-pointer ${
                  riskFilter === "rendah"
                    ? "bg-emerald-600 text-white"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                }`}
              >
                Risiko Rendah
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-52 text-center text-slate-400">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 mb-3">
                <Clock className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-xs font-semibold text-slate-700">Belum ada riwayat verifikasi</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-[220px]">
                Media yang Anda periksa akan tersimpan sementara di memori browser sesi ini.
              </p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">
              Tidak ada hasil yang sesuai dengan filter pencarian.
            </div>
          ) : (
            filteredItems.map((item) => {
              const score = item.result.score;
              let badgeColor = "text-emerald-700 border-emerald-200 bg-emerald-50";
              if (score < 35) {
                badgeColor = "text-rose-700 border-rose-200 bg-rose-50";
              } else if (score < 60) {
                badgeColor = "text-orange-800 border-orange-200 bg-orange-50";
              } else if (score < 80) {
                badgeColor = "text-amber-800 border-amber-200 bg-amber-50";
              }

              const timeStr = new Date(item.timestamp).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 sm:p-4 hover:bg-white hover:border-blue-300 hover:shadow-xs transition-all flex items-start justify-between gap-2.5 sm:gap-3 group"
                >
                  <div
                    onClick={() => {
                      onSelectItem(item);
                      onClose();
                    }}
                    className="flex-1 cursor-pointer space-y-1 min-w-0"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${badgeColor} shadow-2xs`}
                      >
                        {score}%
                      </span>
                      <span className="text-[10px] font-medium text-slate-400">{timeStr}</span>
                    </div>

                    <p className="text-xs font-bold text-slate-900 line-clamp-2">
                      {item.result.headline || item.inputSummary}
                    </p>

                    <p className="text-[11px] text-slate-500 truncate font-mono">
                      {item.inputSummary}
                    </p>
                  </div>

                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="text-slate-400 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-50 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-all cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center shrink-0"
                    title="Hapus item"
                    aria-label="Hapus item riwayat"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer actions */}
        {items.length > 0 && (
          <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer p-1.5 rounded-lg active:scale-95 transition-all"
              title="Unduh laporan riwayat untuk tugas kuliah"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Ekspor JSON</span>
            </button>

            <button
              onClick={onClearHistory}
              className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer p-1.5 rounded-lg active:scale-95 transition-all min-h-[36px]"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Bersihkan Semua</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
