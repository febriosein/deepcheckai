"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Link as LinkIcon,
  UploadCloud,
  FileText,
  AlertCircle,
  ArrowRight,
  X,
  FileCheck2,
  ScanLine,
} from "lucide-react";

export interface MediaInputSubmitData {
  type: "url" | "image" | "video" | "audio" | "text";
  url?: string;
  file?: File;
  text?: string;
}

interface MediaInputProps {
  onSubmit: (data: MediaInputSubmitData) => void;
  isLoading: boolean;
}

export function MediaInput({ onSubmit, isLoading }: MediaInputProps) {
  const [activeTab, setActiveTab] = useState<"url" | "upload" | "text">("url");
  const [urlInput, setUrlInput] = useState("");
  const [textInput, setTextInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    setErrorMessage(null);

    const isImage = file.type.startsWith("image/");
    const isVideoOrAudio =
      file.type.startsWith("video/") || file.type.startsWith("audio/");

    // Check payload limits for Serverless / Vercel (4.5 MB gateway limit)
    if (isVideoOrAudio && file.size > 4.5 * 1024 * 1024) {
      setErrorMessage(
        "File video/audio melebihi batas 4.5 MB untuk unggah langsung di Vercel. Untuk video atau audio berukuran besar, silakan salin tautannya (Instagram, TikTok, YouTube) dan periksa melalui tab 'Tautan Media'."
      );
      return;
    }

    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "video/mp4",
      "video/webm",
      "audio/mpeg",
      "audio/wav",
      "audio/mp3",
    ];

    if (!validTypes.some((t) => file.type.startsWith(t.split("/")[0]))) {
      setErrorMessage(
        "Format file tidak didukung. Harap gunakan Gambar (JPG/PNG/WEBP), Video (MP4/WEBM), atau Audio (MP3/WAV)."
      );
      return;
    }

    // Auto-compress large images if above 3.5 MB so they never hit Vercel payload limits
    if (isImage && file.size > 3.5 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let { width, height } = img;
          const maxDim = 1920;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });
                setSelectedFile(compressedFile);
                setFilePreview(canvas.toDataURL("image/jpeg", 0.85));
              } else {
                setSelectedFile(file);
                setFilePreview(e.target?.result as string);
              }
            },
            "image/jpeg",
            0.85
          );
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
      return;
    }

    setSelectedFile(file);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (activeTab === "url") {
      if (!urlInput.trim()) {
        setErrorMessage("Harap masukkan tautan (URL) yang ingin diperiksa.");
        return;
      }
      try {
        new URL(urlInput.trim());
      } catch {
        setErrorMessage("Format URL tidak valid. Contoh: https://berita.com/artikel");
        return;
      }
      onSubmit({
        type: "url",
        url: urlInput.trim(),
        text: textInput.trim() || undefined,
      });
    } else if (activeTab === "upload") {
      if (!selectedFile) {
        setErrorMessage("Harap pilih atau tarik file gambar/video/audio terlebih dahulu.");
        return;
      }
      let mediaType: "image" | "video" | "audio" = "image";
      if (selectedFile.type.startsWith("video/")) mediaType = "video";
      else if (selectedFile.type.startsWith("audio/")) mediaType = "audio";

      onSubmit({
        type: mediaType,
        file: selectedFile,
        text: textInput.trim() || undefined,
      });
    } else if (activeTab === "text") {
      if (!textInput.trim() || textInput.trim().length < 10) {
        setErrorMessage("Teks narasi minimal 10 karakter untuk dianalisis pola hoaksnya.");
        return;
      }
      onSubmit({ type: "text", text: textInput.trim() });
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200/90 shadow-elevated p-4 sm:p-7 text-left max-w-3xl mx-auto backdrop-blur-sm space-y-5">
      {/* Segmented Tab Navigation */}
      <div className="flex items-center p-1 bg-slate-100 rounded-xl max-w-md mx-auto mb-4 sm:mb-6 border border-slate-200/60" role="tablist">
        <button
          type="button"
          onClick={() => {
            setActiveTab("url");
            setErrorMessage(null);
          }}
          className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${activeTab === "url"
            ? "bg-white text-blue-700 shadow-sm"
            : "text-slate-600 hover:text-slate-900 font-medium"
            }`}
        >
          <LinkIcon className={`w-3.5 h-3.5 ${activeTab === "url" ? "text-blue-600" : "text-slate-400"}`} />
          <span>Tautan / URL</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("upload");
            setErrorMessage(null);
          }}
          className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${activeTab === "upload"
            ? "bg-white text-blue-700 shadow-sm"
            : "text-slate-600 hover:text-slate-900 font-medium"
            }`}
        >
          <UploadCloud className={`w-3.5 h-3.5 ${activeTab === "upload" ? "text-blue-600" : "text-slate-400"}`} />
          <span>Unggah<span className="hidden sm:inline"> Media</span></span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("text");
            setErrorMessage(null);
          }}
          className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${activeTab === "text"
            ? "bg-white text-blue-700 shadow-sm"
            : "text-slate-600 hover:text-slate-900 font-medium"
            }`}
        >
          <FileText className={`w-3.5 h-3.5 ${activeTab === "text" ? "text-blue-600" : "text-slate-400"}`} />
          <span>Pesan / Teks</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <AnimatePresence mode="wait">
          {/* TAB 1: URL */}
          {activeTab === "url" && (
            <motion.div
              key="url"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16 }}
              className="space-y-3 sm:space-y-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs sm:text-sm font-semibold text-slate-800">
                    Tempel URL Berita, Video TikTok, Instagram Reel, atau YouTube
                  </label>
                </div>

                {/* Mobile Platform Badges */}
                <div className="flex sm:hidden items-center gap-1 overflow-x-auto hide-scrollbar pb-1">
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                    TikTok
                  </span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                    Instagram
                  </span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                    YouTube
                  </span>
                  <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                    Media Pers
                  </span>
                </div>

                {/* Input field container */}
                <div className="relative rounded-xl shadow-xs">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <LinkIcon className="h-4.5 w-4.5 text-slate-400" />
                  </span>
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://..."
                    disabled={isLoading}
                    className="block w-full pl-10 pr-24 py-3 sm:py-3.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900 font-mono tracking-tight transition-colors"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const text = await navigator.clipboard.readText();
                        if (text) {
                          setUrlInput(text.trim());
                          setErrorMessage(null);
                        }
                      } catch { }
                    }}
                    className="absolute inset-y-1.5 right-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-semibold transition-colors flex items-center cursor-pointer"
                  >
                    Tempel
                  </button>
                </div>
              </div>

              {/* Additional Context Input */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                  Konteks atau Narasi Tambahan dari Pengunggah (Opsional):
                </label>
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  disabled={isLoading}
                  placeholder="Masukkan konteks disini"
                  className="block w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </motion.div>
          )}

          {/* TAB 2: UPLOAD */}
          {activeTab === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16 }}
              className="space-y-3 sm:space-y-4"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
                accept="image/*,video/mp4,video/webm,audio/*"
                className="hidden"
              />

              {!selectedFile ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center rounded-xl sm:rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center cursor-pointer transition-all ${isDragging
                    ? "border-blue-500 bg-blue-50/70"
                    : "border-slate-200/90 bg-slate-50/60 hover:bg-slate-50 hover:border-blue-300"
                    }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-100/80 text-blue-600 flex items-center justify-center mb-2.5">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-slate-800">
                    Pilih foto, rekaman video, atau rekaman suara
                  </p>
                  <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
                    Mendukung JPG, PNG, WEBP, MP4, MP3, WAV (Maks. 4.5 MB atau gunakan tab Tautan untuk video)
                  </p>
                </div>
              ) : (
                <div className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-blue-200 bg-blue-50/40 p-3.5 sm:p-4 shadow-xs">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 overflow-hidden min-w-0">
                      {filePreview ? (
                        <div className="relative h-14 w-14 shrink-0 rounded-xl overflow-hidden border border-slate-200 shadow-2xs">
                          <img
                            src={filePreview}
                            alt="Pratinjau"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                          <FileCheck2 className="w-7 h-7" />
                        </div>
                      )}
                      <div className="overflow-hidden min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {selectedFile.name}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Siap diperiksa
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={clearSelectedFile}
                      disabled={isLoading}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Optional caption for upload */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                  Konteks atau Narasi Tambahan (Opsional):
                </label>
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  disabled={isLoading}
                  placeholder="Masukkan konteks konten disini"
                  className="block w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
                />
              </div>
            </motion.div>
          )}

          {/* TAB 3: TEXT */}
          {activeTab === "text" && (
            <motion.div
              key="text"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16 }}
              className="space-y-2"
            >
              <label className="text-xs sm:text-sm font-semibold text-slate-800 block">
                Salin &amp; Tempel Pesan Berantai atau Teks Narasi
              </label>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                disabled={isLoading}
                rows={4}
                placeholder="Contoh: 'Hati-hati! Besok seluruh rekening beasiswa akan diblokir jika tidak segera transfer dana verifikasi Rp 500.000...'"
                className="w-full text-xs sm:text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-3.5 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500 resize-none placeholder:text-slate-400 transition-colors leading-relaxed"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Notification */}
        {errorMessage && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 shadow-2xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="font-medium text-xs">{errorMessage}</span>
          </div>
        )}

        {/* Submit CTA Button */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-600/30 btn-bounce focus:outline-none focus:ring-2 focus:ring-blue-500 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Menganalisis Media...</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span>Verifikasi Keaslian</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.2"
                  />
                </svg>
              </span>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
