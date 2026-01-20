/**
 * Deep Embedding-Based Medical Note Evaluation
 * 
 * Uses Azure OpenAI text-embedding-3-large for semantic similarity analysis
 * Only evaluates SOAP Enhanced outputs (not Labs Diagnostics)
 * 
 * Metrics:
 * - Semantic similarity (embedding cosine similarity)
 * - Highlight recall using embedding matching
 * - Section-level semantic analysis
 * - BERTScore-like precision/recall/F1
 * 
 * Usage: npx tsx scripts/evaluate-embeddings.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import fs from "fs";
import path from "path";
import { AzureOpenAI } from "openai";

// ============================================================================
// CONFIGURATION
// ============================================================================

const PROJECT_ROOT = process.cwd();
const BATCH_RESULTS_DIR = path.join(PROJECT_ROOT, "data", "batch-results");
const REFERENCE_DIR = PROJECT_ROOT;

const AZURE_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT || "https://ai-sherpartap11019601ai587562462851.openai.azure.com/";
const AZURE_API_KEY = process.env.AZURE_KEY || process.env.AZURE_OPENAI_API_KEY;
const EMBEDDING_MODEL = "text-embedding-3-large";
const API_VERSION = "2024-12-01-preview";

// Map image numbers to reference files
const IMAGE_TO_REFERENCE: Record<string, string> = {
  "medical_note_05": "5.json",
  "medical_note_06": "6.json",
  "medical_note_07": "7.json",
  "medical_note_08": "8.json",
  "medical_note_09": "9.json",
};

// ============================================================================
// AZURE OPENAI CLIENT
// ============================================================================

let embeddingClient: AzureOpenAI | null = null;

function getEmbeddingClient(): AzureOpenAI {
  if (!embeddingClient) {
    if (!AZURE_API_KEY) {
      throw new Error("AZURE_KEY or AZURE_OPENAI_API_KEY environment variable is not set");
    }
    embeddingClient = new AzureOpenAI({
      apiKey: AZURE_API_KEY,
      endpoint: AZURE_ENDPOINT,
      apiVersion: API_VERSION,
    });
  }
  return embeddingClient;
}

// Embedding cache to avoid redundant API calls
const embeddingCache: Map<string, number[]> = new Map();

async function getEmbedding(text: string): Promise<number[]> {
  // Check cache first
  const cacheKey = text.slice(0, 100); // Use first 100 chars as cache key
  if (embeddingCache.has(cacheKey)) {
    return embeddingCache.get(cacheKey)!;
  }

  const client = getEmbeddingClient();
  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text.slice(0, 8000), // Limit to avoid token limits
  });

  const embedding = response.data[0].embedding;
  embeddingCache.set(cacheKey, embedding);
  return embedding;
}

async function getEmbeddings(texts: string[]): Promise<number[][]> {
  // Filter out empty texts and batch request
  const validTexts = texts.filter(t => t.trim().length > 0);
  if (validTexts.length === 0) return [];

  const client = getEmbeddingClient();
  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: validTexts.map(t => t.slice(0, 8000)),
  });

  return response.data.map(d => d.embedding);
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ReferenceData {
  day: number;
  consultation: number;
  presenting_complaint: string;
  note: string;
  highlights: string[];
}

interface SOAPNote {
  subjective?: {
    chief_complaint?: string;
    hpi?: string;
    symptoms?: string[];
    patient_history?: string;
  };
  objective?: {
    vitals?: any;
    physical_exam?: any;
    labs_imaging?: string | null;
  };
  assessment?: {
    primary_diagnosis?: {
      value?: string;
      certainty_degree?: number;
      evidence_text?: string;
    };
    differential_diagnosis?: any[];
  };
  plan?: {
    medications?: any[];
    procedures_ordered?: string[];
    patient_instructions?: string;
  };
}

interface BatchResult {
  metadata: {
    image: string;
    prompt: string;
    promptName: string;
    model: string;
    modelName: string;
    provider: string;
    timestamp: string;
    latencyMs?: number;
    error?: string;
  };
  output: {
    soap_note?: SOAPNote;
  } | null;
}

interface EmbeddingMetrics {
  // Identification
  image: string;
  model: string;
  modelName: string;
  
  // Semantic Similarity Scores
  overallSimilarity: number;
  subjectiveSimilarity: number;
  objectiveSimilarity: number;
  assessmentSimilarity: number;
  planSimilarity: number;
  
  // Highlight Analysis (embedding-based)
  highlightRecallSemantic: number;
  highlightsCoveredSemantic: number;
  highlightsTotal: number;
  avgHighlightSimilarity: number;
  
  // BERTScore-like metrics
  precision: number;
  recall: number;
  f1Score: number;
  
  // Diagnosis embedding match
  diagnosisSemanticMatch: number;
  
  // Latency
  latencyMs: number;
  
  // Error handling
  hasError: boolean;
  errorMessage?: string;
}

interface AggregatedEmbeddingResults {
  byModel: Record<string, EmbeddingMetrics[]>;
  byImage: Record<string, EmbeddingMetrics[]>;
  all: EmbeddingMetrics[];
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function extractFullSOAPText(soap: SOAPNote): string {
  const parts: string[] = [];
  
  if (soap.subjective) {
    if (soap.subjective.chief_complaint) parts.push(soap.subjective.chief_complaint);
    if (soap.subjective.hpi) parts.push(soap.subjective.hpi);
    if (soap.subjective.symptoms) parts.push(soap.subjective.symptoms.join(" "));
    if (soap.subjective.patient_history) parts.push(soap.subjective.patient_history);
  }
  
  if (soap.objective) {
    if (soap.objective.physical_exam) {
      if (typeof soap.objective.physical_exam === "string") {
        parts.push(soap.objective.physical_exam);
      } else if (soap.objective.physical_exam.findings) {
        parts.push(soap.objective.physical_exam.findings.join(" "));
      }
      if (soap.objective.physical_exam.text_raw) {
        parts.push(soap.objective.physical_exam.text_raw);
      }
    }
  }
  
  if (soap.assessment) {
    if (soap.assessment.primary_diagnosis?.value) {
      parts.push(soap.assessment.primary_diagnosis.value);
    }
    if (soap.assessment.differential_diagnosis) {
      soap.assessment.differential_diagnosis.forEach((d: any) => {
        if (typeof d === "string") parts.push(d);
        else if (d.value) parts.push(d.value);
      });
    }
  }
  
  if (soap.plan) {
    if (soap.plan.medications) {
      soap.plan.medications.forEach((m: any) => {
        if (m.drug) parts.push(m.drug);
      });
    }
    if (soap.plan.procedures_ordered) parts.push(soap.plan.procedures_ordered.join(" "));
    if (soap.plan.patient_instructions) parts.push(soap.plan.patient_instructions);
  }
  
  return parts.join(" ");
}

function extractSectionText(soap: SOAPNote, section: "subjective" | "objective" | "assessment" | "plan"): string {
  const parts: string[] = [];
  
  if (section === "subjective" && soap.subjective) {
    if (soap.subjective.chief_complaint) parts.push(soap.subjective.chief_complaint);
    if (soap.subjective.hpi) parts.push(soap.subjective.hpi);
    if (soap.subjective.symptoms) parts.push(soap.subjective.symptoms.join(" "));
    if (soap.subjective.patient_history) parts.push(soap.subjective.patient_history);
  }
  
  if (section === "objective" && soap.objective) {
    if (soap.objective.physical_exam) {
      if (typeof soap.objective.physical_exam === "string") {
        parts.push(soap.objective.physical_exam);
      } else if (soap.objective.physical_exam.findings) {
        parts.push(soap.objective.physical_exam.findings.join(" "));
      }
    }
  }
  
  if (section === "assessment" && soap.assessment) {
    if (soap.assessment.primary_diagnosis?.value) {
      parts.push(soap.assessment.primary_diagnosis.value);
    }
    if (soap.assessment.differential_diagnosis) {
      soap.assessment.differential_diagnosis.forEach((d: any) => {
        if (typeof d === "string") parts.push(d);
        else if (d.value) parts.push(d.value);
      });
    }
  }
  
  if (section === "plan" && soap.plan) {
    if (soap.plan.medications) {
      soap.plan.medications.forEach((m: any) => {
        if (m.drug) parts.push(`${m.drug} ${m.dosage || ""} ${m.sig || ""}`);
      });
    }
    if (soap.plan.procedures_ordered) parts.push(soap.plan.procedures_ordered.join(" "));
    if (soap.plan.patient_instructions) parts.push(soap.plan.patient_instructions);
  }
  
  return parts.join(" ");
}

// ============================================================================
// EMBEDDING-BASED EVALUATION
// ============================================================================

async function evaluateWithEmbeddings(
  result: BatchResult,
  reference: ReferenceData
): Promise<EmbeddingMetrics> {
  const soap = result.output?.soap_note;
  
  // Handle error cases
  if (result.metadata.error || !result.output || !soap) {
    return {
      image: result.metadata.image,
      model: result.metadata.model,
      modelName: result.metadata.modelName,
      overallSimilarity: 0,
      subjectiveSimilarity: 0,
      objectiveSimilarity: 0,
      assessmentSimilarity: 0,
      planSimilarity: 0,
      highlightRecallSemantic: 0,
      highlightsCoveredSemantic: 0,
      highlightsTotal: reference.highlights.length,
      avgHighlightSimilarity: 0,
      precision: 0,
      recall: 0,
      f1Score: 0,
      diagnosisSemanticMatch: 0,
      latencyMs: result.metadata.latencyMs || 0,
      hasError: true,
      errorMessage: result.metadata.error || "No SOAP output"
    };
  }

  try {
    // Extract texts
    const soapFullText = extractFullSOAPText(soap);
    const referenceNote = reference.note;
    
    // Get embeddings for full texts
    const [soapEmbedding, refEmbedding] = await Promise.all([
      getEmbedding(soapFullText),
      getEmbedding(referenceNote)
    ]);
    
    const overallSimilarity = cosineSimilarity(soapEmbedding, refEmbedding);
    
    // Section-level similarity
    // Extract reference sections (approximate based on common patterns)
    const refSubjective = referenceNote.split(/PMH:|DHx:|DH:|SH:/i)[0] || "";
    const refPlan = referenceNote.match(/Plan:[\s\S]*/i)?.[0] || "";
    const refAssessment = referenceNote.match(/Imp[:\s][\s\S]*?(?=Plan:|$)/i)?.[0] || "";
    
    const soapSections = {
      subjective: extractSectionText(soap, "subjective"),
      objective: extractSectionText(soap, "objective"),
      assessment: extractSectionText(soap, "assessment"),
      plan: extractSectionText(soap, "plan")
    };
    
    // Get section embeddings
    const sectionEmbeddings = await Promise.all([
      soapSections.subjective ? getEmbedding(soapSections.subjective) : Promise.resolve([]),
      refSubjective ? getEmbedding(refSubjective) : Promise.resolve([]),
      soapSections.assessment ? getEmbedding(soapSections.assessment) : Promise.resolve([]),
      refAssessment ? getEmbedding(refAssessment) : Promise.resolve([]),
      soapSections.plan ? getEmbedding(soapSections.plan) : Promise.resolve([]),
      refPlan ? getEmbedding(refPlan) : Promise.resolve([])
    ]);
    
    const subjectiveSimilarity = sectionEmbeddings[0].length > 0 && sectionEmbeddings[1].length > 0
      ? cosineSimilarity(sectionEmbeddings[0], sectionEmbeddings[1])
      : 0;
    
    const assessmentSimilarity = sectionEmbeddings[2].length > 0 && sectionEmbeddings[3].length > 0
      ? cosineSimilarity(sectionEmbeddings[2], sectionEmbeddings[3])
      : 0;
    
    const planSimilarity = sectionEmbeddings[4].length > 0 && sectionEmbeddings[5].length > 0
      ? cosineSimilarity(sectionEmbeddings[4], sectionEmbeddings[5])
      : 0;
    
    // Highlight semantic recall
    const highlightEmbeddings = await getEmbeddings(reference.highlights);
    const soapSentences = soapFullText.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const soapSentenceEmbeddings = await getEmbeddings(soapSentences.slice(0, 20)); // Limit for performance
    
    let coveredHighlights = 0;
    let totalHighlightSimilarity = 0;
    const SEMANTIC_THRESHOLD = 0.7; // Similarity threshold for "covered"
    
    for (const highlightEmb of highlightEmbeddings) {
      let maxSim = 0;
      for (const sentenceEmb of soapSentenceEmbeddings) {
        const sim = cosineSimilarity(highlightEmb, sentenceEmb);
        if (sim > maxSim) maxSim = sim;
      }
      totalHighlightSimilarity += maxSim;
      if (maxSim >= SEMANTIC_THRESHOLD) {
        coveredHighlights++;
      }
    }
    
    const highlightRecallSemantic = reference.highlights.length > 0
      ? coveredHighlights / reference.highlights.length
      : 0;
    
    const avgHighlightSimilarity = highlightEmbeddings.length > 0
      ? totalHighlightSimilarity / highlightEmbeddings.length
      : 0;
    
    // BERTScore-like P/R/F1
    // Precision: How much of SOAP is relevant to reference
    // Recall: How much of reference is captured in SOAP
    const refSentences = referenceNote.split(/[.!?\n]+/).filter(s => s.trim().length > 10);
    const refSentenceEmbeddings = await getEmbeddings(refSentences.slice(0, 20));
    
    // Recall: for each reference sentence, find max similarity to any SOAP sentence
    let recallSum = 0;
    for (const refEmb of refSentenceEmbeddings) {
      let maxSim = 0;
      for (const soapEmb of soapSentenceEmbeddings) {
        const sim = cosineSimilarity(refEmb, soapEmb);
        if (sim > maxSim) maxSim = sim;
      }
      recallSum += maxSim;
    }
    const recall = refSentenceEmbeddings.length > 0 ? recallSum / refSentenceEmbeddings.length : 0;
    
    // Precision: for each SOAP sentence, find max similarity to any reference sentence
    let precisionSum = 0;
    for (const soapEmb of soapSentenceEmbeddings) {
      let maxSim = 0;
      for (const refEmb of refSentenceEmbeddings) {
        const sim = cosineSimilarity(soapEmb, refEmb);
        if (sim > maxSim) maxSim = sim;
      }
      precisionSum += maxSim;
    }
    const precision = soapSentenceEmbeddings.length > 0 ? precisionSum / soapSentenceEmbeddings.length : 0;
    
    // F1
    const f1Score = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
    
    // Diagnosis semantic match
    let diagnosisSemanticMatch = 0;
    if (soap.assessment?.primary_diagnosis?.value) {
      const diagEmb = await getEmbedding(soap.assessment.primary_diagnosis.value);
      const impMatch = referenceNote.match(/Imp[:\s]+([^\n]+)/i);
      if (impMatch) {
        const refImpEmb = await getEmbedding(impMatch[1]);
        diagnosisSemanticMatch = cosineSimilarity(diagEmb, refImpEmb);
      }
    }
    
    return {
      image: result.metadata.image,
      model: result.metadata.model,
      modelName: result.metadata.modelName,
      overallSimilarity,
      subjectiveSimilarity,
      objectiveSimilarity: 0, // Hard to extract objective section from free-text
      assessmentSimilarity,
      planSimilarity,
      highlightRecallSemantic,
      highlightsCoveredSemantic: coveredHighlights,
      highlightsTotal: reference.highlights.length,
      avgHighlightSimilarity,
      precision,
      recall,
      f1Score,
      diagnosisSemanticMatch,
      latencyMs: result.metadata.latencyMs || 0,
      hasError: false
    };
  } catch (error: any) {
    return {
      image: result.metadata.image,
      model: result.metadata.model,
      modelName: result.metadata.modelName,
      overallSimilarity: 0,
      subjectiveSimilarity: 0,
      objectiveSimilarity: 0,
      assessmentSimilarity: 0,
      planSimilarity: 0,
      highlightRecallSemantic: 0,
      highlightsCoveredSemantic: 0,
      highlightsTotal: reference.highlights.length,
      avgHighlightSimilarity: 0,
      precision: 0,
      recall: 0,
      f1Score: 0,
      diagnosisSemanticMatch: 0,
      latencyMs: result.metadata.latencyMs || 0,
      hasError: true,
      errorMessage: error.message
    };
  }
}

