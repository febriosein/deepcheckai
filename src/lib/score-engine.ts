import { evaluateUrlDomain, DomainCheckResult } from "./domains";
import {
  AudioSyntheticResult,
  ImageArtifactResult,
  OcrClaimsResult,
  SourceCheckResult,
  TextNlpResult,
  VideoArtifactResult,
} from "./schemas";

export type SupportedMediaType = "image" | "video" | "audio" | "url" | "text" | undefined;

export interface ScoreEngineInput {
  routersUsed: string[];
  ocr?: OcrClaimsResult;
  imageArtifacts?: ImageArtifactResult;
  videoArtifacts?: VideoArtifactResult;
  audioSynthetic?: AudioSyntheticResult;
  textNlp?: TextNlpResult;
  sourceCheck?: SourceCheckResult;
  inputUrl?: string;
  mediaType?: SupportedMediaType;
  hasDegradedSignal?: boolean;
}

export interface CalibratedScoreDecision {
  anchorScore: number; // Calibrated integer 5 - 98
  scoreMin: number;
  scoreMax: number;
  recommendedRiskCategory: "rendah" | "sedang" | "tinggi" | "kritis";
  breakdown: {
    sourceScore: number;
    nlpScore: number;
    mediaArtifactScore: number;
    domainBonus: number;
    weightProfile: WeightProfile;
  };
  verdictType: "authentic" | "neutral" | "questionable" | "hoax_manipulation";
  primaryReason: string;
  activeIndicators: string[]; // Names of the active adaptive indicators relevant to this media type
}

export interface WeightProfile {
  source: number;
  nlp: number;
  mediaAI: number;
  domain: number; // Domain comes as bonus, not core weight
}

/**
 * Determines the calibrated scoring weight profile based on media input type.
 * Each media type renders forensics differently; adjusting weights per type
 * yields higher verification accuracy.
 */
export function getWeightProfile(mediaType?: SupportedMediaType): WeightProfile {
  switch (mediaType) {
    case "image":
      // Image relies more deeply on visual forensics
      return { source: 0.35, nlp: 0.25, mediaAI: 0.4, domain: 0 };
    case "video":
      // Video relies heavily on multimedia forensics
      return { source: 0.30, nlp: 0.20, mediaAI: 0.5, domain: 0 };
    case "audio":
      // Audio is nearly fully assessed by audio forensics
      return { source: 0.30, nlp: 0.20, mediaAI: 0.5, domain: 0 };
    case "url":
      // URL relies primarily on cross reference + source reputation
      return { source: 0.5, nlp: 0.3, mediaAI: 0.2, domain: 0.2 };
    case "text":
    default:
      // Pure text relies on NLP and fact-checking
      return { source: 0.45, nlp: 0.55, mediaAI: 0, domain: 0 };
  }
}

/**
 * Determines which adaptive indicator dimensions are relevant for a given media type.
 * Ensures irrelevant forensics are omitted (accuracy-first design).
 */
export function getAdaptiveIndicatorProfile(mediaType?: SupportedMediaType): string[] {
  const CORE_INDICATORS = [
    "Integritas Sumber & Otoritas Kanal",
    "Konsistensi Klaim Faktual",
    "Pola Bahasa & Retorika Emosional",
    "Risiko Rekayasa Sosial & Transaksional",
  ];

  switch (mediaType) {
    case "image":
      return [
        ...CORE_INDICATORS,
        "Forensik Visual & Integritas AI",
        "Konsistensi OCR & Label Grafis",
        "Konteks Kronologis & Jejak Peristiwa",
      ];
    case "video":
      return [
        ...CORE_INDICATORS,
        "Forensik Visual & Integritas AI",
        "Kualitas Lip-Sync & Konsistensi Frame",
        "Integritas Audio & Kloning Suara",
        "Konteks Kronologis & Jejak Peristiwa",
      ];
    case "audio":
      return [
        ...CORE_INDICATORS,
        "Forensik Kloning Suara & Integritas Audio",
        "Konteks Kronologis & Jejak Peristiwa",
      ];
    case "url":
      return [
        ...CORE_INDICATORS,
        "Integritas Otoritas Domain & Reputasi Portal",
        "Relevansi Judul & Substansi Konten",
        "Daur Ulang Konteks & Reputasi Riwayat Domain",
        "Keamanan Tautan & Link Trust",
      ];
    case "text":
    default:
      return [
        ...CORE_INDICATORS,
        "Kualitas Atribusi Sumber & Penulis",
        "Konteks Kronologis & Jejak Peristiwa",
      ];
  }
}

