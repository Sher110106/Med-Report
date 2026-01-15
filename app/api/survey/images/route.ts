import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

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

interface ImageInfo {
  id: string;
  filename: string;
  path: string;
  modelsAvailable: string[];
}

/**
 * GET /api/survey/images
 * Returns list of all available images with their SOAP result availability
 */
export async function GET() {
  try {
    const photosDir = path.join(process.cwd(), "photos");
    const batchResultsDir = path.join(process.cwd(), "data", "batch-results");

    // Get all image files
    const files = await fs.readdir(photosDir);
    const imageFiles = files.filter((f) =>
      /\.(jpg|jpeg|png|webp|gif)$/i.test(f)
    );

    const images: ImageInfo[] = [];

    for (const file of imageFiles) {
      // Extract the image ID (e.g., "medical_note_01" from "medical_note_01.webp")
      const id = file.replace(/\.[^.]+$/, "");

      // Check which models have results for this image
      const modelsAvailable: string[] = [];

      for (const model of SOAP_MODELS) {
        const resultFile = `${id}__soap_enhanced__${model}.json`;
        const resultPath = path.join(batchResultsDir, resultFile);

        try {
          await fs.access(resultPath);
          modelsAvailable.push(model);
        } catch {
          // File doesn't exist
        }
      }

      images.push({
        id,
        filename: file,
        path: `/photos/${file}`,
        modelsAvailable,
      });
    }

    // Sort by image ID
    images.sort((a, b) => a.id.localeCompare(b.id));

    return NextResponse.json({
      totalImages: images.length,
      totalModels: SOAP_MODELS.length,
      models: SOAP_MODELS,
      images,
    });
  } catch (error) {
    console.error("Error listing images:", error);
    return NextResponse.json(
      { error: "Failed to list images" },
      { status: 500 }
    );
  }
}
