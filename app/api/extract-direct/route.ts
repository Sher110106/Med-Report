import { NextRequest, NextResponse } from "next/server";
import { callGeminiWithImage } from "@/lib/gemini";
import { SOAP_EXTRACTION_PROMPT } from "@/lib/prompts";
import { ProcessingResponse } from "@/lib/types";

export async function POST(request: NextRequest) {
  const startTime = Date.now();

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

    const rawResponse = await callGeminiWithImage(
      "pro",
      SOAP_EXTRACTION_PROMPT,
      base64Image,
      image.type
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
    console.error("Direct extraction error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Processing failed",
      },
      { status: 500 }
    );
  }
}