/**
 * Detects suspicious shortened / obfuscated link patterns to reduce reliability.
 */
function detectPoisonLinks(inputUrl?: string): boolean {
  if (!inputUrl) return false;
  const shortenHosts = [
    "bit.ly",
    "s.id",
    "tinyurl.com",
    "cutt.ly",
    "shorturl.at",
    "t.co",
    "rebrand.ly",
    "is.gd",
    "shorte.st",
    "ink.co",
    "ouo.press",
    "exe.io",
    "shrinkme.io",
  ];
  try {
    const parsed = new URL(inputUrl);
    const host = parsed.hostname.toLowerCase();
    if (shortenHosts.some((h) => host === h || host.endsWith("." + h))) return true;

    // Suspicious TLDs
    const suspiciousTlds = [".xyz", ".top", ".buzz", ".club", ".work", ".site", ".online"];
    if (suspiciousTlds.some((tld) => host.endsWith(tld))) return true;

    return false;
  } catch {
    return false;
  }
}

/**
 * Deterministically computes an anchored authenticity score (0 - 100%)
 * based on multi-router evidence with strict calibration boundaries.
 */
export function calculateAnchorScore(input: ScoreEngineInput): CalibratedScoreDecision {
  const {
    imageArtifacts,
    videoArtifacts,
    audioSynthetic,
    textNlp,
    sourceCheck,
    inputUrl,
    mediaType,
  } = input;

  // Domain intelligence check
  const domainInfo = inputUrl ? evaluateUrlDomain(inputUrl) : null;
  let domainBonus = domainInfo ? domainInfo.trustScoreBonus : 0;

  // Poison link / suspicious TLD detection — heavy penalty for suspicious link trust
  const hasPoisonLink = detectPoisonLinks(inputUrl);
  if (hasPoisonLink) {
    domainBonus -= 30; // Chain-of-trust break penalty (shortener/suspicious TLD)
  }

  const weightProfile = getWeightProfile(mediaType);

  // 1. EVALUATE SOURCE & FACT-CHECK SIGNALS (R8)
  let sourceScore = 70; // neutral default
  if (sourceCheck) {
    if (sourceCheck.overallStatus === "mayoritas_terverifikasi") {
      sourceScore = 94;
    } else if (sourceCheck.overallStatus === "mayoritas_terbantahkan") {
      sourceScore = 12;
    } else if (sourceCheck.overallStatus === "bercampur") {
      sourceScore = 48;
    } else {
      // informasi_kurang – fall back to domain reputation if available
      sourceScore = domainInfo?.isCredibleMedia || domainInfo?.isOfficialGovEdu ? 88 : 65;
    }

    // Inspect individual claim statuses
    const hasDebunkedClaim = sourceCheck.verifiedClaims.some((c) => c.status === "terbantahkan");
    const allClaimsVerified =
      sourceCheck.verifiedClaims.length > 0 &&
      sourceCheck.verifiedClaims.every((c) => c.status === "terverifikasi");

    if (hasDebunkedClaim) {
      sourceScore = Math.min(sourceScore, 20);
    } else if (allClaimsVerified) {
      sourceScore = Math.max(sourceScore, 92);
    }
  } else if (domainInfo?.isCredibleMedia || domainInfo?.isOfficialGovEdu) {
    sourceScore = 88;
  }

  // 2. EVALUATE NLP & HOAX PATTERNS (R7)
  let nlpScore = 86; // default clean text
  if (textNlp) {
    let penalty = 0;
    // Penalty per detected hoax pattern
    if (textNlp.hoaxPatterns && textNlp.hoaxPatterns.length > 0) {
      penalty += textNlp.hoaxPatterns.length * 18;
    }
    if (textNlp.provocativeLanguage) {
      penalty += 16;
    }
    if (textNlp.manipulationLikelihood > 0) {
      penalty += textNlp.manipulationLikelihood * 42;
    }

    // New added accuracy indicators:
    // Clickbait / sensational title patterns (empty attribution, placeholders like "TANGKAPAN LAYAR", forward chain)
    const clickbaitSignals = textNlp.hoaxPatterns.filter((p) => {
      const lower = p.toLowerCase();
      return (
        lower.includes("clickbait") ||
        lower.includes("sensasional") ||
        lower.includes("judul bombastis") ||
        lower.includes("tangkapan layar") ||
        lower.includes("forwarded")
      );
    });
    if (clickbaitSignals.length > 0) {
      penalty += 12; // Minor extra penalty for clickbait signals
    }

    nlpScore = Math.max(10, Math.min(95, Math.round(92 - penalty)));

    // Hard ceiling for obvious text hoax / scam patterns
    if (textNlp.hoaxPatterns && textNlp.hoaxPatterns.length >= 2 && textNlp.manipulationLikelihood > 0.5) {
      nlpScore = Math.min(nlpScore, 22);
    }
  }

  // 3. EVALUATE MULTIMODAL ARTIFACT SIGNALS (R4 / R5 / R6)
  let mediaScore = 92; // default clean media
  let hasMediaRouter = false;

  if (imageArtifacts) {
    hasMediaRouter = true;
    const aiLikelihood = imageArtifacts.aiGeneratedLikelihood || 0;
    const aiPenalty = aiLikelihood * 75;
    const hasHighSeverity = imageArtifacts.indicators.some((ind) => ind.severity === "high");
    mediaScore = Math.round(92 - aiPenalty - (hasHighSeverity ? 25 : 0));
    if (aiLikelihood > 0.65) mediaScore = Math.min(mediaScore, 20);
  }

  if (videoArtifacts) {
    hasMediaRouter = true;
    const aiLikelihood = videoArtifacts.aiGeneratedLikelihood || 0;
    const vScore = Math.round(92 - aiLikelihood * 75);
    mediaScore = Math.min(mediaScore, vScore);
  }

  if (audioSynthetic) {
    hasMediaRouter = true;
    const cloneLikelihood = audioSynthetic.isVoiceClonedLikelihood || 0;
    const aScore = Math.round(92 - cloneLikelihood * 80);
    mediaScore = Math.min(mediaScore, aScore);
  }

  mediaScore = Math.max(10, Math.min(96, mediaScore));

  // 4. COMBINE WEIGHTED SCORES USING MEDIA-TYPE-AWARE PROFILE
  let calculatedScore: number;
  if (hasMediaRouter && weightProfile.mediaAI > 0) {
    // Render media forensics pro-rata only when relevant media router was actually executed
    calculatedScore =
      sourceScore * weightProfile.source +
      nlpScore * weightProfile.nlp +
      mediaScore * weightProfile.mediaAI;
  } else {
    // Zero-out media weight if not relevant or data missing, redistribute remaining weights
    const remainingWeight = weightProfile.source + weightProfile.nlp;
    calculatedScore =
      sourceScore * (weightProfile.source / remainingWeight) +
      nlpScore * (weightProfile.nlp / remainingWeight);
  }

  // Apply domain bonus/penalty
  calculatedScore += domainBonus;

  // 5. CIRCUIT BREAKER OVERRIDES (CRITICAL FOR CALIBRATION ACCURACY)

  // HOAX / FAKE CIRCUIT BREAKER
  const isDebunkedHoax =
    sourceCheck?.overallStatus === "mayoritas_terbantahkan" ||
    (sourceCheck?.verifiedClaims && sourceCheck.verifiedClaims.some((c) => c.status === "terbantahkan"));

  const isBlatantTextHoax =
    Boolean(textNlp?.hoaxPatterns && textNlp.hoaxPatterns.length >= 2 && textNlp.manipulationLikelihood > 0.55);

  const isBlatantDeepfake =
    (imageArtifacts?.aiGeneratedLikelihood || 0) > 0.7 ||
    (videoArtifacts?.aiGeneratedLikelihood || 0) > 0.7 ||
    (audioSynthetic?.isVoiceClonedLikelihood || 0) > 0.7;

  if (isDebunkedHoax || isBlatantTextHoax || isBlatantDeepfake) {
    calculatedScore = Math.min(calculatedScore, 22);
    if (isDebunkedHoax) calculatedScore = Math.min(calculatedScore, 15);
  }

  // VERIFIED AUTHENTIC CIRCUIT BREAKER
  const isVerifiedSource =
    sourceCheck?.overallStatus === "mayoritas_terverifikasi" ||
    domainInfo?.isCredibleMedia ||
    domainInfo?.isOfficialGovEdu;

  const hasNoHoaxFlags =
    (!textNlp || (!textNlp.provocativeLanguage && (!textNlp.hoaxPatterns || textNlp.hoaxPatterns.length === 0)));

  const hasNoMediaFlags =
    (!imageArtifacts || imageArtifacts.aiGeneratedLikelihood < 0.25) &&
    (!videoArtifacts || videoArtifacts.aiGeneratedLikelihood < 0.25) &&
    (!audioSynthetic || audioSynthetic.isVoiceClonedLikelihood < 0.25);

  if (isVerifiedSource && hasNoHoaxFlags && hasNoMediaFlags) {
    // Strictly floor at 88% - 98%
    calculatedScore = Math.max(calculatedScore, 90);
    if (domainInfo?.isOfficialGovEdu || domainInfo?.isFactChecker) {
      calculatedScore = Math.max(calculatedScore, 94);
    }
  }

  // Final Clamping to [5, 98]
  const finalScore = Math.max(5, Math.min(98, Math.round(calculatedScore)));

  // Risk category mapping
  let category: "rendah" | "sedang" | "tinggi" | "kritis";
  if (finalScore >= 80) {
    category = "rendah";
  } else if (finalScore >= 60) {
    category = "sedang";
  } else if (finalScore >= 35) {
    category = "tinggi";
  } else {
    category = "kritis";
  }

  // Determine verdict type and reason summary
  let verdictType: "authentic" | "neutral" | "questionable" | "hoax_manipulation";
  let primaryReason = "";

  if (finalScore >= 80) {
    verdictType = "authentic";
    primaryReason = domainInfo?.isCredibleMedia
      ? `Konten berasal dari saluran pers nasional terverifikasi (${domainInfo.domainName}) dengan narasi faktual yang konsisten.`
      : "Konten menunjukkan integritas informasi tinggi tanpa adanya indikasi manipulasi visual, audio, maupun pola hoaks.";
  } else if (finalScore <= 34) {
    verdictType = "hoax_manipulation";
    primaryReason = isDebunkedHoax
      ? "Klaim dalam konten ini telah diverifikasi dan terbantahkan oleh rujukan pemeriksa fakta kredibel."
      : hasPoisonLink
      ? "Tautan terindikasi memakai jangkar potensi phishing (domain operan atau URL kunjungan yang tidak umum di kanal resmi)."
      : isBlatantTextHoax
      ? "Konten memuat pola penipuan/hoaks khas dengan manipulasi urgensi dan desakan tidak wajar."
      : "Terdeteksi anomali signifikan atau indikasi kuat sintesis generatif kecerdasan buatan (deepfake).";
  } else if (finalScore < 60) {
    verdictType = "questionable";
    primaryReason = "Klaim mengandung unsur meragukan atau sensasional yang belum didukung oleh konfirmasi sumber resmi.";
  } else {
    verdictType = "neutral";
    primaryReason = "Informasi bersifat umum atau wajar namun tetap disarankan memeriksa rujukan primer sebelum disebarkan.";
  }

  return {
    anchorScore: finalScore,
    scoreMin: Math.max(5, finalScore - 3),
    scoreMax: Math.min(98, finalScore + 3),
    recommendedRiskCategory: category,
    breakdown: {
      sourceScore: Math.round(sourceScore),
      nlpScore: Math.round(nlpScore),
      mediaArtifactScore: Math.round(mediaScore),
      domainBonus,
      weightProfile,
    },
    verdictType,
    primaryReason,
    activeIndicators: getAdaptiveIndicatorProfile(mediaType),
  };
}
