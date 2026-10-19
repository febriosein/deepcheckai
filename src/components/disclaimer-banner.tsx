import React from "react";
import { AlertCircle } from "lucide-react";

export function DisclaimerBanner({
  customDisclaimer,
}: {
  customDisclaimer?: string;
}) {
  return (
    <section className="max-w-3xl mx-auto bg-amber-50/90 border border-amber-200/80 rounded-xl p-3.5 sm:p-4 text-left flex items-start space-x-3 text-amber-900 shadow-xs">
      <div className="flex-shrink-0 mt-0.5 text-amber-600">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
      </div>
      <div className="text-xs sm:text-[13px] leading-relaxed">
        <span className="font-bold text-amber-950 block">
          Prinsip Human Oversight: Skor adalah Bantuan Berpikir Kritis, Bukan Vonis Mutlak
        </span>
        <p className="text-amber-800/90 mt-0.5">
          {customDisclaimer ||
            "Skor ini adalah indikator probabilistik berbasis kecerdasan buatan untuk membantu berpikir kritis, bukan merupakan vonis kebenaran mutlak. Keputusan akhir tetap berada di tangan Anda sebagai pengguna yang bijak."}
        </p>
      </div>
    </section>
  );
}
