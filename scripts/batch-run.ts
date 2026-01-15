/**
 * Batch Processing Script for Medical Note Extraction
 * 
 * Runs 10 images x 7 models x 2 prompts = 140 JSON outputs
 * 
 * Usage: npx tsx scripts/batch-run.ts
 */

// Load environment variables from .env.local
import { config } from "dotenv";
config({ path: ".env.local" });

import fs from "fs";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { callAzureOpenAI } from "../lib/azure-openai";
import {
  callOpenRouter,
  OPENROUTER_MODELS,
  isOpenRouterConfigured,
  OpenRouterModel,
} from "../lib/openrouter";
import {
  callBedrock,
  BEDROCK_MODELS,
  isBedrockConfigured,
  BedrockModel,
} from "../lib/bedrock";
import {
  OCR_EXTRACTION_PROMPT,
  SOAP_FROM_TEXT_ENHANCED_PROMPT,
  LABS_EXTRACTION_PROMPT,
} from "../lib/prompts";

// ============================================================================
// CONFIGURATION
// ============================================================================

const PHOTOS_DIR = path.join(process.cwd(), "photos");
const OUTPUT_DIR = path.join(process.cwd(), "data", "batch-results");

// Prompts to test
const PROMPTS = [
  { key: "soap_enhanced", name: "SOAP Enhanced", prompt: SOAP_FROM_TEXT_ENHANCED_PROMPT },
  { key: "labs_diagnostics", name: "Labs Diagnostics", prompt: LABS_EXTRACTION_PROMPT },
];

// Models to run (7 active models)
interface ModelConfig {
  key: string;
  name: string;
  provider: "openrouter" | "bedrock" | "azure" | "gemini";
  modelRef?: OpenRouterModel | BedrockModel | string;
}

const MODELS: ModelConfig[] = [
  { key: "deepseek-v3.2", name: "DeepSeek V3.2", provider: "openrouter", modelRef: "DEEPSEEK_V3_2" },
  { key: "glm-4.7", name: "GLM 4.7", provider: "openrouter", modelRef: "GLM_4_7" },
  { key: "kimi-k2", name: "Kimi K2 Thinking", provider: "openrouter", modelRef: "KIMI_K2" },
  { key: "qwen-72b", name: "Qwen2.5-72B-Instruct", provider: "openrouter", modelRef: "QWEN_72B" },
  { key: "claude-sonnet", name: "Claude Sonnet 4.5", provider: "bedrock", modelRef: "CLAUDE_SONNET" },
  { key: "gemini-pro", name: "Gemini Pro 3.0", provider: "gemini" },
  { key: "gpt-5-mini", name: "GPT-5-mini", provider: "azure" },
];

