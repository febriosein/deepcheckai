import { getGeminiClient } from "../lib/gemini";
import { getRouterConfig } from "../lib/router-config";
import { ImageArtifactResult, ImageArtifactSchema } from "../lib/schemas";
import { AnalysisInput, RouterExecutionResult } from "./types";

const SYSTEM_INSTRUCTION = `Anda adalah Router 4 (Analisis Artefak Visual Gambar) pada sistem DeepCheck AI.
Tugas Anda:
Menilai anomali visual dan indikator sintesis generatif AI pada gambar:
1. Anomali piksel, distorsi tepi objek, blur selektif tidak wajar.
2. Ketidaksesuaian pencahayaan, bayangan, refleksi mata atau permukaan.
3. Tekstur kulit/rambut yang terlalu halus atau pola repetitif khas model generatif.
4. Latar belakang yang melengkung atau artefak geometri tidak wajar.

ATURAN KETAT PRODUK (WAJIB DIPATUHI):
- DILARANG mengidentifikasi atau menyebut nama spesifik orang dari wajah atau suara.
- DILARANG menyatakan konten "pasti asli" atau "pasti palsu" sebagai vonis mutlak. Gunakan istilah probabilistik ("indikasi", "kemungkinan", "tidak terdeteksi kejanggalan signifikan").
- Format keluaran WAJIB berupa JSON valid yang mematuhi skema.`;

export async function runR4(
  input: AnalysisInput
): Promise<RouterExecutionResult<ImageArtifactResult>> {
  const startTime = Date.now();
  const config = getRouterConfig("R4");

  try {
    const ai = getGeminiClient();
    const parts: any[] = [];

    if (input.base64Data && input.mimeType?.startsWith("image/")) {
      parts.push({
        inlineData: {
          mimeType: input.mimeType,
          data: input.base64Data,
        },
      });
    }

    parts.push({
      text: `Analisis gambar ini untuk indikator manipulasi digital atau kecerdasan buatan (AI generatif).
Keluarkan JSON dengan skema:
{
  "indicators": [
    {
      "type": "tipe_indikator (misal: pencahayaan, tekstur_kulit, distorsi_latar, artefak_kompresi)",
      "description": "Deskripsi objektif apa yang terlihat pada gambar",
      "severity": "low" | "medium" | "high"
    }
  ],
  "confidence": 0.85,
  "reasoning": "Rangkuman evaluasi visual dalam 2-3 kalimat objektif",
  "aiGeneratedLikelihood": 0.2
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
    const validated = ImageArtifactSchema.parse(parsed);

    return {
      routerId: "R4",
      name: config.name,
      success: true,
      data: validated,
      modelVersion: config.model || "gemini-flash-lite-latest",
      promptVersion: config.promptVersion || "1.0",
      processingTimeMs: Date.now() - startTime,
    };
  } catch (error: any) {
    const fallbackData: ImageArtifactResult = {
      indicators: [
        {
          type: "evaluasi_terbatas",
          description: "Tidak dapat melakukan ekstraksi artefak visual mendalam pada media ini.",
          severity: "low",
        },
      ],
      confidence: 0.5,
      reasoning: "Analisis artefak gambar dialihkan ke mode evaluasi terbatas.",
      aiGeneratedLikelihood: 0.5,
    };

    return {
      routerId: "R4",
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
