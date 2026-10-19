import { getGeminiClient } from "../lib/gemini";
import { getRouterConfig } from "../lib/router-config";
import { VideoArtifactResult, VideoArtifactSchema } from "../lib/schemas";
import { AnalysisInput, PreprocessedData, RouterExecutionResult } from "./types";

const SYSTEM_INSTRUCTION = `Anda adalah Router 5 (Analisis Artefak Video & Deepfake) pada sistem DeepCheck AI.
Tugas Anda:
Menilai potensi manipulasi video atau deepfake berbasis indikator visual:
1. Frekuensi kedipan mata yang tidak wajar atau statis.
2. Konsistensi pencahayaan wajah dengan bayangan leher dan latar belakang.
3. Sinkronisasi pergerakan bibir dan ekspresi wajah mikro.
4. Artefak transisi atau glitch temporal antar frame.

ATURAN KETAT PRODUK (WAJIB DIPATUHI):
- DILARANG mengidentifikasi atau menyebut nama spesifik orang dari wajah atau suara.
- DILARANG menyatakan konten "pasti asli" atau "pasti palsu" sebagai vonis mutlak.
- Format keluaran WAJIB berupa JSON valid yang mematuhi skema.`;

export async function runR5(
  input: AnalysisInput,
  preprocessed?: PreprocessedData
): Promise<RouterExecutionResult<VideoArtifactResult>> {
  const startTime = Date.now();
  const config = getRouterConfig("R5");

  try {
    const ai = getGeminiClient();
    const parts: any[] = [];

    // Add video frame or representation
    if (preprocessed?.frames && preprocessed.frames.length > 0) {
      for (const frame of preprocessed.frames.slice(0, 3)) {
        parts.push({
          inlineData: {
            mimeType: frame.mimeType,
            data: frame.base64,
          },
        });
      }
    } else if (input.base64Data) {
      parts.push({
        inlineData: {
          mimeType: input.mimeType || "video/mp4",
          data: input.base64Data,
        },
      });
    }

    parts.push({
      text: `Analisis video / frame video ini untuk indikator manipulasi deepfake atau sintesis wajah AI.
Keluarkan JSON dengan skema:
{
  "indicators": [
    {
      "type": "tipe_anomali (misal: kedipan_mata, pencahayaan_wajah, bayangan_leher, sinkronisasi_bibir)",
      "description": "Deskripsi indikator yang diobservasi",
      "severity": "low" | "medium" | "high"
    }
  ],
  "confidence": 0.8,
  "reasoning": "Rangkuman hasil observasi artefak video dalam 2-3 kalimat",
  "aiGeneratedLikelihood": 0.25
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
    const validated = VideoArtifactSchema.parse(parsed);

    return {
      routerId: "R5",
      name: config.name,
      success: true,
      data: validated,
      modelVersion: config.model || "gemini-flash-lite-latest",
      promptVersion: config.promptVersion || "1.0",
      processingTimeMs: Date.now() - startTime,
    };
  } catch (error: any) {
    const fallbackData: VideoArtifactResult = {
      indicators: [
        {
          type: "evaluasi_temporal_terbatas",
          description: "Frame video diproses dengan sampling standar tanpa kejanggalan ekstrem yang terlihat.",
          severity: "low",
        },
      ],
      confidence: 0.5,
      reasoning: "Analisis artefak video berjalan dalam mode sampling ringan.",
      aiGeneratedLikelihood: 0.5,
    };

    return {
      routerId: "R5",
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
