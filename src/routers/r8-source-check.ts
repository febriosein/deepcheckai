import { getGeminiClient } from "../lib/gemini";
import { getRouterConfig } from "../lib/router-config";
import { OcrClaimsResult, SourceCheckResult, SourceCheckSchema } from "../lib/schemas";
import { evaluateUrlDomain } from "../lib/domains";
import { AnalysisInput, RouterExecutionResult } from "./types";

const SYSTEM_INSTRUCTION = `Anda adalah Router 8 (Pemeriksaan Silang Sumber Resmi & Cek Fakta) pada sistem DeepCheck AI.
Tugas Anda:
1. Memverifikasi klaim-klaim faktual yang diekstrak terhadap pengetahuan referensi resmi dan terpercaya (seperti Kominfo, TurnBackHoax/Mafindo, Cek Fakta Media Nasional, Kementerian/Lembaga Negara).
2. Menentukan status verifikasi per klaim: "terverifikasi", "terbantahkan", "belum_dapat_diverifikasi", atau "sebagian_benar".
3. Menyertakan tautan/portal rujukan resmi yang kredibel dan dapat diakses (misal: https://turnbackhoax.id, https://kominfo.go.id, https://cekfakta.com, portal berita terverifikasi Dewan Pers).
4. Jika konten terbukti merupakan berita pers arus utama (Kompas, Detik, Tempo, Antara, dll) atau portal pemerintah (.go.id), tetapkan status "terverifikasi" secara objektif dan tegas.
5. Jika konten terbukti hoaks yang sudah diklarifikasi Mafindo/Kominfo atau memuat modus penipuan berulang, tetapkan status "terbantahkan".
6. Khusus konten tautan media sosial (TikTok, Instagram, YouTube, X): Periksa secara kritis terhadap pola video deepfake (seperti video pejabat membagikan bansos/uang tunai, kloning suara tokoh publik, gerak bibir hasil sintesis AI, serta daur ulang video bencana/kecelakaan lama). Jika narasi video menyerupai hoaks yang telah dibantah oleh Mafindo (TurnBackHoax) atau Kominfo, tetapkan status "terbantahkan" dengan menyertakan penjelasan perbandingan fakta dan rujukan resminya.

ATURAN KETAT PRODUK (WAJIB DIPATUHI):
- DILARANG mengidentifikasi individu secara personal dari wajah/suara.
- Analisis harus berbasis bukti rujukan faktual yang konkret.
- Format keluaran WAJIB berupa JSON valid yang mematuhi skema.`;

export async function runR8(
  input: AnalysisInput,
  ocrResult?: OcrClaimsResult
): Promise<RouterExecutionResult<SourceCheckResult>> {
  const startTime = Date.now();
  const config = getRouterConfig("R8");

  try {
    const ai = getGeminiClient();

    // Prepare claims list to check
    const claimsToCheck = ocrResult?.claims?.filter((c) => c.checkable) || [];
    const claimsText =
      claimsToCheck.length > 0
        ? claimsToCheck.map((c, i) => `${i + 1}. ${c.claim}`).join("\n")
        : input.text || (input.url ? `Klaim terkait URL: ${input.url}` : "Klaim umum terkait konteks visual yang disajikan.");

    let domainGuidance = "";
    if (input.url) {
      const domainInfo = evaluateUrlDomain(input.url);
      if (domainInfo.isKnownDomain) {
        domainGuidance = `\n[Info Domain Sumber]: Tautan berasal dari ${domainInfo.categoryName} (${domainInfo.domainName}). ${
          domainInfo.isCredibleMedia || domainInfo.isOfficialGovEdu
            ? "Domain ini adalah penerbit berita pers resmi atau portal pemerintah. Berikan status 'terverifikasi' bila konteks berita logis dan faktual."
            : domainInfo.isSocialMedia
            ? "Domain ini adalah platform media sosial (seperti TikTok/Instagram/YouTube/X). Konten di platform ini sangat rentan manipulasi deepfake, kloning suara AI, pencatutan nama pejabat, dan modus penipuan bansos. Cocokkan narasi dan klaim video dengan arsip klarifikasi Mafindo (TurnBackHoax), Kominfo Aduan Konten, dan Cek Fakta media kredibel."
            : ""
        }\n`;
      }
    }

    const promptText = `Lakukan verifikasi terhadap klaim-klaim berikut:${domainGuidance}
---
${claimsText}
---

Keluarkan JSON dengan skema:
{
  "verifiedClaims": [
    {
      "claim": "Pernyataan klaim yang diverifikasi",
      "status": "terverifikasi" | "terbantahkan" | "belum_dapat_diverifikasi" | "sebagian_benar",
      "sources": [
        {
          "title": "Nama Portal / Lembaga Rujukan (misal: Kominfo / TurnBackHoax / Cek Fakta Kompas)",
          "url": "https://url-portal-rujukan-resmi",
          "snippet": "Ringkasan temuan atau klarifikasi fakta resmi",
          "credibility": "resmi" | "media_terpercaya" | "komunitas" | "tidak_diketahui"
        }
      ],
      "explanation": "Penjelasan perbandingan fakta secara objektif"
    }
  ],
  "overallStatus": "mayoritas_terverifikasi" | "bercampur" | "mayoritas_terbantahkan" | "informasi_kurang"
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
    const validated = SourceCheckSchema.parse(parsed);

    return {
      routerId: "R8",
      name: config.name,
      success: true,
      data: validated,
      modelVersion: config.model || "gemini-flash-lite-latest",
      promptVersion: config.promptVersion || "1.0",
      processingTimeMs: Date.now() - startTime,
    };
  } catch (error: any) {
    const fallbackData: SourceCheckResult = {
      verifiedClaims: [
        {
          claim: "Klaim dalam verifikasi",
          status: "belum_dapat_diverifikasi",
          sources: [
            {
              title: "Portal TurnBackHoax - Mafindo",
              url: "https://turnbackhoax.id",
              snippet: "Disarankan memeriksa arsip klarifikasi fakta pada basis data Mafindo.",
              credibility: "komunitas",
            },
            {
              title: "Cek Fakta Nasional",
              url: "https://cekfakta.com",
              snippet: "Kolaborasi verifikasi fakta oleh media dan asosiasi jurnalis independen.",
              credibility: "media_terpercaya",
            },
          ],
          explanation: "Pemeriksaan otomatis memerlukan penelusuran lebih lanjut ke arsip pemeriksa fakta.",
        },
      ],
      overallStatus: "informasi_kurang",
    };

    return {
      routerId: "R8",
      name: config.name,
      success: true,
      data: fallbackData,
      error: error.message,
      modelVersion: config.model || "fallback",
      promptVersion: config.promptVersion || "1.0",
      processingTimeMs: Date.now() - startTime,
    };
  }
}
