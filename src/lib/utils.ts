import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function getRiskBadge(score: number): {
  category: "Rendah" | "Sedang" | "Tinggi" | "Kritis";
  colorClass: string;
  bgClass: string;
  borderClass: string;
  label: string;
} {
  if (score >= 80) {
    return {
      category: "Rendah",
      colorClass: "text-emerald-700 font-semibold",
      bgClass: "bg-emerald-50",
      borderClass: "border-emerald-200",
      label: "Risiko Manipulasi Rendah (Cenderung Asli)",
    };
  } else if (score >= 60) {
    return {
      category: "Sedang",
      colorClass: "text-amber-800 font-semibold",
      bgClass: "bg-amber-50",
      borderClass: "border-amber-200",
      label: "Perlu Verifikasi Lanjutan",
    };
  } else if (score >= 35) {
    return {
      category: "Tinggi",
      colorClass: "text-orange-800 font-semibold",
      bgClass: "bg-orange-50",
      borderClass: "border-orange-200",
      label: "Risiko Manipulasi Tinggi",
    };
  } else {
    return {
      category: "Kritis",
      colorClass: "text-rose-700 font-semibold",
      bgClass: "bg-rose-50",
      borderClass: "border-rose-200",
      label: "Indikasi Kuat Manipulasi / Deepfake",
    };
  }
}
