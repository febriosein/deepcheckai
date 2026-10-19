import { z } from "zod";

// R1: Intake & Classification
export const IntakeResultSchema = z.object({
  mediaType: z.enum(["image", "video", "audio", "url", "text"]),
  detectedMimeType: z.string().optional(),
  routingPlan: z.array(z.enum(["R2", "R3", "R4", "R5", "R6", "R7", "R8"])),
  extractedContent: z.string().optional(), // If URL was fetched or text was directly provided
  summary: z.string(),
});
export type IntakeResult = z.infer<typeof IntakeResultSchema>;

// R3: OCR & Claims Extraction
export const OcrClaimsSchema = z.object({
  extractedText: z.string(),
  claims: z.array(
    z.object({
      claim: z.string(),
      checkable: z.boolean(),
      context: z.string().optional(),
    })
  ),
  confidence: z.number().min(0).max(1),
});
export type OcrClaimsResult = z.infer<typeof OcrClaimsSchema>;

// R4: Image Artifacts Analysis
export const ImageArtifactSchema = z.object({
  indicators: z.array(
    z.object({
      type: z.string(), // e.g. "pixel_anomaly", "facial_inconsistency", "lighting_mismatch"
      description: z.string(),
      severity: z.enum(["low", "medium", "high"]),
    })
  ),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
  aiGeneratedLikelihood: z.number().min(0).max(1), // 0 to 1
});
export type ImageArtifactResult = z.infer<typeof ImageArtifactSchema>;

// R5: Video Artifacts Analysis
export const VideoArtifactSchema = z.object({
  indicators: z.array(
    z.object({
      type: z.string(), // e.g. "unnatural_blinking", "lip_sync_mismatch", "neck_shadow"
      description: z.string(),
      severity: z.enum(["low", "medium", "high"]),
    })
  ),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
  aiGeneratedLikelihood: z.number().min(0).max(1),
});
export type VideoArtifactResult = z.infer<typeof VideoArtifactSchema>;

// R6: Synthetic Audio Analysis (Stub in P0, signal in P1)
export const AudioSyntheticSchema = z.object({
  indicators: z.array(
    z.object({
      type: z.string(),
      description: z.string(),
      severity: z.enum(["low", "medium", "high"]),
    })
  ),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
  isVoiceClonedLikelihood: z.number().min(0).max(1),
});
export type AudioSyntheticResult = z.infer<typeof AudioSyntheticSchema>;

// R7: NLP & Text Pattern Analysis
export const TextNlpSchema = z.object({
  provocativeLanguage: z.boolean(),
  sentiment: z.enum(["positif", "negatif", "netral", "campuran"]),
  hoaxPatterns: z.array(z.string()), // e.g. "urgensi palsu", "tanpa atribusi sumber", "clickbait"
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
  manipulationLikelihood: z.number().min(0).max(1),
});
export type TextNlpResult = z.infer<typeof TextNlpSchema>;

// R8: Source & Fact Verification
export const SourceCheckSchema = z.object({
  verifiedClaims: z.array(
    z.object({
      claim: z.string(),
      status: z.enum([
        "terverifikasi",
        "terbantahkan",
        "belum_dapat_diverifikasi",
        "sebagian_benar",
      ]),
      sources: z.array(
        z.object({
          title: z.string(),
          url: z.string(),
          snippet: z.string(),
          credibility: z.enum(["resmi", "media_terpercaya", "komunitas", "tidak_diketahui"]),
        })
      ),
      explanation: z.string(),
    })
  ),
  overallStatus: z.enum([
    "mayoritas_terverifikasi",
    "bercampur",
    "mayoritas_terbantahkan",
    "informasi_kurang",
  ]),
});
export type SourceCheckResult = z.infer<typeof SourceCheckSchema>;

// R9: Final Score & Education (Combined Output)
export const FinalScoreSchema = z.object({
  score: z.number().min(0).max(100), // 0-100 authenticity score (100 = reliable/authentic)
  riskCategory: z.enum(["rendah", "sedang", "tinggi", "kritis"]),
  headline: z.string(), // Ringkasan singkat satu kalimat
  reasoning: z.string(), // Penjelasan terstruktur dalam bahasa sederhana
  indicators: z.array(
    z.object({
      routerId: z.string(),
      name: z.string(),
      finding: z.string(),
      impact: z.enum(["positif", "negatif", "netral"]),
      severity: z.enum(["low", "medium", "high"]),
    })
  ),
  sources: z.array(
    z.object({
      title: z.string(),
      url: z.string(),
      snippet: z.string(),
      status: z.string(),
    })
  ),
  literacyTip: z.object({
    title: z.string(), // e.g. "Literasi 60 Detik: Saring Sebelum Sharing"
    tips: z.array(z.string()),
    actionSuggestion: z.string(), // e.g. "Tahan sebar dan periksa kembali melalui portal Kominfo atau TurnBackHoax"
  }),
  disclaimer: z.string(),
  metadata: z.object({
    routersUsed: z.array(z.string()),
    modelVersion: z.string(),
    promptVersion: z.string(),
    processingTimeMs: z.number(),
    hasDegradedSignal: z.boolean(),
  }),
});
export type FinalScoreResult = z.infer<typeof FinalScoreSchema>;
