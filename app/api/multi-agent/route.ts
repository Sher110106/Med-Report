import { NextRequest, NextResponse } from "next/server";
import { callGeminiWithImage, callGeminiWithText } from "@/lib/gemini";
import { callAzureOpenAI, callAzureOpenAIWithImage } from "@/lib/azure-openai";
import {
  MULTI_OCR_PROMPT,
  MULTI_CLASSIFICATION_PROMPT,
  MULTI_ENTITY_EXTRACTION_PROMPT,
  MULTI_LABS_EXTRACTION_PROMPT,
  MULTI_AGENT_VALIDATOR_PROMPT,
} from "@/lib/prompts";

// Types for multi-agent processing
interface StepResult {
  modelA: {
    name: string;
    result: any;
    confidence: number;
    processingTime: number;
  };
  modelB: {
    name: string;
    result: any;
    confidence: number;
    processingTime: number;
  };
  selected: "A" | "B" | "VALIDATED";
  selectedResult: any;
  selectionReason: string;
}

interface MultiAgentResponse {
  success: boolean;
  steps: {
    ocr: StepResult;
    classification: StepResult;
    extraction: StepResult;
    labs?: StepResult;
  };
  finalResult: any;
  totalProcessingTime: number;
  pipelineTrace: string[];
}

// Helper to parse JSON from model response
function parseJsonResponse(text: string): any {
  // Remove markdown code blocks if present
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  return JSON.parse(cleaned.trim());
}

// Helper to extract confidence from result
function extractConfidence(result: any, field: string): number {
  if (typeof result === "object" && result !== null) {
    // Try direct field access
    if (field in result) return result[field];
    // Try metadata
    if (result.metadata && field in result.metadata) return result.metadata[field];
    // Try common confidence fields
    const confidenceFields = [
      "ocr_confidence",
      "classification_confidence",
      "overall_extraction_confidence",
      "overall_labs_confidence",
      "confidence",
      "confidence_score",
    ];
    for (const f of confidenceFields) {
      if (f in result) return result[f];
      if (result.metadata && f in result.metadata) return result.metadata[f];
    }
  }
  return 0.5; // Default confidence if not found
}

// Decision logic: compare confidences and select best result
function selectBestResult(
  resultA: any,
  confidenceA: number,
  resultB: any,
  confidenceB: number,
  threshold: number = 0.1
): { selected: "A" | "B"; reason: string } {
  const diff = confidenceA - confidenceB;

  if (diff > threshold) {
    return { selected: "A", reason: `Model A higher confidence (${confidenceA.toFixed(2)} vs ${confidenceB.toFixed(2)})` };
  } else if (diff < -threshold) {
    return { selected: "B", reason: `Model B higher confidence (${confidenceB.toFixed(2)} vs ${confidenceA.toFixed(2)})` };
  } else {
    // Similar confidence - prefer Model A (Gemini as primary)
    return { selected: "A", reason: `Similar confidence, preferring primary model A (${confidenceA.toFixed(2)} vs ${confidenceB.toFixed(2)})` };
  }
}

// Step 1: OCR Extraction
async function runOCRStep(
  imageBase64: string,
  mimeType: string
): Promise<StepResult> {
  // Model A: Gemini Flash
  const startA = Date.now();
  const responseA = await callGeminiWithImage("flash", MULTI_OCR_PROMPT, imageBase64, mimeType);
  const timeA = Date.now() - startA;
  let resultA: any;
  let confidenceA = 0.5;
  try {
    resultA = parseJsonResponse(responseA);
    confidenceA = extractConfidence(resultA, "ocr_confidence");
  } catch {
    resultA = { raw_text: responseA, ocr_confidence: 0.5 };
  }

  // Model B: Azure GPT-4o (Vision)
  const startB = Date.now();
  const responseB = await callAzureOpenAIWithImage(MULTI_OCR_PROMPT, imageBase64, mimeType);
  const timeB = Date.now() - startB;
  let resultB: any;
  let confidenceB = 0.5;
  try {
    resultB = parseJsonResponse(responseB);
    confidenceB = extractConfidence(resultB, "ocr_confidence");
  } catch {
    resultB = { raw_text: responseB, ocr_confidence: 0.5 };
  }

  const { selected, reason } = selectBestResult(resultA, confidenceA, resultB, confidenceB);

  return {
    modelA: { name: "Gemini Flash", result: resultA, confidence: confidenceA, processingTime: timeA },
    modelB: { name: "Azure GPT-4o", result: resultB, confidence: confidenceB, processingTime: timeB },
    selected,
    selectedResult: selected === "A" ? resultA : resultB,
    selectionReason: reason,
  };
}

