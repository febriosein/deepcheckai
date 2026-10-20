import React from "react";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-10 sm:mt-12 py-5 sm:py-8 relative z-10 w-full">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          {/* Academic Info */}
          <div className="flex items-center space-x-3">
            <div className="relative w-8 h-8 rounded-lg bg-white border border-blue-100 flex items-center justify-center p-0.5 shadow-2xs shrink-0 overflow-hidden">
              <Image
                src="/logo-icon.png"
                alt="DeepCheck AI Logo"
                width={32}
                height={32}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800">
                DeepCheck AI
              </p>
              <p className="text-[11px] text-slate-500">
                Proyek Mata Kuliah PTIK • Program Studi Informatika
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
