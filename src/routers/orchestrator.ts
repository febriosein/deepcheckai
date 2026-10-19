import { FinalScoreResult } from "../lib/schemas";
import { runR1 } from "./r1-intake";
import { runR2 } from "./r2-preprocess";
import { runR3 } from "./r3-ocr-claims";
import { runR4 } from "./r4-image-artifacts";
import { runR5 } from "./r5-video-artifacts";
import { runR6 } from "./r6-audio-synthetic";
import { runR7 } from "./r7-text-nlp";
import { runR8 } from "./r8-source-check";
import { runR9 } from "./r9-score-combine";
import {
  AnalysisInput,
  PreprocessedData,
  ProgressStep,
  ProgressUpdate,
} from "./types";

export type ProgressCallback = (update: ProgressUpdate) => void;

function createTimeout<T>(ms: number, routerId: string): Promise<T> {
  return new Promise((_, reject) =>
    setTimeout(
      () => reject(new Error(`Timeout tercapai pada ${routerId} (${ms}ms)`)),
      ms
    )
  );
}

export async function orchestrateAnalysis(
  input: AnalysisInput,
  onProgress?: ProgressCallback
): Promise<FinalScoreResult> {
  const overallStartTime = Date.now();
  const routersUsed: string[] = [];
  let hasDegradedSignal = false;

  const notify = (
    step: ProgressStep,
    status: ProgressUpdate["status"],
    label: string
  ) => {
    if (onProgress) {
      onProgress({
        step,
        status,
        label,
        timestamp: Date.now(),
      });
    }
  };

  // -------------------------------------------------------------
  // STEP 1: R1 Intake & Classification
  // -------------------------------------------------------------
  notify("R1", "running", "Mendeteksi format media dan merencanakan jalur analisis...");
  const r1Res = await Promise.race([
    runR1(input),
    createTimeout<ReturnType<typeof runR1>>(15000, "R1"),
  ]).catch((err) => {
    hasDegradedSignal = true;
    return {
      routerId: "R1",
      name: "Intake",
      success: false,
      data: {
        mediaType: input.type,
        routingPlan: ["R7", "R8"] as Array<"R7" | "R8">,
        summary: "Jalur intake darurat diaktifkan",
        extractedContent: undefined,
      },
      error: err.message,
      modelVersion: "fallback",
      promptVersion: "1.0",
      processingTimeMs: 0,
    };
  });
  routersUsed.push("R1");
  notify("R1", "completed", "Format media berhasil diklasifikasi.");

  const routingPlan = r1Res.data?.routingPlan || ["R7", "R8"];
  const mediaType = r1Res.data?.mediaType || input.type;

  // Pipeline Enhancement: Forward extracted content from URL/Intake to input.text
  // so downstream routers R7 (NLP) and R8 (Source Check) analyze real article content
  if (r1Res.data?.extractedContent && (!input.text || input.text.length < 50)) {
    input.text = r1Res.data.extractedContent;
  }

  // -------------------------------------------------------------
  // STEP 2: R2 Preprocessing (if video or audio)
  // -------------------------------------------------------------
  let preprocessed: PreprocessedData | undefined = undefined;
  if (routingPlan.includes("R2") || mediaType === "video" || mediaType === "audio") {
    notify("R2", "running", "Mempersiapkan frame dan pemrosesan sinyal...");
    try {
      const r2Res = await runR2(input);
      preprocessed = r2Res.data;
      routersUsed.push("R2");
      notify("R2", "completed", "Ekstraksi frame selesai.");
    } catch (e: any) {
      hasDegradedSignal = true;
      notify("R2", "failed", "Pra-pemrosesan dilewati (degradasi anggun).");
    }
  }

  // -------------------------------------------------------------
  // STEP 3: Parallel Router Execution (R3, R4, R5, R6, R7)
  // -------------------------------------------------------------
  notify("R3", "running", "Menganalisis teks, pola bahasa, dan artefak visual...");

  const parallelTasks: Promise<any>[] = [];

  // R3 (OCR & Claims Extraction) - if image, video, or URL
  let r3Promise: Promise<any> | null = null;
  if (routingPlan.includes("R3") || mediaType === "image" || mediaType === "video") {
    r3Promise = Promise.race([
      runR3(input, preprocessed),
      createTimeout<ReturnType<typeof runR3>>(18000, "R3"),
    ]).catch((err) => {
      hasDegradedSignal = true;
      return null;
    });
    parallelTasks.push(r3Promise);
  }

  // R4 (Image Artifacts)
  let r4Promise: Promise<any> | null = null;
  if (routingPlan.includes("R4") || mediaType === "image") {
    r4Promise = Promise.race([
      runR4(input),
      createTimeout<ReturnType<typeof runR4>>(18000, "R4"),
    ]).catch((err) => {
      hasDegradedSignal = true;
      return null;
    });
    parallelTasks.push(r4Promise);
  }

  // R5 (Video Artifacts)
  let r5Promise: Promise<any> | null = null;
  if (routingPlan.includes("R5") || mediaType === "video") {
    r5Promise = Promise.race([
      runR5(input, preprocessed),
      createTimeout<ReturnType<typeof runR5>>(20000, "R5"),
    ]).catch((err) => {
      hasDegradedSignal = true;
      return null;
    });
    parallelTasks.push(r5Promise);
  }

  // R6 (Audio Synthetic)
  let r6Promise: Promise<any> | null = null;
  if (routingPlan.includes("R6") || mediaType === "audio") {
    r6Promise = Promise.race([
      runR6(input),
      createTimeout<ReturnType<typeof runR6>>(18000, "R6"),
    ]).catch((err) => {
      hasDegradedSignal = true;
      return null;
    });
    parallelTasks.push(r6Promise);
  }

  // R7 (Text NLP & Hoax Patterns)
  let r7Promise: Promise<any> | null = null;
  if (routingPlan.includes("R7") || mediaType === "text" || mediaType === "url") {
    r7Promise = Promise.race([
      runR7(input),
      createTimeout<ReturnType<typeof runR7>>(18000, "R7"),
    ]).catch((err) => {
      hasDegradedSignal = true;
      return null;
    });
    parallelTasks.push(r7Promise);
  }

  // Wait for parallel batch
  await Promise.allSettled(parallelTasks);

  const r3Res = r3Promise ? await r3Promise : null;
  const r4Res = r4Promise ? await r4Promise : null;
  const r5Res = r5Promise ? await r5Promise : null;
  const r6Res = r6Promise ? await r6Promise : null;
  const r7Res = r7Promise ? await r7Promise : null;

  if (r3Res?.success) routersUsed.push("R3");
  if (r4Res?.success) routersUsed.push("R4");
  if (r5Res?.success) routersUsed.push("R5");
  if (r6Res?.success) routersUsed.push("R6");
  if (r7Res?.success) routersUsed.push("R7");

  notify("R3", "completed", "Analisis sinyal visual dan teks selesai.");

  // -------------------------------------------------------------
  // STEP 4: R8 Source Check & Fact-Checking Cross-Reference
  // -------------------------------------------------------------
  notify("R8", "running", "Memeriksa silang klaim ke sumber resmi dan pemeriksa fakta...");

  const ocrData = r3Res?.data;
  let r8Res: any = null;
  try {
    r8Res = await Promise.race([
      runR8(input, ocrData),
      createTimeout<ReturnType<typeof runR8>>(20000, "R8"),
    ]);
    if (r8Res?.success) routersUsed.push("R8");
    notify("R8", "completed", "Verifikasi sumber rujukan selesai.");
  } catch (err: any) {
    hasDegradedSignal = true;
    notify("R8", "failed", "Pemeriksaan rujukan selesai dengan sinyal cadangan.");
  }

  // -------------------------------------------------------------
  // STEP 5: R9 Score Combiner & Literacy Tip Generation
  // -------------------------------------------------------------
  notify("R9", "running", "Menghitung skor keaslian probabilistik dan modul edukasi...");

  const totalTimeSoFar = Date.now() - overallStartTime;
  routersUsed.push("R9");

  const r9Res = await runR9({
    routersUsed,
    ocr: r3Res?.data,
    imageArtifacts: r4Res?.data,
    videoArtifacts: r5Res?.data,
    audioSynthetic: r6Res?.data,
    textNlp: r7Res?.data,
    sourceCheck: r8Res?.data,
    hasDegradedSignal,
    totalTimeMs: totalTimeSoFar,
    inputUrl: input.url,
    mediaType: input.type,
  });

  notify("done", "completed", "Verifikasi media selesai!");

  if (!r9Res.data) {
    throw new Error("Gagal menyusun skor akhir verifikasi.");
  }

  return r9Res.data;
}
