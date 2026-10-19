import { NextRequest, NextResponse } from "next/server";
import { orchestrateAnalysis } from "@/routers/orchestrator";
import { AnalysisInput, ProgressUpdate } from "@/routers/types";

export const maxDuration = 60; // Allow sufficient time for multimodal analysis (Vercel max for Serverless Hobby/Pro)

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let input: AnalysisInput;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const type = (formData.get("type") as any) || "image";
      const url = (formData.get("url") as string) || undefined;
      const text = (formData.get("text") as string) || undefined;

      if (file && file.size > 0) {
        // Enforce max file size for serverless payload limit (4.5MB on Vercel)
        if (file.size > 4.5 * 1024 * 1024) {
          return NextResponse.json(
            {
              error:
                "Ukuran file melebihi batas 4.5MB untuk serverless Vercel. Silakan gunakan file lebih kecil atau gunakan tab 'Tautan Media' untuk memeriksa video/konten langsung lewat link.",
            },
            { status: 413 }
          );
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Data = buffer.toString("base64");

        input = {
          type,
          base64Data,
          mimeType: file.type || "application/octet-stream",
          fileName: file.name,
          fileSize: file.size,
          text,
        };
      } else if (url) {
        input = {
          type: "url",
          url,
          text,
        };
      } else if (text) {
        input = {
          type: "text",
          text,
        };
      } else {
        return NextResponse.json(
          {
            error:
              "Harap masukkan tautan (URL), unggah file media (gambar/video/audio), atau sertakan teks narasi.",
          },
          { status: 400 }
        );
      }
    } else {
      // JSON payload
      const body = await req.json();
      if (!body.url && !body.text && !body.base64Data) {
        return NextResponse.json(
          {
            error:
              "Harap sertakan url, text narasi, atau data media yang valid untuk diperiksa.",
          },
          { status: 400 }
        );
      }

      input = {
        type: body.type || (body.url ? "url" : "text"),
        url: body.url,
        text: body.text,
        base64Data: body.base64Data,
        mimeType: body.mimeType,
        fileName: body.fileName,
      };
    }

    // Check if client requested streaming
    const acceptsStream =
      req.headers.get("accept")?.includes("text/event-stream") ||
      req.nextUrl.searchParams.get("stream") === "true";

    if (acceptsStream) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const sendEvent = (data: any) => {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
            );
          };

          try {
            const finalResult = await orchestrateAnalysis(
              input,
              (progress: ProgressUpdate) => {
                sendEvent({ type: "progress", progress });
              }
            );

            sendEvent({ type: "result", result: finalResult });
            controller.close();
          } catch (err: any) {
            sendEvent({
              type: "error",
              error:
                err.message ||
                "Terjadi kendala saat menganalisis media. Silakan coba kembali.",
            });
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Standard JSON Response
    const result = await orchestrateAnalysis(input);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      {
        error:
          error.message ||
          "Layanan verifikasi sedang sibuk atau kuota terbatas. Silakan coba beberapa saat lagi.",
      },
      { status: 500 }
    );
  }
}
