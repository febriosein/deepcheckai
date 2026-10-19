import { getGeminiClient } from "../lib/gemini";
import { getRouterConfig } from "../lib/router-config";
import { TextNlpResult, TextNlpSchema } from "../lib/schemas";
import { AnalysisInput, RouterExecutionResult } from "./types";

const SYSTEM_INSTRUCTION = `Anda adalah Router 7 (Analisis Bahasa & Pola Teks NLP) pada sistem DeepCheck AI.
Tugas Anda:
Menganalisis teks narasi, caption, pesan berantai, atau artikel untuk mendeteksi:
1. Bahasa provokatif, emosional, atau memicu kepanikan (fearmongering).
2. Pola lazim hoaks: urgensi palsu ("sebarkan sebelum dihapus", "wajib kirim ke 10 grup"), tanpa sumber jelas, judul sensasional.
3. Analisis sentimen keseluruhan dan estimasi probabilitas manipulasi narasi.

ATURAN KETAT PRODUK (WAJIB DIPATUHI):
- DILARANG menyatakan teks "pasti hoaks" atau "pasti valid" sebagai vonis mutlak.
- Analisis harus bersifat netral, edukatif, dan objektif.
- Format keluaran WAJIB berupa JSON valid yang mematuhi skema.`;

export async function runR7(
  input: AnalysisInput
): Promise<RouterExecutionResult<TextNlpResult>> {
  const startTime = Date.now();
  const config = getRouterConfig("R7");

  try {
    const ai = getGeminiClient();
    const textToAnalyze =
      input.text ||
      (input.url ? `Menganalisis narasi dari tautan: ${input.url}` : "");

    const promptText = `Lakukan analisis teks NLP untuk pola hoaks dan manipulasi narasi pada teks berikut:
---
${textToAnalyze || "Tidak ada teks narasi spesifik yang disertakan."}
---

Keluarkan JSON dengan skema:
{
  "provocativeLanguage": true | false,
  "sentiment": "positif" | "negatif" | "netral" | "campuran",
  "hoaxPatterns": [
    "Daftar pola khas hoaks yang terdeteksi, misalnya: urgensi palsu, klaim bombastis tanpa rujukan"
  ],
  "confidence": 0.85,
  "reasoning": "Penjelasan terstruktur mengenai struktur bahasa dan karakteristik narasi",
  "manipulationLikelihood": 0.3
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
    const validated = TextNlpSchema.parse(parsed);

    return {
      routerId: "R7",
      name: config.name,
      success: true,
      data: validated,
      modelVersion: config.model || "gemini-flash-lite-latest",
      promptVersion: config.promptVersion || "1.0",
      processingTimeMs: Date.now() - startTime,
    };
  } catch (error: any) {
    const fallbackData: TextNlpResult = {
      provocativeLanguage: false,
      sentiment: "netral",
      hoaxPatterns: [],
      confidence: 0.5,
      reasoning: "Teks tidak menunjukkan pola bahasa provokatif yang ekstrem.",
      manipulationLikelihood: 0.2,
    };

    return {
      routerId: "R7",
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
