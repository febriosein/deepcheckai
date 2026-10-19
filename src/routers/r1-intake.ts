import { getGeminiClient } from "../lib/gemini";
import { getRouterConfig } from "../lib/router-config";
import { IntakeResult, IntakeResultSchema } from "../lib/schemas";
import { evaluateUrlDomain } from "../lib/domains";
import { resolveUrlContent } from "../lib/url-resolver";
import { AnalysisInput, RouterExecutionResult } from "./types";

const SYSTEM_INSTRUCTION = `Anda adalah Router 1 (Intake & Klasifikasi) pada sistem DeepCheck AI.
Tugas Anda adalah:
1. Menganalisis metadata input (apakah gambar, video, audio, teks, atau URL media sosial/berita).
2. Menentukan rencana routing (jalur analisis) yang tepat untuk input ini.
3. Menghasilkan ringkasan singkat dalam Bahasa Indonesia.

ATURAN KETAT PRODUK (WAJIB DIPATUHI):
- DILARANG mengidentifikasi atau menyebut nama spesifik orang dari wajah atau suara.
- DILARANG menyatakan konten "pasti asli" atau "pasti palsu" sebagai vonis mutlak.
- Format keluaran WAJIB berupa JSON valid yang mematuhi skema yang ditentukan.`;

export async function runR1(
  input: AnalysisInput
): Promise<RouterExecutionResult<IntakeResult>> {
  const startTime = Date.now();
  const config = getRouterConfig("R1");

  try {
    let resolvedMediaType = input.type;
    let extractedContent = input.text || "";
    let domainMeta = "";
    let isSocialMediaVideo = false;

    // If input is a URL, resolve via specialized URL resolver
    if (input.type === "url" && input.url) {
      const domainInfo = evaluateUrlDomain(input.url);
      if (domainInfo.isKnownDomain) {
        domainMeta = `[Validasi Sumber: ${domainInfo.categoryName} (${domainInfo.domainName})]\n`;
      }

      try {
        const parsedUrl = new URL(input.url);
        const hostname = parsedUrl.hostname.toLowerCase();

        // SSRF protection: reject private/local IP ranges
        if (
          hostname === "localhost" ||
          hostname === "127.0.0.1" ||
          hostname === "::1" ||
          hostname.startsWith("192.168.") ||
          hostname.startsWith("10.") ||
          hostname.startsWith("172.16.") ||
          hostname.endsWith(".local") ||
          hostname.endsWith(".internal")
        ) {
          throw new Error("URL lokal/privat tidak diizinkan demi keamanan sistem");
        }

        // Use the specialized multi-platform resolver
        const resolved = await resolveUrlContent(input.url);
        resolvedMediaType = resolved.mediaType;
        isSocialMediaVideo = resolved.isSocialMediaVideo;
        extractedContent = `${domainMeta}${resolved.extractedText}`;

        // If thumbnail image was captured, attach to input so R3 and R4 can visually inspect the frame
        if (resolved.thumbnailBase64 && !input.base64Data) {
          input.base64Data = resolved.thumbnailBase64;
          input.mimeType = resolved.thumbnailMimeType || "image/jpeg";
        }

        // If user also provided extra narrative context, append it
        if (input.text && !extractedContent.includes(input.text)) {
          extractedContent = `${extractedContent}\n\n[Konteks Tambahan Pengguna]: ${input.text}`;
        }
      } catch (err: any) {
        extractedContent = `${domainMeta}Tautan: ${input.url} (Konteks ekstraksi otomatis: ${err.message})`;
      }
    }

    // Determine default routing plan based on resolved media type & platform
    let defaultPlan: Array<"R2" | "R3" | "R4" | "R5" | "R6" | "R7" | "R8"> = [];
    if (resolvedMediaType === "video" || isSocialMediaVideo) {
      // For video (including TikTok and Instagram Reels), run comprehensive 5-vector inspection
      defaultPlan = ["R3", "R4", "R5", "R7", "R8"];
    } else if (resolvedMediaType === "image") {
      defaultPlan = ["R3", "R4", "R7", "R8"];
    } else if (resolvedMediaType === "audio") {
      defaultPlan = ["R6", "R7", "R8"];
    } else {
      defaultPlan = ["R7", "R8"];
    }

    // Call Gemini to refine intake and validate structured plan
    const ai = getGeminiClient();
    const promptText = `Periksa masukan berikut:
Tipe Masukan: ${resolvedMediaType}
MIME Type: ${input.mimeType || "tidak ada"}
Nama File: ${input.fileName || "tidak ada"}
Konten/Deskripsi Awal: ${extractedContent ? extractedContent.slice(0, 500) : "Media biner terlampir"}

Keluarkan JSON dengan struktur:
{
  "mediaType": "${resolvedMediaType}",
  "detectedMimeType": "${input.mimeType || ""}",
  "routingPlan": ${JSON.stringify(defaultPlan)},
  "summary": "Ringkasan dalam 1-2 kalimat tentang media yang diterima untuk dianalisis."
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
    const validated = IntakeResultSchema.parse({
      ...parsed,
      mediaType: resolvedMediaType,
      routingPlan: parsed.routingPlan || defaultPlan,
      extractedContent: extractedContent || undefined,
    });

    return {
      routerId: "R1",
      name: config.name,
      success: true,
      data: validated,
      modelVersion: config.model || "default",
      promptVersion: config.promptVersion || "1.0",
      processingTimeMs: Date.now() - startTime,
    };
  } catch (error: any) {
    // Fallback safe plan
    const fallbackPlan: Array<"R2" | "R3" | "R4" | "R5" | "R6" | "R7" | "R8"> =
      input.type === "image"
        ? ["R3", "R4", "R8"]
        : input.type === "video"
        ? ["R2", "R3", "R5", "R8"]
        : ["R7", "R8"];

    return {
      routerId: "R1",
      name: config.name,
      success: true, // Degraded success
      data: {
        mediaType: input.type,
        detectedMimeType: input.mimeType,
        routingPlan: fallbackPlan,
        summary: `Media ${input.type} diterima untuk verifikasi.`,
      },
      error: error.message,
      modelVersion: config.model || "fallback",
      promptVersion: config.promptVersion || "1.0",
      processingTimeMs: Date.now() - startTime,
    };
  }
}
