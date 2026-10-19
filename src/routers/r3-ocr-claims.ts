import { getGeminiClient } from "../lib/gemini";
import { getRouterConfig } from "../lib/router-config";
import { OcrClaimsResult, OcrClaimsSchema } from "../lib/schemas";
import { AnalysisInput, PreprocessedData, RouterExecutionResult } from "./types";

const SYSTEM_INSTRUCTION = `Anda adalah Router 3 (OCR & Ekstraksi Klaim Faktual) pada sistem DeepCheck AI.
Tugas Anda:
1. Membaca teks yang terlihat pada gambar, poster, tangkapan layar, atau dokumen.
2. Mengekstrak klaim-klaim penting yang dapat diuji/diverifikasi kebenarannya (checkable claims).
3. Tandai setiap klaim apakah checkable (true/false) dan beri konteks singkat.

ATURAN KETAT PRODUK (WAJIB DIPATUHI):
- DILARANG mengidentifikasi atau menyebut nama spesifik orang dari wajah atau suara.
- DILARANG menyatakan konten "pasti asli" atau "pasti palsu" sebagai vonis mutlak.
- Format keluaran WAJIB berupa JSON valid yang mematuhi skema yang ditentukan.`;

export async function runR3(
  input: AnalysisInput,
  preprocessed?: PreprocessedData
): Promise<RouterExecutionResult<OcrClaimsResult>> {
  const startTime = Date.now();
  const config = getRouterConfig("R3");

  try {
    const ai = getGeminiClient();
    const parts: any[] = [];

    // Add multimodal image if present
    if (input.base64Data && input.mimeType?.startsWith("image/")) {
      parts.push({
        inlineData: {
          mimeType: input.mimeType,
          data: input.base64Data,
        },
      });
    } else if (preprocessed?.frames?.[0]?.base64) {
      parts.push({
        inlineData: {
          mimeType: preprocessed.frames[0].mimeType,
          data: preprocessed.frames[0].base64,
        },
      });
    }

    // Add prompt instructions
    const textContext =
      input.text ||
      preprocessed?.extractedText ||
      (input.url ? `URL: ${input.url}` : "");

    parts.push({
      text: `Lakukan OCR dan ekstraksi klaim faktual.
Konteks teks tambahan: ${textContext || "Tidak ada, fokus pada gambar"}

Keluarkan JSON dengan skema:
{
  "extractedText": "Teks lengkap yang terbaca dari media...",
  "claims": [
    {
      "claim": "Klaim spesifik yang bisa dicek...",
      "checkable": true,
      "context": "Konteks di mana klaim disebutkan"
    }
  ],
  "confidence": 0.85
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
    const validated = OcrClaimsSchema.parse(parsed);

    return {
      routerId: "R3",
      name: config.name,
      success: true,
      data: validated,
      modelVersion: config.model || "gemini-flash-lite-latest",
      promptVersion: config.promptVersion || "1.0",
      processingTimeMs: Date.now() - startTime,
    };
  } catch (error: any) {
    // Graceful fallback with usable structure
    const fallbackText = input.text || (input.url ? `Klaim dari tautan ${input.url}` : "");
    const fallbackData: OcrClaimsResult = {
      extractedText: fallbackText || "Teks tidak terdeteksi atau media murni visual.",
      claims: fallbackText
        ? [{ claim: fallbackText.slice(0, 150), checkable: true, context: "Input pengguna" }]
        : [],
      confidence: 0.5,
    };

    return {
      routerId: "R3",
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