// Step 2: Classification
async function runClassificationStep(ocrText: string): Promise<StepResult> {
  const prompt = MULTI_CLASSIFICATION_PROMPT.replace("{{RAW_OCR_TEXT}}", ocrText);

  // Model A: Gemini Pro
  const startA = Date.now();
  const responseA = await callGeminiWithText("pro", prompt, "");
  const timeA = Date.now() - startA;
  let resultA: any;
  let confidenceA = 0.5;
  try {
    resultA = parseJsonResponse(responseA);
    confidenceA = extractConfidence(resultA, "classification_confidence");
  } catch {
    resultA = { scenario: "UNKNOWN", classification_confidence: 0.5 };
  }

  // Model B: Azure GPT-5-mini
  const startB = Date.now();
  const responseB = await callAzureOpenAI(prompt, ocrText);
  const timeB = Date.now() - startB;
  let resultB: any;
  let confidenceB = 0.5;
  try {
    resultB = parseJsonResponse(responseB);
    confidenceB = extractConfidence(resultB, "classification_confidence");
  } catch {
    resultB = { scenario: "UNKNOWN", classification_confidence: 0.5 };
  }

  const { selected, reason } = selectBestResult(resultA, confidenceA, resultB, confidenceB);

  return {
    modelA: { name: "Gemini Pro", result: resultA, confidence: confidenceA, processingTime: timeA },
    modelB: { name: "Azure GPT-5-mini", result: resultB, confidence: confidenceB, processingTime: timeB },
    selected,
    selectedResult: selected === "A" ? resultA : resultB,
    selectionReason: reason,
  };
}

// Step 3: Entity Extraction (SOAP)
async function runEntityExtractionStep(correctedText: string): Promise<StepResult> {
  const prompt = MULTI_ENTITY_EXTRACTION_PROMPT.replace("{{CLEANED_OCR_TEXT}}", correctedText);

  // Model A: Gemini Pro
  const startA = Date.now();
  const responseA = await callGeminiWithText("pro", prompt, "");
  const timeA = Date.now() - startA;
  let resultA: any;
  let confidenceA = 0.5;
  try {
    resultA = parseJsonResponse(responseA);
    confidenceA = extractConfidence(resultA, "overall_extraction_confidence");
  } catch {
    resultA = { error: "Failed to parse", raw: responseA };
  }

  // Model B: Azure GPT-5-mini
  const startB = Date.now();
  const responseB = await callAzureOpenAI(prompt, correctedText);
  const timeB = Date.now() - startB;
  let resultB: any;
  let confidenceB = 0.5;
  try {
    resultB = parseJsonResponse(responseB);
    confidenceB = extractConfidence(resultB, "overall_extraction_confidence");
  } catch {
    resultB = { error: "Failed to parse", raw: responseB };
  }

  const { selected, reason } = selectBestResult(resultA, confidenceA, resultB, confidenceB);

  return {
    modelA: { name: "Gemini Pro", result: resultA, confidence: confidenceA, processingTime: timeA },
    modelB: { name: "Azure GPT-5-mini", result: resultB, confidence: confidenceB, processingTime: timeB },
    selected,
    selectedResult: selected === "A" ? resultA : resultB,
    selectionReason: reason,
  };
}

