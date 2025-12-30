import { NextRequest, NextResponse } from "next/server";
import { callAzureOpenAI } from "@/lib/azure-openai";
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

    // Call Azure OpenAI GPT-5-mini with text for labs extraction
    const rawResponse = await callAzureOpenAI(
      LABS_EXTRACTION_PROMPT,
      `INPUT TEXT:\n"""\n${ocrText}\n"""`
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
    console.error("Labs Azure extraction error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Labs processing failed",
      },
      { status: 500 }
    );
  }
}
