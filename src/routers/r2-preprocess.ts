import { getRouterConfig } from "../lib/router-config";
import { AnalysisInput, PreprocessedData, RouterExecutionResult } from "./types";

export async function runR2(
  input: AnalysisInput
): Promise<RouterExecutionResult<PreprocessedData>> {
  const startTime = Date.now();
  const config = getRouterConfig("R2");

  try {
    // R2: Preprocessing non-AI
    // Menyiapkan representasi frame dan metadata untuk video/audio
    const preprocessed: PreprocessedData = {};

    if ((input.type === "video" || input.type === "url") && input.base64Data) {
      // In serverless / MVP environments, we pass the video keyframe/thumbnail representation
      preprocessed.frames = [
        {
          base64: input.base64Data,
          mimeType: input.mimeType || (input.type === "video" ? "video/mp4" : "image/jpeg"),
          timestampSec: 0,
        },
      ];
    }

    if (input.text) {
      preprocessed.extractedText = input.text.trim();
    }

    return {
      routerId: "R2",
      name: config.name,
      success: true,
      data: preprocessed,
      modelVersion: "non-ai",
      promptVersion: "1.0",
      processingTimeMs: Date.now() - startTime,
    };
  } catch (error: any) {
    return {
      routerId: "R2",
      name: config.name,
      success: false,
      error: error.message,
      modelVersion: "non-ai",
      promptVersion: "1.0",
      processingTimeMs: Date.now() - startTime,
    };
  }
}
