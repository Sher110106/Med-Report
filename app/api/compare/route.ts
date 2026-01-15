import { NextRequest, NextResponse } from "next/server";
import { callGeminiWithImage } from "@/lib/gemini";
import { callAzureOpenAI } from "@/lib/azure-openai";
import {
  callOpenRouter,
  OPENROUTER_MODELS,
  isOpenRouterConfigured,
  getModelDisplayName,
  OpenRouterModel,
} from "@/lib/openrouter";
import {
  callBedrock,
  BEDROCK_MODELS,
  isBedrockConfigured,
  getBedrockModelDisplayName,
  BedrockModel,
} from "@/lib/bedrock";
import {
  saveComparisonRun,
  generateRunId,
  generateImageHash,
  ModelRunResult,
} from "@/lib/storage";
import { OCR_EXTRACTION_PROMPT, SOAP_FROM_TEXT_ENHANCED_PROMPT } from "@/lib/prompts";

// Define all models we want to compare
interface ModelConfig {
  key: string;
  name: string;
  provider: "openrouter" | "bedrock" | "azure" | "gemini" | "coming-soon";
  modelRef?: OpenRouterModel | BedrockModel | string;
}

const ALL_MODELS: ModelConfig[] = [
  // OpenRouter models
  { key: "deepseek-v3.2", name: "DeepSeek V3.2", provider: "openrouter", modelRef: "DEEPSEEK_V3_2" },
  { key: "glm-4.7", name: "GLM 4.7", provider: "openrouter", modelRef: "GLM_4_7" },
  { key: "kimi-k2", name: "Kimi K2 Thinking", provider: "openrouter", modelRef: "KIMI_K2" },
  { key: "qwen-72b", name: "Qwen2.5-72B-Instruct", provider: "openrouter", modelRef: "QWEN_72B" },
  // AWS Bedrock
  { key: "claude-sonnet", name: "Claude Sonnet 4.5", provider: "bedrock", modelRef: "CLAUDE_SONNET" },
  // Existing models
  { key: "gemini-pro", name: "Gemini Pro 3.0", provider: "gemini" },
  { key: "gpt-5-mini", name: "GPT-5-mini", provider: "azure" },
  // Coming soon
  { key: "openbiollm-70b", name: "OpenBioLLM-70B", provider: "coming-soon" },
  { key: "meditron-70b", name: "Llama-3-Meditron-70B", provider: "coming-soon" },
];

async function runModel(
  model: ModelConfig,
  ocrText: string,
  prompt: string
): Promise<ModelRunResult> {
  const startTime = Date.now();

  // Coming soon models
  if (model.provider === "coming-soon") {
    return {
      modelName: model.name,
      modelId: model.key,
      success: false,
      error: "Coming Soon",
    };
  }

  try {
    let content: string;
    let inputTokens: number | undefined;
    let outputTokens: number | undefined;

    if (model.provider === "openrouter") {
      if (!isOpenRouterConfigured()) {
        return {
          modelName: model.name,
          modelId: model.key,
          success: false,
          error: "OpenRouter API key not configured",
        };
      }
      const result = await callOpenRouter(
        model.modelRef as OpenRouterModel,
        prompt,
        ocrText
      );
      if (!result.success) {
        return {
          modelName: model.name,
          modelId: model.key,
          success: false,
          error: result.error,
          latencyMs: result.latencyMs,
        };
      }
      content = result.content!;
      inputTokens = result.inputTokens;
      outputTokens = result.outputTokens;
    } else if (model.provider === "bedrock") {
      if (!isBedrockConfigured()) {
        return {
          modelName: model.name,
          modelId: model.key,
          success: false,
          error: "AWS Bedrock credentials not configured",
        };
      }
      const result = await callBedrock(
        model.modelRef as BedrockModel,
        prompt,
        ocrText
      );
      if (!result.success) {
        return {
          modelName: model.name,
          modelId: model.key,
          success: false,
          error: result.error,
          latencyMs: result.latencyMs,
        };
      }
      content = result.content!;
      inputTokens = result.inputTokens;
      outputTokens = result.outputTokens;
    } else if (model.provider === "azure") {
      content = await callAzureOpenAI(prompt, ocrText);
    } else if (model.provider === "gemini") {
      // For Gemini, we'll use the text-to-SOAP prompt (non-image)
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await geminiModel.generateContent(`${prompt}\n\nOCR Text:\n${ocrText}`);
      content = result.response.text();
    } else {
      return {
        modelName: model.name,
        modelId: model.key,
        success: false,
        error: "Unknown provider",
      };
    }

    const latencyMs = Date.now() - startTime;

    // Try to parse as JSON
    let parsedOutput: any;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
      parsedOutput = JSON.parse(jsonStr);
    } catch {
      parsedOutput = { raw_response: content };
    }

    // Extract confidence if available
    const confidenceScore =
      parsedOutput?.confidence_scores?.overall ||
      parsedOutput?.metadata?.confidence ||
      undefined;

    return {
      modelName: model.name,
      modelId: model.key,
      success: true,
      output: parsedOutput,
      latencyMs,
      inputTokens,
      outputTokens,
      confidenceScore,
    };
  } catch (error: any) {
    return {
      modelName: model.name,
      modelId: model.key,
      success: false,
      error: error.message || "Unknown error",
      latencyMs: Date.now() - startTime,
    };
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const formData = await request.formData();
    const imageFile = formData.get("image") as File;

    if (!imageFile) {
      return NextResponse.json(
        { success: false, error: "No image provided" },
        { status: 400 }
      );
    }

    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString("base64");
    const mimeType = imageFile.type;
    const imageHash = generateImageHash(buffer);

    // Step 1: OCR with Gemini Flash (frozen layer)
    let ocrText: string;
    try {
      ocrText = await callGeminiWithImage(
        "flash",
        OCR_EXTRACTION_PROMPT,
        base64Image,
        mimeType
      );
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: `OCR failed: ${error.message}` },
        { status: 500 }
      );
    }

    // Step 2: Run all models in parallel
    const modelPromises = ALL_MODELS.map((model) =>
      runModel(model, ocrText, SOAP_FROM_TEXT_ENHANCED_PROMPT)
    );

    const results = await Promise.all(modelPromises);

    // Save results for survey
    const runId = generateRunId();
    saveComparisonRun({
      id: runId,
      timestamp: new Date().toISOString(),
      imageHash,
      ocrText,
      results,
    });

    const totalTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      runId,
      ocrText,
      results,
      totalTime,
      modelsRun: results.length,
      modelsSucceeded: results.filter((r) => r.success).length,
    });
  } catch (error: any) {
    console.error("Compare API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Processing failed" },
      { status: 500 }
    );
  }
}
