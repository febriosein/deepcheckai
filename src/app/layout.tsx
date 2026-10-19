import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SuppressDevtools } from "./suppress-devtools";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DeepCheck AI — Verifikasi Media & Deteksi Deepfake",
  description:
    "Aplikasi verifikasi media berbasis AI untuk mahasiswa dengan analisis multi-jalur Gemini. Saring Sebelum Sharing.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon-64.png", sizes: "64x64", type: "image/png" },
      { url: "/logo-icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/logo-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#f8fafc",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased light`}
      style={{ colorScheme: "light" }}
    >
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              nextjs-portal,
              script[data-nextjs-dev-overlay],
              [data-nextjs-dev-overlay],
              [data-nextjs-toast],
              [data-nextjs-dialog-overlay],
              [data-nextjs-call-stack-frame] {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                pointer-events: none !important;
                width: 0 !important;
                height: 0 !important;
                position: absolute !important;
                top: -9999px !important;
                left: -9999px !important;
                z-index: -99999 !important;
              }
            `,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col font-sans text-slate-900 bg-slate-50 antialiased selection:bg-blue-600 selection:text-white pb-[env(safe-area-inset-bottom)]"
      >
        <SuppressDevtools />
        {children}
      </body>
    </html>
  );
}
