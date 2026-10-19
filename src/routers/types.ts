export interface RouterExecutionResult<T = unknown> {
  routerId: string;
  name: string;
  success: boolean;
  data?: T;
  error?: string;
  modelVersion: string;
  promptVersion: string;
  processingTimeMs: number;
}

export interface AnalysisInput {
  type: "url" | "image" | "video" | "audio" | "text";
  url?: string;
  text?: string;
  base64Data?: string;
  mimeType?: string;
  fileName?: string;
  fileSize?: number;
}

export interface PreprocessedData {
  frames?: Array<{ base64: string; mimeType: string; timestampSec: number }>;
  audioSample?: { base64: string; mimeType: string };
  extractedText?: string;
}

export type ProgressStep =
  | "R1"
  | "R2"
  | "R3"
  | "R4"
  | "R5"
  | "R6"
  | "R7"
  | "R8"
  | "R9"
  | "done"
  | "error";

export interface ProgressUpdate {
  step: ProgressStep;
  status: "idle" | "running" | "completed" | "skipped" | "failed";
  label: string;
  timestamp: number;
}