// Step 4: Labs Extraction
async function runLabsExtractionStep(correctedText: string): Promise<StepResult> {
  const prompt = MULTI_LABS_EXTRACTION_PROMPT.replace("{{CLEANED_OCR_TEXT}}", correctedText);

  // Model A: Gemini Pro
  const startA = Date.now();
  const responseA = await callGeminiWithText("pro", prompt, "");
  const timeA = Date.now() - startA;
  let resultA: any;
  let confidenceA = 0.5;
  try {
    resultA = parseJsonResponse(responseA);
    confidenceA = extractConfidence(resultA, "overall_labs_confidence");
  } catch {
    resultA = { error: "Failed to parse", raw: responseA };
  }

  // Model B: Azure GPT-5-mini
  const startB = Date.now();
  const responseB = await callAzureOpenAI(prompt, correctedText);
  const timeB = Date.now() - startB;
  let resultB: any;
  let confidenceB = 0.5;
  try {
    resultB = parseJsonResponse(responseB);
    confidenceB = extractConfidence(resultB, "overall_labs_confidence");
  } catch {
    resultB = { error: "Failed to parse", raw: responseB };
  }

  const { selected, reason } = selectBestResult(resultA, confidenceA, resultB, confidenceB);

  return {
    modelA: { name: "Gemini Pro", result: resultA, confidence: confidenceA, processingTime: timeA },
    modelB: { name: "Azure GPT-5-mini", result: resultB, confidence: confidenceB, processingTime: timeB },
    selected,
    selectedResult: selected === "A" ? resultA : resultB,
    selectionReason: reason,
  };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const pipelineTrace: string[] = [];

  try {
    const formData = await request.formData();
    const imageFile = formData.get("image") as File;
    const fastMode = formData.get("fastMode") === "true";

    if (!imageFile) {
      return NextResponse.json({ success: false, error: "No image provided" }, { status: 400 });
    }

    // Convert image to base64
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const imageBase64 = buffer.toString("base64");
    const mimeType = imageFile.type;

    pipelineTrace.push("Starting multi-agent pipeline...");

    // Step 1: OCR
    pipelineTrace.push("Step 1: Running OCR extraction with dual models...");
    const ocrStep = await runOCRStep(imageBase64, mimeType);
    pipelineTrace.push(`Step 1 Complete: Selected ${ocrStep.selected === "A" ? ocrStep.modelA.name : ocrStep.modelB.name} - ${ocrStep.selectionReason}`);

    const rawText = ocrStep.selectedResult.raw_text || "";

    // Step 2: Classification
    pipelineTrace.push("Step 2: Running scenario classification with dual models...");
    const classificationStep = await runClassificationStep(rawText);
    pipelineTrace.push(`Step 2 Complete: Selected ${classificationStep.selected === "A" ? classificationStep.modelA.name : classificationStep.modelB.name} - ${classificationStep.selectionReason}`);

    const scenario = classificationStep.selectedResult.scenario || "SOAP_NOTE";
    const correctedText = classificationStep.selectedResult.corrected_text || rawText;

    // Step 3: Entity Extraction
    pipelineTrace.push("Step 3: Running entity extraction with dual models...");
    const extractionStep = await runEntityExtractionStep(correctedText);
    pipelineTrace.push(`Step 3 Complete: Selected ${extractionStep.selected === "A" ? extractionStep.modelA.name : extractionStep.modelB.name} - ${extractionStep.selectionReason}`);

    // Step 4: Labs Extraction (if applicable)
    let labsStep: StepResult | undefined;
    if (scenario === "LAB_REPORT" || scenario === "SOAP_NOTE") {
      pipelineTrace.push("Step 4: Running labs extraction with dual models...");
      labsStep = await runLabsExtractionStep(correctedText);
      pipelineTrace.push(`Step 4 Complete: Selected ${labsStep.selected === "A" ? labsStep.modelA.name : labsStep.modelB.name} - ${labsStep.selectionReason}`);
    }

    const totalTime = Date.now() - startTime;
    pipelineTrace.push(`Pipeline complete in ${totalTime}ms`);

    // Combine final results
    const finalResult = {
      scenario,
      rawOcrText: rawText,
      correctedText,
      soapNote: extractionStep.selectedResult.soap_note || extractionStep.selectedResult,
      labs: labsStep?.selectedResult,
    };

    const response: MultiAgentResponse = {
      success: true,
      steps: {
        ocr: ocrStep,
        classification: classificationStep,
        extraction: extractionStep,
        labs: labsStep,
      },
      finalResult,
      totalProcessingTime: totalTime,
      pipelineTrace,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Multi-agent pipeline error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Pipeline processing failed",
        pipelineTrace,
      },
      { status: 500 }
    );
  }
}
