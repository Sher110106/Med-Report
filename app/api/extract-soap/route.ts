import { NextRequest, NextResponse } from "next/server";
import { callGeminiWithText } from "@/lib/gemini";
import { SOAP_FROM_TEXT_ENHANCED_PROMPT } from "@/lib/prompts";
import { ProcessingResponse } from "@/lib/types";

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

    const rawResponse = await callGeminiWithText(
      "pro",
      SOAP_FROM_TEXT_ENHANCED_PROMPT,
      ocrText
    );

    const jsonMatch = rawResponse.match(/```json\n?([\s\S]*?)\n?```/) ||
                      rawResponse.match(/{[\s\S]*}/);

    if (!jsonMatch) {
      throw new Error("Failed to extract JSON from response");
    }

    const soapData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
    const processingTime = Date.now() - startTime;

    const response: ProcessingResponse = {
      success: true,
      data: soapData,
      processingTime,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("SOAP extraction error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "SOAP processing failed",
      },
      { status: 500 }
    );
  }
}
