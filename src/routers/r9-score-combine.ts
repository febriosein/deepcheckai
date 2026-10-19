import { getGeminiClient } from "../lib/gemini";
import { getRouterConfig } from "../lib/router-config";
import { calculateAnchorScore } from "../lib/score-engine";
import {
  AudioSyntheticResult,
  FinalScoreResult,
  FinalScoreSchema,
  ImageArtifactResult,
  OcrClaimsResult,
  SourceCheckResult,
  TextNlpResult,
  VideoArtifactResult,
} from "../lib/schemas";
import { RouterExecutionResult } from "./types";

const SYSTEM_INSTRUCTION = `Anda adalah Router 9 (Penggabung Skor Probabilistik & Sintesis Bukti Forensik) pada DeepCheck AI.
Tugas Anda:
1. Menggabungkan seluruh sinyal analisis (OCR klaim, artefak visual/video/audio, teks NLP, dan cek fakta sumber resmi).
2. Menghasilkan skor keaslian probabilistik 0–100% yang KALIBRASINYA TEGAS, OBJEKTIF, dan AKURAT:
   - Konten berita asli / media pers terverifikasi Dewan Pers / portal resmi: Skor WAJIB tinggi di rentang 88–98% (Risiko Rendah).
   - Konten wajar / informasi umum yang konsisten: Skor di rentang 70–85% (Risiko Rendah/Sedang).
   - Konten meragukan / belum ada konfirmasi: Skor di rentang 40–65% (Risiko Sedang/Tinggi).
   - Konten terindikasi kuat manipulasi / deepfake / hoaks terbantahkan: Skor WAJIB rendah di rentang 5–25% (Risiko Kritis).
3. DILARANG memusatkan skor di tengah (50-75) hanya karena ragu-ragu jika konten secara nyata adalah berita asli terverifikasi atau hoaks terang-terangan.

4. MENJELASKAN ALASAN & HASIL ANALISIS SECARA MENDALAM DAN RINCI:
   - "reasoning" WAJIB diuraikan dalam minimal 3 paragraf lengkap dan berbobot:
     * Paragraf 1 (Ringkasan Kesimpulan): Menjelaskan kesimpulan umum tentang status verifikasi media/narasi dan alasan utama di balik penentuan skor.
     * Paragraf 2 (Rantai Bukti & Korelasi Faktual): Menjabarkan rincian fakta pendukung, temuan pencocokan ke portal cek fakta/pers, serta data spesifik pembanding.
     * Paragraf 3 (Evaluasi Retorika & Risiko Dampak): Menguraikan karakteristik bahasa, ada/tidaknya indikasi fearmongering/desakan waktu, serta risiko jika informasi ini disebarkan.

5. MENYAJIKAN 5 HINGGA 6 INDIKATOR FORENSIK LENGKAP:
   - "indicators" WAJIB memuat 5 sampai 6 temuan terperinci yang mencakup seluruh dimensi:
     1. "Integritas Sumber & Otoritas Domain"
     2. "Konsistensi Klaim Faktual"
     3. "Pola Bahasa & Retorika Emosional"
     4. "Forensik Visual & Integritas AI"
     5. "Konteks Kronologis & Jejak Peristiwa"
     6. "Risiko Rekayasa Sosial & Transaksional"

PRINSIP ETIS & ATURAN PRODUK:
- DILARANG menyertakan pengenalan identitas wajah/biometrik personal.
- Skor bersifat probabilistik terkalibrasi untuk memandu berpikir kritis mahasiswa.
- Format keluaran WAJIB berupa JSON valid yang mematuhi skema.`;

export interface R9InputBundle {
  routersUsed: string[];
  ocr?: OcrClaimsResult;
  imageArtifacts?: ImageArtifactResult;
  videoArtifacts?: VideoArtifactResult;
  audioSynthetic?: AudioSyntheticResult;
  textNlp?: TextNlpResult;
  sourceCheck?: SourceCheckResult;
  hasDegradedSignal: boolean;
  totalTimeMs: number;
  inputUrl?: string;
  mediaType?: string;
}

