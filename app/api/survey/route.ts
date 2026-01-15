import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { submitSurveyResponse } from "@/lib/jsonbin";

// The 7 SOAP models we're evaluating
const SOAP_MODELS = [
  "claude-sonnet",
  "deepseek-v3.2",
  "gemini-pro",
  "glm-4.7",
  "gpt-5-mini",
  "kimi-k2",
  "qwen-72b",
];

/**
 * GET /api/survey?imageId=medical_note_01
 * Returns the SOAP results for all 7 models for a given image
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const imageId = searchParams.get("imageId");

  if (!imageId) {
    return NextResponse.json({ error: "imageId is required" }, { status: 400 });
  }

  try {
    const batchResultsDir = path.join(process.cwd(), "data", "batch-results");
    const results: Record<string, unknown> = {};

    for (const model of SOAP_MODELS) {
      const filename = `${imageId}__soap_enhanced__${model}.json`;
      const filePath = path.join(batchResultsDir, filename);

      try {
        const content = await fs.readFile(filePath, "utf-8");
        results[model] = JSON.parse(content);
      } catch {
        // File might not exist for this model/image combo
        results[model] = null;
      }
    }

    return NextResponse.json({
      imageId,
      models: SOAP_MODELS,
      results,
    });
  } catch (error) {
    console.error("Error loading SOAP results:", error);
    return NextResponse.json(
      { error: "Failed to load SOAP results" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/survey
 * Submit completed survey responses for an image (all 7 models)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { imageId, doctorId, responses } = body;

    if (!imageId || !responses) {
      return NextResponse.json(
        { error: "imageId and responses are required" },
        { status: 400 }
      );
    }

    // Validate that all 7 models have responses
    const modelKeys = Object.keys(responses);
    if (modelKeys.length !== 7) {
      return NextResponse.json(
        {
          error: `Expected 7 model responses, got ${modelKeys.length}`,
        },
        { status: 400 }
      );
    }

    const surveyData = {
      imageId,
      submittedAt: new Date().toISOString(),
      doctorId: doctorId || `anonymous_${Date.now()}`,
      responses,
    };

    const result = await submitSurveyResponse(surveyData);

    return NextResponse.json({
      success: true,
      message: "Survey submitted successfully",
      binId: result.binId,
    });
  } catch (error) {
    console.error("Error submitting survey:", error);
    return NextResponse.json(
      {
        error: "Failed to submit survey",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
