import { NextRequest, NextResponse } from "next/server";
import { callGeminiWithImage } from "@/lib/gemini";
import { OCR_EXTRACTION_PROMPT } from "@/lib/prompts";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get("image") as File;

    if (!image) {
      return NextResponse.json(
        { success: false, error: "No image provided" },
        { status: 400 }
      );
    }

    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString("base64");

    const rawText = await callGeminiWithImage(
      "flash",
      OCR_EXTRACTION_PROMPT,
      base64Image,
      image.type
    );

    const cleanedText = rawText
      .replace(/^---\n/, "")
      .replace(/\n---$/, "")
      .trim();

    return NextResponse.json({
      success: true,
      rawText: cleanedText,
    });
  } catch (error: any) {
    console.error("OCR extraction error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "OCR processing failed",
      },
      { status: 500 }
    );
  }
}
