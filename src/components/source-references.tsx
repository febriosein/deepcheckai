"use client";

import React from "react";
import { ExternalLink, CheckCircle2, Shield } from "lucide-react";

interface SourceItem {
  title: string;
  url: string;
  snippet: string;
  status: string;
}

interface SourceReferencesProps {
  sources: SourceItem[];
}

export function SourceReferences({ sources }: SourceReferencesProps) {
  return (
    <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white/95 p-4 sm:p-7 shadow-xl shadow-slate-200/60 backdrop-blur-xl transition-all">
      <div className="flex items-center gap-2.5 text-slate-900 font-bold text-sm sm:text-base mb-3 sm:mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shrink-0">
          <Shield className="h-4.5 w-4.5" />
        </div>
        <span>Rujukan Sumber Resmi &amp; Cek Fakta</span>
      </div>

      {sources.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4 sm:p-5 text-xs text-slate-500 leading-relaxed">
          Belum ditemukan rujukan cek fakta yang secara spesifik mencantumkan klaim ini. Disarankan mengecek langsung pada basis data independen seperti TurnBackHoax.id atau situs resmi kementerian terkait.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5">
          {sources.map((src, idx) => (
            <div
              key={idx}
              className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-slate-50/60 p-3.5 sm:p-4.5 hover:bg-white hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5 transition-all group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full shadow-2xs">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>{src.status || "Rujukan Verifikasi"}</span>
                  </span>

                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-blue-600 p-1.5 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                    title="Buka rujukan sumber"
                    aria-label={`Buka tautan rujukan ${src.title}`}
                  >
                    <ExternalLink className="h-4 w-4 group-hover:text-blue-600 transition-colors" />
                  </a>
                </div>

                <h5 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 sm:line-clamp-1 mb-1.5">
                  {src.title}
                </h5>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-normal">
                  {src.snippet}
                </p>
              </div>

              <div className="mt-3.5 sm:mt-4 border-t border-slate-200/60 pt-2.5 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400 truncate max-w-[120px] sm:max-w-[200px] font-mono">
                  {src.url}
                </span>
                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 group-hover:underline shrink-0 min-h-[32px]"
                >
                  <span>Baca Sumber</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
