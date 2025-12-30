import { NextRequest, NextResponse } from "next/server";
import { callGeminiWithText } from "@/lib/gemini";
import { LABS_EXTRACTION_PROMPT } from "@/lib/prompts";

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { ocrText } = await request.json();

    if (!ocrText) {
      return NextResponse.json(
        { success: false, error: "No OCR text provided" },
        { status: 400 }
      );
    }

    // Call Gemini Pro with text for labs extraction
    const rawResponse = await callGeminiWithText(
      "pro",
      LABS_EXTRACTION_PROMPT,
      ocrText
    );

    // Parse JSON response
    const jsonMatch = rawResponse.match(/```json\n?([\s\S]*?)\n?```/) ||
                      rawResponse.match(/{[\s\S]*}/);
    
    if (!jsonMatch) {
      throw new Error("Failed to extract JSON from response");
    }

    const labsData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: labsData,
      processingTime,
    });
  } catch (error: any) {
    console.error("Labs Gemini extraction error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Labs processing failed",
      },
      { status: 500 }
    );
  }
}