// ============================================================================
// RESULTS GENERATION
// ============================================================================

function formatPercent(value: number): string {
  return (value * 100).toFixed(1) + "%";
}

function formatScore(value: number): string {
  return value.toFixed(3);
}

function generateEmbeddingResultsMarkdown(results: AggregatedEmbeddingResults): string {
  const lines: string[] = [];
  
  lines.push("# Deep Embedding-Based Model Evaluation Results");
  lines.push("");
  lines.push("> **Analysis Method**: Azure OpenAI `text-embedding-3-large` semantic embeddings");
  lines.push(`> Generated: ${new Date().toISOString()}`);
  lines.push(`> Total Evaluations: ${results.all.length} (SOAP Enhanced only)`);
  lines.push("");
  
  // =========================================================================
  // EXECUTIVE SUMMARY
  // =========================================================================
  lines.push("## Executive Summary");
  lines.push("");
  
  // Calculate model averages
  const modelAverages: Record<string, {
    overallSim: number;
    highlightRecall: number;
    avgHighlightSim: number;
    precision: number;
    recall: number;
    f1: number;
    diagnosisSim: number;
    count: number;
  }> = {};
  
  for (const [model, evals] of Object.entries(results.byModel)) {
    const validEvals = evals.filter(e => !e.hasError);
    modelAverages[model] = {
      overallSim: validEvals.reduce((s, e) => s + e.overallSimilarity, 0) / (validEvals.length || 1),
      highlightRecall: validEvals.reduce((s, e) => s + e.highlightRecallSemantic, 0) / (validEvals.length || 1),
      avgHighlightSim: validEvals.reduce((s, e) => s + e.avgHighlightSimilarity, 0) / (validEvals.length || 1),
      precision: validEvals.reduce((s, e) => s + e.precision, 0) / (validEvals.length || 1),
      recall: validEvals.reduce((s, e) => s + e.recall, 0) / (validEvals.length || 1),
      f1: validEvals.reduce((s, e) => s + e.f1Score, 0) / (validEvals.length || 1),
      diagnosisSim: validEvals.reduce((s, e) => s + e.diagnosisSemanticMatch, 0) / (validEvals.length || 1),
      count: validEvals.length
    };
  }
  
  // Sort by F1 score
  const modelRankings = Object.entries(modelAverages)
    .map(([model, avg]) => ({
      model,
      f1: avg.f1,
      overallSim: avg.overallSim
    }))
    .sort((a, b) => b.f1 - a.f1);
  
  lines.push("### Top Performing Models (Semantic F1 Score)");
  lines.push("");
  lines.push("| Rank | Model | F1 Score | Overall Similarity | Highlight Recall |");
  lines.push("|------|-------|----------|--------------------|--------------------|");
  modelRankings.forEach((m, i) => {
    const avg = modelAverages[m.model];
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "";
    lines.push(`| ${medal} ${i + 1} | ${m.model} | ${formatScore(m.f1)} | ${formatScore(m.overallSim)} | ${formatPercent(avg.highlightRecall)} |`);
  });
  lines.push("");
  
  // Key findings
  lines.push("### Key Findings");
  lines.push("");
  const bestModel = modelRankings[0];
  const worstModel = modelRankings[modelRankings.length - 1];
  lines.push(`- **Best Semantic Match**: \`${bestModel.model}\` with F1 score of ${formatScore(bestModel.f1)}`);
  lines.push(`- **Needs Improvement**: \`${worstModel.model}\` with F1 score of ${formatScore(worstModel.f1)}`);
  
  const bestPrecision = Object.entries(modelAverages).sort((a, b) => b[1].precision - a[1].precision)[0];
  const bestRecall = Object.entries(modelAverages).sort((a, b) => b[1].recall - a[1].recall)[0];
  lines.push(`- **Best Precision**: \`${bestPrecision[0]}\` at ${formatScore(bestPrecision[1].precision)} (least hallucination)`);
  lines.push(`- **Best Recall**: \`${bestRecall[0]}\` at ${formatScore(bestRecall[1].recall)} (most complete)`);
  lines.push("");
  
  // =========================================================================
  // METHODOLOGY
  // =========================================================================
  lines.push("---");
  lines.push("");
  lines.push("## Methodology");
  lines.push("");
  lines.push("### Embedding-Based Metrics");
  lines.push("");
  lines.push("| Metric | Description |");
  lines.push("|--------|-------------|");
  lines.push("| **Overall Similarity** | Cosine similarity between full SOAP text and reference note embeddings |");
  lines.push("| **Semantic Highlight Recall** | % of reference highlights with ≥0.7 similarity to any SOAP sentence |");
  lines.push("| **Avg Highlight Similarity** | Mean cosine similarity across all highlights |");
  lines.push("| **Precision** | Average max similarity of each SOAP sentence to reference (measures relevance) |");
  lines.push("| **Recall** | Average max similarity of each reference sentence to SOAP (measures coverage) |");
  lines.push("| **F1 Score** | Harmonic mean of precision and recall (BERTScore-like) |");
  lines.push("| **Diagnosis Similarity** | Cosine similarity between diagnosis and reference `Imp:` line |");
  lines.push("");
  lines.push("> **Model Used**: `text-embedding-3-large` via Azure OpenAI");
  lines.push("> **Similarity Threshold**: 0.7 for binary highlight coverage");
  lines.push("");
  
  // =========================================================================
  // PER-MODEL COMPARISON
  // =========================================================================
  lines.push("---");
  lines.push("");
  lines.push("## Per-Model Comparison");
  lines.push("");
  
  lines.push("### Semantic Similarity Metrics");
  lines.push("");
  lines.push("| Model | Overall Sim | Precision | Recall | F1 Score | Diagnosis Sim |");
  lines.push("|-------|-------------|-----------|--------|----------|---------------|");
  
  for (const [model, avg] of Object.entries(modelAverages)) {
    lines.push(`| ${model} | ${formatScore(avg.overallSim)} | ${formatScore(avg.precision)} | ${formatScore(avg.recall)} | ${formatScore(avg.f1)} | ${formatScore(avg.diagnosisSim)} |`);
  }
  lines.push("");
  
  lines.push("### Highlight Coverage Analysis");
  lines.push("");
  lines.push("| Model | Semantic Highlight Recall | Avg Highlight Similarity | Coverage Score |");
  lines.push("|-------|---------------------------|--------------------------|----------------|");
  
  for (const [model, avg] of Object.entries(modelAverages)) {
    const coverageScore = (avg.highlightRecall + avg.avgHighlightSim) / 2;
    lines.push(`| ${model} | ${formatPercent(avg.highlightRecall)} | ${formatScore(avg.avgHighlightSim)} | ${formatScore(coverageScore)} |`);
  }
  lines.push("");
  
  // =========================================================================
  // PER-IMAGE ANALYSIS
  // =========================================================================
  lines.push("---");
  lines.push("");
  lines.push("## Per-Image Analysis");
  lines.push("");
  
  const imageDescriptions: Record<string, string> = {
    "medical_note_05.png": "Eczema Flare-up",
    "medical_note_06.png": "Migraine",
    "medical_note_07.png": "Viral URTI/Influenza",
    "medical_note_08.png": "UTI",
    "medical_note_09.png": "Gastroenteritis"
  };
  
  for (const [image, evals] of Object.entries(results.byImage)) {
    const desc = imageDescriptions[image] || image;
    lines.push(`### ${image} - ${desc}`);
    lines.push("");
    
    const validEvals = evals.filter(e => !e.hasError);
    if (validEvals.length > 0) {
      lines.push("| Model | Overall Sim | F1 Score | Highlight Recall | Diagnosis Sim |");
      lines.push("|-------|-------------|----------|------------------|---------------|");
      
      for (const e of validEvals.sort((a, b) => b.f1Score - a.f1Score)) {
        lines.push(`| ${e.model} | ${formatScore(e.overallSimilarity)} | ${formatScore(e.f1Score)} | ${formatPercent(e.highlightRecallSemantic)} (${e.highlightsCoveredSemantic}/${e.highlightsTotal}) | ${formatScore(e.diagnosisSemanticMatch)} |`);
      }
      lines.push("");
    }
    
    const errors = evals.filter(e => e.hasError);
    if (errors.length > 0) {
      lines.push(`> ⚠️ ${errors.length} model(s) failed: ${errors.map(e => `${e.model} (${e.errorMessage})`).join(", ")}`);
      lines.push("");
    }
  }
  
  // =========================================================================
  // SECTION-LEVEL ANALYSIS
  // =========================================================================
  lines.push("---");
  lines.push("");
  lines.push("## Section-Level Semantic Analysis");
  lines.push("");
  lines.push("Similarity scores for individual SOAP sections compared to corresponding reference sections:");
  lines.push("");
  
  // Calculate section averages
  const sectionAverages: Record<string, { subj: number; assess: number; plan: number }> = {};
  
  for (const [model, evals] of Object.entries(results.byModel)) {
    const validEvals = evals.filter(e => !e.hasError);
    sectionAverages[model] = {
      subj: validEvals.reduce((s, e) => s + e.subjectiveSimilarity, 0) / (validEvals.length || 1),
      assess: validEvals.reduce((s, e) => s + e.assessmentSimilarity, 0) / (validEvals.length || 1),
      plan: validEvals.reduce((s, e) => s + e.planSimilarity, 0) / (validEvals.length || 1)
    };
  }
  
  lines.push("| Model | Subjective | Assessment | Plan |");
  lines.push("|-------|------------|------------|------|");
  
  for (const [model, avg] of Object.entries(sectionAverages)) {
    lines.push(`| ${model} | ${formatScore(avg.subj)} | ${formatScore(avg.assess)} | ${formatScore(avg.plan)} |`);
  }
  lines.push("");
  
  // =========================================================================
  // DETAILED RESULTS
  // =========================================================================
  lines.push("---");
  lines.push("");
  lines.push("## Detailed Results");
  lines.push("");
  lines.push("<details>");
  lines.push("<summary>Click to expand full results table</summary>");
  lines.push("");
  lines.push("| Image | Model | Overall | Precision | Recall | F1 | Highlight Recall | Diagnosis |");
  lines.push("|-------|-------|---------|-----------|--------|-----|------------------|-----------|");
  
  for (const e of results.all) {
    if (e.hasError) {
      lines.push(`| ${e.image.replace("medical_note_", "")} | ${e.model} | ❌ | - | - | - | - | - |`);
    } else {
      lines.push(`| ${e.image.replace("medical_note_", "")} | ${e.model} | ${formatScore(e.overallSimilarity)} | ${formatScore(e.precision)} | ${formatScore(e.recall)} | ${formatScore(e.f1Score)} | ${formatPercent(e.highlightRecallSemantic)} | ${formatScore(e.diagnosisSemanticMatch)} |`);
    }
  }
  
  lines.push("");
  lines.push("</details>");
  lines.push("");
  
  // =========================================================================
  // RECOMMENDATIONS
  // =========================================================================
  lines.push("---");
  lines.push("");
  lines.push("## Recommendations Based on Semantic Analysis");
  lines.push("");
  
  const top3 = modelRankings.slice(0, 3);
  lines.push("### Best Models (Ranked by Semantic F1)");
  lines.push("");
  lines.push(`1. **${top3[0]?.model}** - Highest F1 score (${formatScore(top3[0]?.f1 || 0)}) indicating best balance of precision and recall`);
  if (top3[1]) lines.push(`2. **${top3[1].model}** - Strong semantic match (${formatScore(top3[1].f1)})`);
  if (top3[2]) lines.push(`3. **${top3[2].model}** - Solid performance (${formatScore(top3[2].f1)})`);
  lines.push("");
  
  lines.push("### Interpretation Guide");
  lines.push("");
  lines.push("- **High Precision, Lower Recall**: Model is conservative, only includes highly relevant info but may miss details");
  lines.push("- **High Recall, Lower Precision**: Model is comprehensive but may include extraneous content");
  lines.push("- **High Overall Similarity**: Good semantic alignment with reference note structure");
  lines.push("- **High Diagnosis Similarity**: Accurate clinical impression matching");
  lines.push("");
  
  lines.push("---");
  lines.push("");
  lines.push("*Report generated by Deep Embedding-Based Evaluation Suite using Azure OpenAI text-embedding-3-large*");
  
  return lines.join("\n");
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log("=".repeat(80));
  console.log("  DEEP EMBEDDING-BASED EVALUATION (Azure OpenAI)");
  console.log("=".repeat(80));
  console.log("");
  
  // Verify Azure config
  console.log("Checking Azure OpenAI configuration...");
  if (!AZURE_API_KEY) {
    console.error("❌ AZURE_KEY or AZURE_OPENAI_API_KEY not found in .env.local");
    process.exit(1);
  }
  console.log(`  ✅ API Key configured`);
  console.log(`  ✅ Endpoint: ${AZURE_ENDPOINT}`);
  console.log(`  ✅ Model: ${EMBEDDING_MODEL}`);
  console.log("");
  
  // Load reference files
  console.log("Loading reference data...");
  const references: Record<string, ReferenceData> = {};
  
  for (const [imageBase, refFile] of Object.entries(IMAGE_TO_REFERENCE)) {
    const refPath = path.join(REFERENCE_DIR, refFile);
    if (fs.existsSync(refPath)) {
      const data = JSON.parse(fs.readFileSync(refPath, "utf-8"));
      references[imageBase] = data;
      console.log(`  ✅ Loaded ${refFile} (${data.highlights.length} highlights)`);
    } else {
      console.log(`  ⚠️ Reference file not found: ${refFile}`);
    }
  }
  
  console.log("");
  
  // Find SOAP Enhanced batch results only
  console.log("Finding SOAP Enhanced batch results...");
  const batchFiles = fs.readdirSync(BATCH_RESULTS_DIR)
    .filter(f => f.endsWith(".json"))
    .filter(f => f.includes("soap_enhanced")) // Only SOAP Enhanced
    .filter(f => Object.keys(IMAGE_TO_REFERENCE).some(img => f.startsWith(img)));
  
  console.log(`  Found ${batchFiles.length} SOAP Enhanced results to evaluate`);
  console.log("");
  
  // Evaluate each batch result with embeddings
  console.log("Running embedding-based evaluations...");
  console.log("(This will make API calls to Azure OpenAI for embeddings)");
  console.log("");
  
  const results: AggregatedEmbeddingResults = {
    byModel: {},
    byImage: {},
    all: []
  };
  
  let evaluated = 0;
  let errors = 0;
  
  for (const file of batchFiles) {
    const filePath = path.join(BATCH_RESULTS_DIR, file);
    const batchResult: BatchResult = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    
    // Find corresponding reference
    const imageBase = file.split("__")[0];
    const reference = references[imageBase];
    
    if (!reference) {
      console.log(`  ⚠️ No reference for ${file}`);
      continue;
    }
    
    console.log(`  Processing: ${file.slice(0, 55)}...`);
    const metrics = await evaluateWithEmbeddings(batchResult, reference);
    
    // Store in aggregated results
    results.all.push(metrics);
    
    if (!results.byModel[metrics.model]) results.byModel[metrics.model] = [];
    results.byModel[metrics.model].push(metrics);
    
    if (!results.byImage[metrics.image]) results.byImage[metrics.image] = [];
    results.byImage[metrics.image].push(metrics);
    
    evaluated++;
    if (metrics.hasError) {
      errors++;
      console.log(`    ❌ Error: ${metrics.errorMessage}`);
    } else {
      console.log(`    ✅ F1=${formatScore(metrics.f1Score)}, Overall=${formatScore(metrics.overallSimilarity)}`);
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log("");
  console.log(`Evaluated ${evaluated} results (${errors} errors)`);
  console.log("");
  
  // Generate results markdown
  console.log("Generating results-embeddings.md...");
  const markdown = generateEmbeddingResultsMarkdown(results);
  const outputPath = path.join(PROJECT_ROOT, "results-embeddings.md");
  fs.writeFileSync(outputPath, markdown);
  console.log(`  ✅ Saved to ${outputPath}`);
  
  // Also save raw JSON results
  const jsonOutputPath = path.join(PROJECT_ROOT, "data", "evaluation-embeddings.json");
  fs.writeFileSync(jsonOutputPath, JSON.stringify(results, null, 2));
  console.log(`  ✅ Saved raw data to ${jsonOutputPath}`);
  
  console.log("");
  console.log("=".repeat(80));
  console.log("  EMBEDDING EVALUATION COMPLETE");
  console.log("=".repeat(80));
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