// ============================================================================
// LOGGING UTILITIES
// ============================================================================

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(message: string, color: string = colors.reset) {
  const timestamp = new Date().toISOString();
  console.log(`${colors.dim}[${timestamp}]${colors.reset} ${color}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log("\n" + "=".repeat(80));
  console.log(`${colors.bright}${colors.cyan}  ${title}${colors.reset}`);
  console.log("=".repeat(80) + "\n");
}

function logProgress(current: number, total: number, description: string) {
  const percentage = Math.round((current / total) * 100);
  const bar = "█".repeat(Math.floor(percentage / 5)) + "░".repeat(20 - Math.floor(percentage / 5));
  console.log(`${colors.blue}[${bar}] ${percentage}%${colors.reset} - ${description}`);
}

function logSuccess(message: string) {
  log(`✅ ${message}`, colors.green);
}

function logError(message: string) {
  log(`❌ ${message}`, colors.red);
}

function logWarning(message: string) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logInfo(message: string) {
  log(`ℹ️  ${message}`, colors.blue);
}

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

async function callGeminiWithImage(
  prompt: string,
  base64Image: string,
  mimeType: string
): Promise<string> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
  
  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        data: base64Image,
        mimeType: mimeType,
      },
    },
  ]);
  
  return result.response.text();
}

async function runOCR(base64Image: string, mimeType: string, imageName: string): Promise<string> {
  logInfo(`Running OCR on ${imageName}...`);
  const startTime = Date.now();
  
  const ocrText = await callGeminiWithImage(OCR_EXTRACTION_PROMPT, base64Image, mimeType);
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  logSuccess(`OCR completed for ${imageName} in ${duration}s (${ocrText.length} chars)`);
  
  return ocrText;
}

async function runModel(
  model: ModelConfig,
  ocrText: string,
  prompt: string
): Promise<{ success: boolean; output?: any; error?: string; latencyMs: number }> {
  const startTime = Date.now();

  try {
    let content: string;

    if (model.provider === "openrouter") {
      if (!isOpenRouterConfigured()) {
        return { success: false, error: "OpenRouter not configured", latencyMs: 0 };
      }
      const result = await callOpenRouter(model.modelRef as OpenRouterModel, prompt, ocrText);
      if (!result.success) {
        return { success: false, error: result.error, latencyMs: result.latencyMs || 0 };
      }
      content = result.content!;
    } else if (model.provider === "bedrock") {
      if (!isBedrockConfigured()) {
        return { success: false, error: "AWS Bedrock not configured", latencyMs: 0 };
      }
      const result = await callBedrock(model.modelRef as BedrockModel, prompt, ocrText);
      if (!result.success) {
        return { success: false, error: result.error, latencyMs: result.latencyMs || 0 };
      }
      content = result.content!;
    } else if (model.provider === "azure") {
      content = await callAzureOpenAI(prompt, ocrText);
    } else if (model.provider === "gemini") {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      const geminiModel = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" });
      const result = await geminiModel.generateContent(`${prompt}\n\nOCR Text:\n${ocrText}`);
      content = result.response.text();
    } else {
      return { success: false, error: "Unknown provider", latencyMs: 0 };
    }

    const latencyMs = Date.now() - startTime;

    // Try to parse as JSON
    let parsedOutput: any;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
      parsedOutput = JSON.parse(jsonStr);
    } catch {
      parsedOutput = { raw_response: content };
    }

    return { success: true, output: parsedOutput, latencyMs };
  } catch (error: any) {
    return { success: false, error: error.message, latencyMs: Date.now() - startTime };
  }
}

function getImageFiles(): string[] {
  const files = fs.readdirSync(PHOTOS_DIR);
  return files
    .filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f))
    .sort();
}

function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    logInfo(`Created output directory: ${OUTPUT_DIR}`);
  }
}

function generateOutputFilename(imageName: string, promptKey: string, modelKey: string): string {
  // Remove extension from image name
  const imageBase = imageName.replace(/\.[^.]+$/, "");
  return `${imageBase}__${promptKey}__${modelKey}.json`;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  logSection("BATCH PROCESSING SCRIPT - Medical Note Extraction");
  
  log(`Start Time: ${new Date().toLocaleString()}`, colors.bright);
  log(`Working Directory: ${process.cwd()}`);
  log(`Photos Directory: ${PHOTOS_DIR}`);
  log(`Output Directory: ${OUTPUT_DIR}`);
  
  // Validate environment
  logSection("ENVIRONMENT CHECK");
  
  const envChecks = [
    { name: "GEMINI_API_KEY", value: !!process.env.GEMINI_API_KEY },
    { name: "OPENROUTER_API_KEY", value: isOpenRouterConfigured() },
    { name: "AWS Bedrock", value: isBedrockConfigured() },
    { name: "AZURE_OPENAI_API_KEY", value: !!process.env.AZURE_OPENAI_API_KEY },
  ];
  
  envChecks.forEach((check) => {
    if (check.value) {
      logSuccess(`${check.name} configured`);
    } else {
      logWarning(`${check.name} NOT configured - related models will fail`);
    }
  });
  
  // Get images
  const images = getImageFiles();
  if (images.length === 0) {
    logError("No images found in photos directory!");
    process.exit(1);
  }
  
  logInfo(`Found ${images.length} images to process`);
  images.forEach((img, i) => log(`  ${i + 1}. ${img}`));
  
  // Calculate totals
  const totalJobs = images.length * MODELS.length * PROMPTS.length;
  logInfo(`Total jobs to run: ${images.length} images × ${MODELS.length} models × ${PROMPTS.length} prompts = ${totalJobs} JSONs`);
  
  // Ensure output directory exists
  ensureOutputDir();
  
  // Statistics
  const stats = {
    total: totalJobs,
    success: 0,
    failed: 0,
    skipped: 0,
  };
  
  let jobNumber = 0;
  
  // Process each image
  logSection("PROCESSING IMAGES");
  
  for (let imgIndex = 0; imgIndex < images.length; imgIndex++) {
    const imageName = images[imgIndex];
    const imagePath = path.join(PHOTOS_DIR, imageName);
    
    logSection(`IMAGE ${imgIndex + 1}/${images.length}: ${imageName}`);
    
    // Read and encode image
    logInfo(`Reading image file...`);
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString("base64");
    const ext = path.extname(imageName).toLowerCase();
    const mimeType = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
    logSuccess(`Image loaded (${(imageBuffer.length / 1024).toFixed(1)} KB, ${mimeType})`);
    
    // Run OCR once per image
    let ocrText: string;
    try {
      ocrText = await runOCR(base64Image, mimeType, imageName);
    } catch (error: any) {
      logError(`OCR failed for ${imageName}: ${error.message}`);
      // Skip all jobs for this image
      const skippedJobs = MODELS.length * PROMPTS.length;
      stats.skipped += skippedJobs;
      jobNumber += skippedJobs;
      continue;
    }
    
    // Save OCR text
    const ocrFilename = `${imageName.replace(/\.[^.]+$/, "")}__ocr.txt`;
    fs.writeFileSync(path.join(OUTPUT_DIR, ocrFilename), ocrText);
    logInfo(`Saved OCR text to ${ocrFilename}`);
    
    // Process each prompt
    for (const promptConfig of PROMPTS) {
      log(`\n--- Prompt: ${promptConfig.name} ---\n`, colors.magenta);
      
      // Process each model
      for (const model of MODELS) {
        jobNumber++;
        const outputFilename = generateOutputFilename(imageName, promptConfig.key, model.key);
        const outputPath = path.join(OUTPUT_DIR, outputFilename);
        
        logProgress(jobNumber, totalJobs, `${imageName} → ${promptConfig.key} → ${model.name}`);
        
        // Check if already exists (skip if so)
        if (fs.existsSync(outputPath)) {
          logWarning(`Skipping (already exists): ${outputFilename}`);
          stats.skipped++;
          continue;
        }
        
        logInfo(`Running ${model.name}...`);
        const startTime = Date.now();
        
        try {
          const result = await runModel(model, ocrText, promptConfig.prompt);
          
          if (result.success) {
            // Save result
            const outputData = {
              metadata: {
                image: imageName,
                prompt: promptConfig.key,
                promptName: promptConfig.name,
                model: model.key,
                modelName: model.name,
                provider: model.provider,
                timestamp: new Date().toISOString(),
                latencyMs: result.latencyMs,
              },
              output: result.output,
            };
            
            fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
            logSuccess(`Saved ${outputFilename} (${(result.latencyMs / 1000).toFixed(2)}s)`);
            stats.success++;
          } else {
            // Save error result
            const errorData = {
              metadata: {
                image: imageName,
                prompt: promptConfig.key,
                promptName: promptConfig.name,
                model: model.key,
                modelName: model.name,
                provider: model.provider,
                timestamp: new Date().toISOString(),
                error: result.error,
              },
              output: null,
            };
            
            fs.writeFileSync(outputPath, JSON.stringify(errorData, null, 2));
            logError(`Failed ${model.name}: ${result.error}`);
            stats.failed++;
          }
        } catch (error: any) {
          logError(`Exception for ${model.name}: ${error.message}`);
          stats.failed++;
        }
        
        // Small delay between API calls to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  }
  
  // Final summary
  logSection("BATCH PROCESSING COMPLETE");
  
  log(`End Time: ${new Date().toLocaleString()}`, colors.bright);
  console.log("");
  log(`Total Jobs:    ${stats.total}`, colors.blue);
  logSuccess(`Successful:    ${stats.success}`);
  logError(`Failed:        ${stats.failed}`);
  logWarning(`Skipped:       ${stats.skipped}`);
  console.log("");
  log(`Output saved to: ${OUTPUT_DIR}`);
  
  // List output files
  const outputFiles = fs.readdirSync(OUTPUT_DIR).filter((f) => f.endsWith(".json"));
  log(`Total JSON files in output: ${outputFiles.length}`);
}

// Run the script
main().catch((error) => {
  logError(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
