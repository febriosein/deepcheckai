import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY belum disetel. Harap setel GEMINI_API_KEY di file .env.local"
      );
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}