export async function runR9(
  bundle: R9InputBundle
): Promise<RouterExecutionResult<FinalScoreResult>> {
  const startTime = Date.now();
  const config = getRouterConfig("R9");

  // Deterministic Mathematical Calibration Anchor (media-type aware)
  const decision = calculateAnchorScore({
    routersUsed: bundle.routersUsed,
    ocr: bundle.ocr,
    imageArtifacts: bundle.imageArtifacts,
    videoArtifacts: bundle.videoArtifacts,
    audioSynthetic: bundle.audioSynthetic,
    textNlp: bundle.textNlp,
    sourceCheck: bundle.sourceCheck,
    inputUrl: bundle.inputUrl,
    mediaType: bundle.mediaType as any,
    hasDegradedSignal: bundle.hasDegradedSignal,
  });

  try {
    const ai = getGeminiClient();

    // Build adaptive indicator instructions based on media type
    const activeIndicators = decision.activeIndicators;
    const mediaTypeLabel =
      bundle.mediaType === "text"
        ? "Pesan Teks / Narasi"
        : bundle.mediaType === "url"
        ? "Tautan / URL Artikel"
        : bundle.mediaType === "image"
        ? "Gambar / Poster"
        : bundle.mediaType === "video"
        ? "Video"
        : bundle.mediaType === "audio"
        ? "Audio / Voice Note"
        : "Media Umum";
    const indicatorSpecsJson = activeIndicators.map((name, i) => `{
      "routerId": "${name.includes("Visual") || name.includes("AI") || name.includes("Kloning") ? "R4/R6" : name.includes("Bahasa") || name.includes("Atribusi") || name.includes("Kronologis") || name.includes("Rekayasa") ? "R7" : "R8"}",
      "name": "${name}",
      "finding": "Temuan forensik substantif yang mendalam sesuai ${mediaTypeLabel}",
      "impact": "positif" | "negatif" | "netral",
      "severity": "low" | "medium" | "high"
    }`);

    const summaryPayload = {
      routersEvaluated: bundle.routersUsed,
      hasDegradedSignal: bundle.hasDegradedSignal,
      mediaInputType: bundle.mediaType || "text",
      calibratedAnchor: {
        score: decision.anchorScore,
        targetRange: [decision.scoreMin, decision.scoreMax],
        recommendedCategory: decision.recommendedRiskCategory,
        verdictType: decision.verdictType,
        breakdown: decision.breakdown,
      },
      data: {
        ocr: bundle.ocr
          ? {
              claimsCount: bundle.ocr.claims.length,
              claimsSample: bundle.ocr.claims.slice(0, 3),
            }
          : undefined,
        imageArtifacts: bundle.imageArtifacts
          ? {
              indicators: bundle.imageArtifacts.indicators,
              aiLikelihood: bundle.imageArtifacts.aiGeneratedLikelihood,
              confidence: bundle.imageArtifacts.confidence,
            }
          : undefined,
        videoArtifacts: bundle.videoArtifacts
          ? {
              indicators: bundle.videoArtifacts.indicators,
              aiLikelihood: bundle.videoArtifacts.aiGeneratedLikelihood,
            }
          : undefined,
        audioSynthetic: bundle.audioSynthetic
          ? {
              indicators: bundle.audioSynthetic.indicators,
              voiceCloneLikelihood: bundle.audioSynthetic.isVoiceClonedLikelihood,
            }
          : undefined,
        textNlp: bundle.textNlp
          ? {
              provocative: bundle.textNlp.provocativeLanguage,
              sentiment: bundle.textNlp.sentiment,
              hoaxPatterns: bundle.textNlp.hoaxPatterns,
              manipulationLikelihood: bundle.textNlp.manipulationLikelihood,
            }
          : undefined,
        sourceCheck: bundle.sourceCheck
          ? {
              overallStatus: bundle.sourceCheck.overallStatus,
              verifiedClaims: bundle.sourceCheck.verifiedClaims.map((c) => ({
                claim: c.claim,
                status: c.status,
                sources: c.sources,
              })),
            }
          : undefined,
      },
    };

    const promptText = `Evaluasi seluruh sinyal bukti berikut dan susun kartu hasil verifikasi terpadu yang mendalam dan komprehensif:
${JSON.stringify(summaryPayload, null, 2)}

PANDUAN KALIBRASI AKURASI SKOR:
- Skor Acuan Terkalibrasi (S_anchor): ${decision.anchorScore}%
- Rentang Nilai Target: [${decision.scoreMin}% s/d ${decision.scoreMax}%]
- Rekomendasi Kategori Risiko: "${decision.recommendedRiskCategory}"
- Tipe Kesimpulan: ${decision.verdictType}
- Catatan Kunci: ${decision.primaryReason}

INSTRUKSI DETAIL:
1. "score": Tetapkan nilai di dalam rentang target [${decision.scoreMin} - ${decision.scoreMax}] secara presisi.
2. "riskCategory": Tetapkan menjadi "${decision.recommendedRiskCategory}".
3. "headline": 1 kalimat kesimpulan yang tegas dan tajam.
4. "reasoning": Tuliskan penjelasan rinci dan berbobot dalam 3 paragraf terpisah yang dipisahkan baris baru (\\n\\n):
   - Paragraf 1: Ringkasan Status & Kesimpulan Eksekutif.
   - Paragraf 2: Analisis Rantai Bukti & Keselarasan Faktual.
   - Paragraf 3: Evaluasi Pola Bahasa, Rekayasa Sosial, dan Konteks Risiko.
5. "indicators": Tampilkan HANYA indikator yang RELEVAN SENGERTIWA dengan jenis media input (${mediaTypeLabel}). DILARANG menampilkan indikator forensik yang tidak relevan (contoh: jangan tampilkan indikator visual pada input teks). Sajikan tepat ${activeIndicators.length} indikator berikut dengan temuan ("finding") yang sangat substantif dan mendalam.
DAFTAR INDIKATOR FORENSIK PANDUAN (sajikan hanya indikator berikut, sesuai media input ${mediaTypeLabel}):
${indicatorSpecsJson.join(",\n")}

Keluarkan JSON dengan skema berikut (salin nama indikator dari daftar panduan di atas):
{
  "score": ${decision.anchorScore},
  "riskCategory": "${decision.recommendedRiskCategory}",
  "headline": "Ringkasan kesimpulan dalam 1 kalimat singkat dan jelas",
  "reasoning": "Ringkasan Kesimpulan Eksekutif...\\n\\nAnalisis Rantai Bukti & Korelasi Fakta...\\n\\nEvaluasi Retorika & Risiko Dampak...",
  "indicators": [ ...salin persis ${activeIndicators.length} indikator dari DAFTAR INDIKATOR FORENSIK PANDUAN di atas, masing-masing mengisi "finding" dengan analisis substantif mendalam... ],
  "sources": [
    {
      "title": "Nama Portal Rujukan Resmi",
      "url": "https://url-portal-resmi",
      "snippet": "Kutipan penjelasan singkat fakta",
      "status": "Terverifikasi / Klarifikasi"
    }
  ],
  "literacyTip": {
    "title": "Literasi 60 Detik: Saring Sebelum Sharing",
    "tips": [
      "Periksa kembali tanggal dan konteks asli peristiwa",
      "Bandingkan dengan setidaknya 2 media arus utama terverifikasi Dewan Pers",
      "Waspadai pesan yang memicu kepanikan atau meminta forward segera"
    ],
    "actionSuggestion": "Tahan diri untuk tidak membagikan konten ini ke grup chat sebelum ada konfirmasi resmi."
  },
  "disclaimer": "Skor ini adalah indikator probabilistik berbasis kecerdasan buatan untuk membantu berpikir kritis, bukan merupakan vonis kebenaran mutlak. Keputusan akhir tetap berada di tangan Anda sebagai pengguna yang bijak.",
  "metadata": {
    "routersUsed": ${JSON.stringify(bundle.routersUsed)},
    "modelVersion": "${config.model || "gemini-flash-lite-latest"}",
    "promptVersion": "${config.promptVersion || "2.1"}",
    "processingTimeMs": ${bundle.totalTimeMs},
    "hasDegradedSignal": ${bundle.hasDegradedSignal}
  }
}`;

    const response = await ai.models.generateContent({
      model: config.model || "gemini-flash-lite-latest",
      contents: [{ role: "user", parts: [{ text: promptText }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");

    // Strictly enforce calibration boundaries to prevent regression to the center
    let finalScore = Number(parsed.score);
    if (isNaN(finalScore)) {
      finalScore = decision.anchorScore;
    } else {
      finalScore = Math.max(decision.scoreMin, Math.min(decision.scoreMax, Math.round(finalScore)));
    }
    parsed.score = finalScore;

    // Harmonize risk category with calibrated score
    parsed.riskCategory =
      finalScore >= 80 ? "rendah" : finalScore >= 60 ? "sedang" : finalScore >= 35 ? "tinggi" : "kritis";

    if (!parsed.headline || parsed.headline.length < 5) {
      parsed.headline = decision.primaryReason;
    }

    // Ensure metadata values are preserved correctly
    parsed.metadata = {
      routersUsed: bundle.routersUsed,
      modelVersion: config.model || "gemini-flash-lite-latest",
      promptVersion: config.promptVersion || "2.1",
      processingTimeMs: bundle.totalTimeMs,
      hasDegradedSignal: bundle.hasDegradedSignal,
    };

    const validated = FinalScoreSchema.parse(parsed);

    return {
      routerId: "R9",
      name: config.name,
      success: true,
      data: validated,
      modelVersion: config.model || "gemini-flash-lite-latest",
      promptVersion: config.promptVersion || "2.1",
      processingTimeMs: Date.now() - startTime,
    };
  } catch (error: any) {
    // Deterministic algorithmic fallback with 6 comprehensive indicators and rich explanation
    const isAuthentic = decision.anchorScore >= 80;
    const isHoax = decision.anchorScore <= 35;

    const fallbackIndicators = [
      {
        routerId: "R8",
        name: "Integritas Sumber & Otoritas Domain",
        finding:
          bundle.inputUrl && decision.breakdown.domainBonus > 0
            ? "Tautan berasal dari penerbit pers nasional terverifikasi atau domain instansi pemerintah resmi."
            : isHoax
            ? "Informasi disebarkan melalui kanal tidak resmi/pesan berantai tanpa domain induk yang dapat diverifikasi."
            : "Sumber merupakan portal publik umum yang belum tercatat pada daftar pers bersertifikasi.",
        impact: isAuthentic ? "positif" : isHoax ? "negatif" : "netral",
        severity: isHoax ? "high" : "low",
      },
      {
        routerId: "R8",
        name: "Konsistensi Klaim Faktual",
        finding: isAuthentic
          ? "Klaim dan substansi narasi selaras dengan fakta yang dipublikasikan secara terbuka dan tidak memiliki riwayat bantahan."
          : isHoax
          ? "Isi klaim bertentangan langsung dengan klarifikasi otoritatif dan arsip cek fakta Mafindo/Kominfo."
          : "Klaim belum tercatat dalam arsip klarifikasi fakta sehingga memerlukan verifikasi mandiri.",
        impact: isAuthentic ? "positif" : isHoax ? "negatif" : "netral",
        severity: isHoax ? "high" : "medium",
      },
      {
        routerId: "R7",
        name: "Pola Bahasa & Retorika Emosional",
        finding: isHoax
          ? "Terdeteksi pola khas hoaks seperti urgensi palsu, ancaman sanksi fiktif, atau manipulasi emosi pembaca."
          : "Gaya penulisin tergolong netral, faktual, dan tidak mengandung provokasi atau kepanikan.",
        impact: isHoax ? "negatif" : "positif",
        severity: isHoax ? "high" : "low",
      },
      {
        routerId: "R4",
        name: "Forensik Visual & Integritas AI",
        finding:
          bundle.imageArtifacts && bundle.imageArtifacts.aiGeneratedLikelihood > 0.6
            ? "Pemeriksaan visual mendeteksi ketidaksesuaian difusi piksel dan artefak khas model generatif AI."
            : "Media visual dan audio tidak menunjukkan tanda-tanda manipulasi deepfake atau kloning sintetis.",
        impact:
          bundle.imageArtifacts && bundle.imageArtifacts.aiGeneratedLikelihood > 0.6
            ? "negatif"
            : "positif",
        severity:
          bundle.imageArtifacts && bundle.imageArtifacts.aiGeneratedLikelihood > 0.6
            ? "high"
            : "low",
      },
      {
        routerId: "R7",
        name: "Konteks Kronologis & Jejak Peristiwa",
        finding: isAuthentic
          ? "Linimasa waktu dan latar belakang peristiwa konsisten dengan rekaman kejadian terkini."
          : "Disarankan memastikan konteks waktu agar tidak terkecoh daur ulang peristiwa lama.",
        impact: isAuthentic ? "positif" : "netral",
        severity: "low",
      },
      {
        routerId: "R7",
        name: "Risiko Rekayasa Sosial & Transaksional",
        finding: isHoax
          ? "Terdeteksi indikator rekayasa sosial berupa iming-iming hadiah, permintaan transfer dana, atau klaim bantuan fiktif."
          : "Tidak ditemukan permintaan data sensitif, transfer perbankan, atau nomor kontak mencurigakan.",
        impact: isHoax ? "negatif" : "positif",
        severity: isHoax ? "high" : "low",
      },
    ];

    const fallbackReasoning = isAuthentic
      ? `Ringkasan Kesimpulan Eksekutif: Konten ini telah diverifikasi dan memiliki tingkat keaslian tinggi (${decision.anchorScore}%) dengan kategori Risiko Rendah. Informasi bersumber dari kanal yang kredibel dan dapat dipertanggungjawabkan.\n\nAnalisis Rantai Bukti & Keselarasan Faktual: Narasi yang disampaikan selaras dengan data terbuka dan konsensus pelaporan resmi. Tidak ditemukan catatan sanggahan atau bantahan pada basis data pemeriksa fakta nasional.\n\nEvaluasi Pola Bahasa & Keamanan: Struktur teks menggunakan kaidah jurnalistik objektif tanpa ada unsur provokasi, desakan waktu palsu, maupun indikasi rekayasa digital manipulatif.`
      : isHoax
      ? `Ringkasan Kesimpulan Eksekutif: Konten ini terindikasi kuat sebagai hoaks atau disinformasi (${decision.anchorScore}%) dengan tingkat Risiko Kritis. Ditemukan anomali signifikan pada substansi pesan dan asal-usul informasi.\n\nAnalisis Rantai Bukti & Keselarasan Faktual: Narasi dalam konten ini bertentangan dengan fakta resmi dan menunjukkan kemiripan dengan pola penipuan/hoaks berulang yang telah diklarifikasi oleh Mafindo dan Kominfo.\n\nEvaluasi Pola Bahasa & Keamanan: Pesan menggunakan teknik rekayasa sosial (urgensi palsu, ancaman, atau iming-iming) untuk memicu kepanikan dan menekan korban agar segera bertindak tanpa berpikir kritis.`
      : `Ringkasan Kesimpulan Eksekutif: Konten ini memperoleh skor keaslian ${decision.anchorScore}% dalam kategori Risiko ${decision.recommendedRiskCategory}. Informasi memerlukan verifikasi tambahan sebelum disebarluaskan.\n\nAnalisis Rantai Bukti & Keselarasan Faktual: Data pendukung belum sepenuhnya mencukupi untuk memvalidasi seluruh klaim, meskipun belum ditemukan indikasi bantahan resmi.\n\nEvaluasi Pola Bahasa & Keamanan: Karakteristik teks berada dalam batas wajar, namun pengguna disarankan tetap merujuk pada sumber primer terpercaya.`;

    const fallbackResult: FinalScoreResult = {
      score: decision.anchorScore,
      riskCategory: decision.recommendedRiskCategory,
      headline: decision.primaryReason,
      reasoning: fallbackReasoning,
      indicators: fallbackIndicators as any,
      sources: [
        {
          title: "Portal TurnBackHoax - Mafindo",
          url: "https://turnbackhoax.id",
          snippet: "Basis data arsip rujukan cek fakta independen Indonesia.",
          status: "Rujukan Terbuka",
        },
      ],
      literacyTip: {
        title: "Literasi 60 Detik: Saring Sebelum Sharing",
        tips: [
          "Cek sumber resmi yang memiliki kredibilitas teruji.",
          "Cermati apakah narasi memuat desakan atau ancaman palsu.",
          "Tahan untuk tidak meneruskan jika belum yakin 100%.",
        ],
        actionSuggestion: "Tahan sebar dan selalu verifikasi ke sumber primer.",
      },
      disclaimer:
        "Skor ini adalah indikator probabilistik yang membantu berpikir, bukan vonis mutlak; keputusan akhir tetap di tangan manusia.",
      metadata: {
        routersUsed: bundle.routersUsed,
        modelVersion: config.model || "calibrated-anchor-fallback",
        promptVersion: config.promptVersion || "2.1",
        processingTimeMs: bundle.totalTimeMs,
        hasDegradedSignal: true,
      },
    };

    return {
      routerId: "R9",
      name: config.name,
      success: true,
      data: fallbackResult,
      error: error.message,
      modelVersion: config.model || "fallback",
      promptVersion: config.promptVersion || "2.1",
      processingTimeMs: Date.now() - startTime,
    };
  }
}
