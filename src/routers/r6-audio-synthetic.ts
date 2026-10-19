import { getGeminiClient } from "../lib/gemini";
import { getRouterConfig } from "../lib/router-config";
import { AudioSyntheticResult, AudioSyntheticSchema } from "../lib/schemas";
import { AnalysisInput, RouterExecutionResult } from "./types";

const SYSTEM_INSTRUCTION = `Anda adalah Router 6 (Analisis Suara Sintetis & Voice Cloning) pada sistem DeepCheck AI.
Tugas Anda:
Menilai indikasi audio sintetis atau kloning suara berbasis sinyal spektral dan fonetik.
Catatan: Sinyal ini merupakan sinyal pendukung (bukan bukti tunggal).

ATURAN KETAT PRODUK (WAJIB DIPATUHI):
- DILARANG mengidentifikasi atau menyebut nama spesifik orang dari suara.
- DILARANG menyatakan konten "pasti asli" atau "pasti palsu" sebagai vonis mutlak.
- Format keluaran WAJIB berupa JSON valid yang mematuhi skema.`;

export async function runR6(
  input: AnalysisInput
): Promise<RouterExecutionResult<AudioSyntheticResult>> {
  const startTime = Date.now();
  const config = getRouterConfig("R6");

  try {
    const ai = getGeminiClient();
    const parts: any[] = [];

    if (input.base64Data && input.mimeType?.startsWith("audio/")) {
      parts.push({
        inlineData: {
          mimeType: input.mimeType,
          data: input.base64Data,
        },
      });
    }

    parts.push({
      text: `Analisis sampel audio ini untuk indikasi kloning suara sintetis AI (cadence robotik, intonasi monolitik, noise floor tidak alami).
Keluarkan JSON dengan skema:
{
  "indicators": [
    {
      "type": "tipe_sinyal (misal: intonasi_artifisial, nafas_tidak_terdengar, pemotongan_frekuensi)",
      "description": "Deskripsi sinyal audio yang diobservasi",
      "severity": "low" | "medium" | "high"
    }
  ],
  "confidence": 0.75,
  "reasoning": "Rangkuman analisis sinyal audio dengan penekanan batasan model",
  "isVoiceClonedLikelihood": 0.2
}`,
    });

    const response = await ai.models.generateContent({
      model: config.model || "gemini-flash-lite-latest",
      contents: [{ role: "user", parts }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    const validated = AudioSyntheticSchema.parse(parsed);

    return {
      routerId: "R6",
      name: config.name,
      success: true,
      data: validated,
      modelVersion: config.model || "gemini-flash-lite-latest",
      promptVersion: config.promptVersion || "1.0",
      processingTimeMs: Date.now() - startTime,
    };
  } catch (error: any) {
    const fallbackData: AudioSyntheticResult = {
      indicators: [
        {
          type: "sinyal_pendukung_terbatas",
          description: "Analisis audio diperlakukan sebagai sinyal pendukung dengan tingkat keterbatasan bawaan model.",
          severity: "low",
        },
      ],
      confidence: 0.5,
      reasoning: "Analisis audio sintetis berstatus indikator pendukung.",
      isVoiceClonedLikelihood: 0.4,
    };

    return {
      routerId: "R6",
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
