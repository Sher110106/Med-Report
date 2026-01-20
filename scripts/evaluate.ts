/**
 * Medical Note Evaluation Test Suite
 * 
 * Evaluates model SOAP outputs against PriMock57 reference data
 * Implements metrics from Tests.md:
 * - Structural correctness (schema, section completeness)
 * - Content coverage (highlight recall, negation preservation, symptom recall)
 * - Hallucination detection
 * - Text similarity (ROUGE-L, n-gram overlap)
 * 
 * Usage: npx tsx scripts/evaluate.ts
 */

import fs from "fs";
import path from "path";

// ============================================================================
// CONFIGURATION
// ============================================================================

const PROJECT_ROOT = process.cwd();
const BATCH_RESULTS_DIR = path.join(PROJECT_ROOT, "data", "batch-results");
const REFERENCE_DIR = PROJECT_ROOT; // 5.json, 6.json, etc. are in root

// Map image numbers to reference files
const IMAGE_TO_REFERENCE: Record<string, string> = {
  "medical_note_05": "5.json",
  "medical_note_06": "6.json",
  "medical_note_07": "7.json",
  "medical_note_08": "8.json",
  "medical_note_09": "9.json",
};

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
    vitals?: {
      bp?: string | null;
      hr?: string | null;
      temp?: string | null;
      rr?: string | null;
      weight?: string | null;
    };
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
    raw_response?: string;
  } | null;
}

interface EvaluationMetrics {
  // Identification
  image: string;
  model: string;
  modelName: string;
  prompt: string;
  
  // Structural
  schemaValid: boolean;
  sectionCompleteness: number;
  nullFieldRatio: number;
  
  // Content Coverage
  highlightRecall: number;
  highlightsCovered: number;
  highlightsTotal: number;
  negationErrors: number;
  negationPreservationRate: number;
  symptomRecall: number;
  
  // Hallucination Detection
  hallucinatedVitals: boolean;
  hallucinatedLabs: boolean;
  diagnosisGrounded: boolean;
  
  // Text Similarity
  rougeLScore: number;
  wordOverlap: number;
  
  // Meta
  latencyMs: number;
  hasError: boolean;
  errorMessage?: string;
}

interface AggregatedResults {
  byModel: Record<string, EvaluationMetrics[]>;
  byImage: Record<string, EvaluationMetrics[]>;
  byPrompt: Record<string, EvaluationMetrics[]>;
  all: EvaluationMetrics[];
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function tokenize(text: string): string[] {
  return normalizeText(text).split(" ").filter(t => t.length > 0);
}

function getNgrams(tokens: string[], n: number): Set<string> {
  const ngrams = new Set<string>();
  for (let i = 0; i <= tokens.length - n; i++) {
    ngrams.add(tokens.slice(i, i + n).join(" "));
  }
  return ngrams;
}

function jaccardSimilarity(set1: Set<string>, set2: Set<string>): number {
  if (set1.size === 0 && set2.size === 0) return 1;
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return intersection.size / union.size;
}

// ROUGE-L: Longest Common Subsequence based scoring
function lcsLength(a: string[], b: string[]): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  return dp[m][n];
}

function rougeLScore(reference: string, candidate: string): number {
  const refTokens = tokenize(reference);
  const candTokens = tokenize(candidate);
  
  if (refTokens.length === 0 || candTokens.length === 0) return 0;
  
  const lcs = lcsLength(refTokens, candTokens);
  const precision = lcs / candTokens.length;
  const recall = lcs / refTokens.length;
  
  if (precision + recall === 0) return 0;
  return (2 * precision * recall) / (precision + recall); // F1
}

function containsPhrase(text: string, phrase: string, fuzzy: boolean = true): boolean {
  const normText = normalizeText(text);
  const normPhrase = normalizeText(phrase);
  
  if (normText.includes(normPhrase)) return true;
  
  if (fuzzy) {
    // Check word overlap - if 80% of phrase words are in text
    const phraseWords = tokenize(phrase);
    const textWords = new Set(tokenize(text));
    const matchCount = phraseWords.filter(w => textWords.has(w)).length;
    return matchCount >= phraseWords.length * 0.7;
  }
  
  return false;
}

// ============================================================================
// EXTRACTION HELPERS
// ============================================================================

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
    if (soap.objective.labs_imaging && soap.objective.labs_imaging !== "Pending/None mentioned") {
      parts.push(soap.objective.labs_imaging);
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
        if (m.dosage) parts.push(m.dosage);
        if (m.sig) parts.push(m.sig);
      });
    }
    if (soap.plan.procedures_ordered) parts.push(soap.plan.procedures_ordered.join(" "));
    if (soap.plan.patient_instructions) parts.push(soap.plan.patient_instructions);
  }
  
  return parts.join(" ");
}

function extractNegations(text: string): string[] {
  const negationPatterns = [
    /no\s+(\w+(?:\s+\w+)?)/gi,
    /nil\s+(\w+(?:\s+\w+)?)/gi,
    /denies\s+(\w+(?:\s+\w+)?)/gi,
    /without\s+(\w+(?:\s+\w+)?)/gi,
    /negative\s+for\s+(\w+(?:\s+\w+)?)/gi,
  ];
  
  const negations: string[] = [];
  
  for (const pattern of negationPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      negations.push(match[0]);
    }
  }
  
  return negations;
}

function extractSymptoms(text: string): string[] {
  // Common symptom keywords to look for
  const symptomKeywords = [
    "pain", "ache", "headache", "fever", "cough", "vomit", "nausea",
    "diarrhea", "diarrhoea", "itchy", "sore", "bleeding", "discharge",
    "fatigue", "weak", "tired", "sweat", "hot", "cold", "rash",
    "shortness of breath", "sob", "chest pain", "abdominal", "crampy",
    "burning", "throbbing", "stiff", "numbness", "tingling",
    "blurred vision", "photophobia", "lethargy", "myalgia"
  ];
  
  const normText = normalizeText(text);
  const foundSymptoms: string[] = [];
  
  for (const symptom of symptomKeywords) {
    if (normText.includes(symptom)) {
      foundSymptoms.push(symptom);
    }
  }
  
  return foundSymptoms;
}

// ============================================================================
// EVALUATION METRICS
// ============================================================================

function evaluateSchemaValidity(soap: SOAPNote | undefined): boolean {
  if (!soap) return false;
  
  // Check for required top-level sections
  const requiredSections = ["subjective", "objective", "assessment", "plan"];
  for (const section of requiredSections) {
    if (!(section in soap)) return false;
  }
  
  return true;
}

function evaluateSectionCompleteness(soap: SOAPNote | undefined): number {
  if (!soap) return 0;
  
  const sections = ["subjective", "objective", "assessment", "plan"];
  let present = 0;
  
  for (const section of sections) {
    if (section in soap && (soap as any)[section] !== null && (soap as any)[section] !== undefined) {
      // Check if section has any non-null content
      const sectionData = (soap as any)[section];
      if (typeof sectionData === "object" && Object.keys(sectionData).length > 0) {
        present++;
      }
    }
  }
  
  return present / sections.length;
}

function evaluateNullFieldRatio(soap: SOAPNote | undefined): number {
  if (!soap) return 1;
  
  let totalFields = 0;
  let nullFields = 0;
  
  function countFields(obj: any, depth: number = 0) {
    if (depth > 3) return; // Limit recursion
    
    if (typeof obj !== "object" || obj === null) {
      totalFields++;
      if (obj === null || obj === undefined || obj === "") {
        nullFields++;
      }
      return;
    }
    
    if (Array.isArray(obj)) {
      totalFields++;
      if (obj.length === 0) nullFields++;
      return;
    }
    
    for (const key of Object.keys(obj)) {
      countFields(obj[key], depth + 1);
    }
  }
  
  countFields(soap);
  
  return totalFields > 0 ? nullFields / totalFields : 0;
}

function evaluateHighlightRecall(soap: SOAPNote | undefined, highlights: string[]): { recall: number; covered: number; total: number } {
  if (!soap || highlights.length === 0) {
    return { recall: 0, covered: 0, total: highlights.length };
  }
  
  const soapText = extractFullSOAPText(soap);
  let covered = 0;
  
  for (const highlight of highlights) {
    if (containsPhrase(soapText, highlight, true)) {
      covered++;
    }
  }
  
  return {
    recall: covered / highlights.length,
    covered,
    total: highlights.length
  };
}

function evaluateNegationPreservation(soap: SOAPNote | undefined, referenceNote: string): { errors: number; rate: number } {
  const refNegations = extractNegations(referenceNote);
  
  if (refNegations.length === 0 || !soap) {
    return { errors: 0, rate: 1 };
  }
  
  const soapText = extractFullSOAPText(soap);
  let preserved = 0;
  
  for (const negation of refNegations) {
    if (containsPhrase(soapText, negation, true)) {
      preserved++;
    }
  }
  
  return {
    errors: refNegations.length - preserved,
    rate: preserved / refNegations.length
  };
}

function evaluateSymptomRecall(soap: SOAPNote | undefined, referenceNote: string): number {
  const refSymptoms = extractSymptoms(referenceNote);
  
  if (refSymptoms.length === 0 || !soap) {
    return soap ? 1 : 0; // If no symptoms in ref, give benefit of doubt
  }
  
  const soapText = extractFullSOAPText(soap);
  const soapSymptoms = new Set(extractSymptoms(soapText));
  
  let matched = 0;
  for (const symptom of refSymptoms) {
    if (soapSymptoms.has(symptom)) {
      matched++;
    }
  }
  
  return matched / refSymptoms.length;
}

function evaluateHallucinatedVitals(soap: SOAPNote | undefined, referenceNote: string): boolean {
  if (!soap?.objective?.vitals) return false;
  
  const vitals = soap.objective.vitals;
  const hasVitals = vitals.bp || vitals.hr || vitals.temp || vitals.rr || vitals.weight;
  
  if (!hasVitals) return false;
  
  // Check if reference contains vital signs
  const vitalPatterns = [/bp[:\s]/i, /\d+\/\d+/, /hr[:\s]/i, /pulse/i, /temp/i, /\d+\.\d+°/];
  const hasRefVitals = vitalPatterns.some(p => p.test(referenceNote));
  
  // If SOAP has vitals but reference doesn't mention any, it's hallucinated
  return !hasRefVitals && !!hasVitals;
}

function evaluateHallucinatedLabs(soap: SOAPNote | undefined, referenceNote: string): boolean {
  if (!soap?.objective?.labs_imaging) return false;
  
  const labs = soap.objective.labs_imaging;
  if (!labs || labs === "Pending/None mentioned" || labs === "None" || labs.toLowerCase().includes("none")) {
    return false;
  }
  
  // Check if reference mentions labs
  const labPatterns = [/lab/i, /blood test/i, /urine test/i, /xray/i, /x-ray/i, /ct\s/i, /mri/i, /ultrasound/i];
  const hasRefLabs = labPatterns.some(p => p.test(referenceNote));
  
  return !hasRefLabs;
}

function evaluateDiagnosisGrounded(soap: SOAPNote | undefined, reference: ReferenceData): boolean {
  if (!soap?.assessment?.primary_diagnosis?.value) return false;
  
  const diagnosisValue = normalizeText(soap.assessment.primary_diagnosis.value);
  
  // Check against reference note (looking for "Imp:" line)
  const impMatch = reference.note.match(/imp[:\s]+([^\n]+)/i);
  if (impMatch) {
    const refImp = normalizeText(impMatch[1]);
    if (diagnosisValue.includes(refImp) || refImp.includes(diagnosisValue)) {
      return true;
    }
    // Fuzzy match
    const diagTokens = new Set(tokenize(diagnosisValue));
    const refTokens = tokenize(refImp);
    const overlap = refTokens.filter(t => diagTokens.has(t)).length;
    if (overlap >= refTokens.length * 0.5) return true;
  }
  
  // Also check against highlights
  for (const highlight of reference.highlights) {
    if (containsPhrase(diagnosisValue, highlight, true) || containsPhrase(highlight, diagnosisValue, true)) {
      return true;
    }
  }
  
  return false;
}

function evaluateTextSimilarity(soap: SOAPNote | undefined, referenceNote: string): { rougeL: number; wordOverlap: number } {
  if (!soap) return { rougeL: 0, wordOverlap: 0 };
  
  const soapText = extractFullSOAPText(soap);
  
  const rougeL = rougeLScore(referenceNote, soapText);
  
  const refWords = new Set(tokenize(referenceNote));
  const soapWords = new Set(tokenize(soapText));
  const wordOverlap = jaccardSimilarity(refWords, soapWords);
  
  return { rougeL, wordOverlap };
}

// ============================================================================
// MAIN EVALUATION FUNCTION
// ============================================================================

function evaluateBatchResult(result: BatchResult, reference: ReferenceData): EvaluationMetrics {
  const soap = result.output?.soap_note;
  
  // Handle error cases
  if (result.metadata.error || !result.output) {
    return {
      image: result.metadata.image,
      model: result.metadata.model,
      modelName: result.metadata.modelName,
      prompt: result.metadata.prompt,
      schemaValid: false,
      sectionCompleteness: 0,
      nullFieldRatio: 1,
      highlightRecall: 0,
      highlightsCovered: 0,
      highlightsTotal: reference.highlights.length,
      negationErrors: 0,
      negationPreservationRate: 0,
      symptomRecall: 0,
      hallucinatedVitals: false,
      hallucinatedLabs: false,
      diagnosisGrounded: false,
      rougeLScore: 0,
      wordOverlap: 0,
      latencyMs: result.metadata.latencyMs || 0,
      hasError: true,
      errorMessage: result.metadata.error || "No output"
    };
  }
  
  const highlightEval = evaluateHighlightRecall(soap, reference.highlights);
  const negationEval = evaluateNegationPreservation(soap, reference.note);
  const textSim = evaluateTextSimilarity(soap, reference.note);
  
  return {
    image: result.metadata.image,
    model: result.metadata.model,
    modelName: result.metadata.modelName,
    prompt: result.metadata.prompt,
    schemaValid: evaluateSchemaValidity(soap),
    sectionCompleteness: evaluateSectionCompleteness(soap),
    nullFieldRatio: evaluateNullFieldRatio(soap),
    highlightRecall: highlightEval.recall,
    highlightsCovered: highlightEval.covered,
    highlightsTotal: highlightEval.total,
    negationErrors: negationEval.errors,
    negationPreservationRate: negationEval.rate,
    symptomRecall: evaluateSymptomRecall(soap, reference.note),
    hallucinatedVitals: evaluateHallucinatedVitals(soap, reference.note),
    hallucinatedLabs: evaluateHallucinatedLabs(soap, reference.note),
    diagnosisGrounded: evaluateDiagnosisGrounded(soap, reference),
    rougeLScore: textSim.rougeL,
    wordOverlap: textSim.wordOverlap,
    latencyMs: result.metadata.latencyMs || 0,
    hasError: false
  };
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

function generateResultsMarkdown(results: AggregatedResults): string {
  const lines: string[] = [];
  
  lines.push("# Medical Note Extraction - Model Evaluation Results");
  lines.push("");
  lines.push(`> Generated: ${new Date().toISOString()}`);
  lines.push(`> Total Evaluations: ${results.all.length}`);
  lines.push("");
  
  // =========================================================================
  // EXECUTIVE SUMMARY
  // =========================================================================
  lines.push("## Executive Summary");
  lines.push("");
  
  // Calculate model averages (only for SOAP Enhanced prompt)
  const modelAverages: Record<string, {
    schemaValid: number;
    sectionCompleteness: number;
    highlightRecall: number;
    symptomRecall: number;
    diagnosisGrounded: number;
    rougeL: number;
    errorRate: number;
    avgLatency: number;
    count: number;
  }> = {};
  
  for (const [model, evals] of Object.entries(results.byModel)) {
    // Only consider SOAP Enhanced results for meaningful metrics
    const soapEvals = evals.filter(e => e.prompt === "soap_enhanced");
    const validEvals = soapEvals.filter(e => !e.hasError);
    
    modelAverages[model] = {
      schemaValid: validEvals.filter(e => e.schemaValid).length / (soapEvals.length || 1),
      sectionCompleteness: validEvals.reduce((s, e) => s + e.sectionCompleteness, 0) / (validEvals.length || 1),
      highlightRecall: validEvals.reduce((s, e) => s + e.highlightRecall, 0) / (validEvals.length || 1),
      symptomRecall: validEvals.reduce((s, e) => s + e.symptomRecall, 0) / (validEvals.length || 1),
      diagnosisGrounded: validEvals.filter(e => e.diagnosisGrounded).length / (validEvals.length || 1),
      rougeL: validEvals.reduce((s, e) => s + e.rougeLScore, 0) / (validEvals.length || 1),
      errorRate: soapEvals.filter(e => e.hasError).length / (soapEvals.length || 1),
      avgLatency: validEvals.reduce((s, e) => s + e.latencyMs, 0) / (validEvals.length || 1),
      count: soapEvals.length
    };
  }
  
  // Sort by composite score
  const modelRankings = Object.entries(modelAverages)
    .map(([model, avg]) => ({
      model,
      compositeScore: (avg.schemaValid * 0.15 + avg.sectionCompleteness * 0.15 + avg.highlightRecall * 0.25 + 
                       avg.symptomRecall * 0.15 + avg.diagnosisGrounded * 0.15 + avg.rougeL * 0.15) * (1 - avg.errorRate)
    }))
    .sort((a, b) => b.compositeScore - a.compositeScore);
  
  lines.push("### Top Performing Models (Composite Score)");
  lines.push("");
  lines.push("| Rank | Model | Composite Score |");
  lines.push("|------|-------|-----------------|");
  modelRankings.forEach((m, i) => {
    lines.push(`| ${i + 1} | ${m.model} | ${formatScore(m.compositeScore)} |`);
  });
  lines.push("");
  
  // Key findings
  lines.push("### Key Findings");
  lines.push("");
  const bestModel = modelRankings[0];
  const worstModel = modelRankings[modelRankings.length - 1];
  lines.push(`- **Best Overall**: \`${bestModel.model}\` with composite score of ${formatScore(bestModel.compositeScore)}`);
  lines.push(`- **Needs Improvement**: \`${worstModel.model}\` with composite score of ${formatScore(worstModel.compositeScore)}`);
  
  // Find best per metric
  const bestHighlightRecall = Object.entries(modelAverages).sort((a, b) => b[1].highlightRecall - a[1].highlightRecall)[0];
  const bestDiagnosis = Object.entries(modelAverages).sort((a, b) => b[1].diagnosisGrounded - a[1].diagnosisGrounded)[0];
  lines.push(`- **Best Highlight Recall**: \`${bestHighlightRecall[0]}\` at ${formatPercent(bestHighlightRecall[1].highlightRecall)}`);
  lines.push(`- **Best Diagnosis Accuracy**: \`${bestDiagnosis[0]}\` at ${formatPercent(bestDiagnosis[1].diagnosisGrounded)}`);
  lines.push("");
  
  // =========================================================================
  // METHODOLOGY
  // =========================================================================
  lines.push("---");
  lines.push("");
  lines.push("## Methodology");
  lines.push("");
  lines.push("### Metrics Evaluated");
  lines.push("");
  lines.push("| Metric | Description | Range |");
  lines.push("|--------|-------------|-------|");
  lines.push("| Schema Valid | SOAP structure has all required sections | true/false |");
  lines.push("| Section Completeness | Ratio of non-empty SOAP sections | 0-1 |");
  lines.push("| Highlight Recall | % of reference key-phrases found in output | 0-100% |");
  lines.push("| Symptom Recall | % of symptoms from reference captured | 0-100% |");
  lines.push("| Negation Preservation | % of negations (no X, nil Y) correctly kept | 0-100% |");
  lines.push("| Diagnosis Grounded | Primary diagnosis matches reference Imp: | true/false |");
  lines.push("| ROUGE-L | Longest common subsequence overlap | 0-1 |");
  lines.push("| Hallucinated Vitals | Invented vital signs not in reference | true/false |");
  lines.push("| Hallucinated Labs | Invented lab results not in reference | true/false |");
  lines.push("");
  lines.push("### Composite Score Formula");
  lines.push("");
  lines.push("```");
  lines.push("Composite = (0.15×SchemaValid + 0.15×SectionCompleteness + 0.25×HighlightRecall +");
  lines.push("             0.15×SymptomRecall + 0.15×DiagnosisGrounded + 0.15×ROUGE-L) × (1 - ErrorRate)");
  lines.push("```");
  lines.push("");
  
  // =========================================================================
  // PER-MODEL COMPARISON
  // =========================================================================
  lines.push("---");
  lines.push("");
  lines.push("## Per-Model Comparison");
  lines.push("");
  
  lines.push("### Overall Performance");
  lines.push("");
  lines.push("| Model | Schema Valid | Section Complete | Highlight Recall | Symptom Recall | Diagnosis OK | ROUGE-L | Error Rate |");
  lines.push("|-------|--------------|------------------|------------------|----------------|--------------|---------|------------|");
  
  for (const [model, avg] of Object.entries(modelAverages)) {
    lines.push(`| ${model} | ${formatPercent(avg.schemaValid)} | ${formatPercent(avg.sectionCompleteness)} | ${formatPercent(avg.highlightRecall)} | ${formatPercent(avg.symptomRecall)} | ${formatPercent(avg.diagnosisGrounded)} | ${formatScore(avg.rougeL)} | ${formatPercent(avg.errorRate)} |`);
  }
  lines.push("");
  
  // =========================================================================
  // PER-PROMPT BREAKDOWN
  // =========================================================================
  lines.push("### By Prompt Type");
  lines.push("");
  
  // Note about Labs Diagnostics
  lines.push("> [!NOTE]");
  lines.push("> The **Labs Diagnostics** prompt produces a different JSON schema (patient_metadata, diagnostics_and_labs, treatment_plan) rather than SOAP format. The metrics below show 0% for Labs Diagnostics because this evaluation is designed for SOAP-structured outputs. Focus on **SOAP Enhanced** results for model comparison.");
  lines.push("");
  
  for (const [prompt, evals] of Object.entries(results.byPrompt)) {
    const promptTitle = prompt === "soap_enhanced" ? "SOAP Enhanced Prompt ⭐" : "Labs Diagnostics Prompt (Different Schema)";
    lines.push(`#### ${promptTitle}`);
    lines.push("");
    
    if (prompt === "labs_diagnostics") {
      lines.push("*Labs Diagnostics uses a non-SOAP schema - see note above.*");
      lines.push("");
      continue;
    }
    
    lines.push("| Model | Highlight Recall | Symptom Recall | Diagnosis OK | ROUGE-L |");
    lines.push("|-------|------------------|----------------|--------------|---------|");
    
    // Group by model within this prompt
    const promptByModel: Record<string, EvaluationMetrics[]> = {};
    for (const e of evals) {
      if (!promptByModel[e.model]) promptByModel[e.model] = [];
      promptByModel[e.model].push(e);
    }
    
    for (const [model, mEvals] of Object.entries(promptByModel)) {
      const validEvals = mEvals.filter(e => !e.hasError);
      if (validEvals.length === 0) {
        lines.push(`| ${model} | - | - | - | - |`);
        continue;
      }
      const hr = validEvals.reduce((s, e) => s + e.highlightRecall, 0) / validEvals.length;
      const sr = validEvals.reduce((s, e) => s + e.symptomRecall, 0) / validEvals.length;
      const dg = validEvals.filter(e => e.diagnosisGrounded).length / validEvals.length;
      const rl = validEvals.reduce((s, e) => s + e.rougeLScore, 0) / validEvals.length;
      lines.push(`| ${model} | ${formatPercent(hr)} | ${formatPercent(sr)} | ${formatPercent(dg)} | ${formatScore(rl)} |`);
    }
    lines.push("");
  }
  
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
    
    // SOAP Enhanced results
    const soapEvals = evals.filter(e => e.prompt === "soap_enhanced" && !e.hasError);
    if (soapEvals.length > 0) {
      lines.push("**SOAP Enhanced Results:**");
      lines.push("");
      lines.push("| Model | Highlight Recall | Diagnosis | ROUGE-L | Hallu. Vitals | Hallu. Labs |");
      lines.push("|-------|------------------|-----------|---------|---------------|-------------|");
      
      for (const e of soapEvals) {
        lines.push(`| ${e.model} | ${formatPercent(e.highlightRecall)} (${e.highlightsCovered}/${e.highlightsTotal}) | ${e.diagnosisGrounded ? "✅" : "❌"} | ${formatScore(e.rougeLScore)} | ${e.hallucinatedVitals ? "⚠️" : "✅"} | ${e.hallucinatedLabs ? "⚠️" : "✅"} |`);
      }
      lines.push("");
    }
    
    // Error summary for this image
    const errors = evals.filter(e => e.hasError);
    if (errors.length > 0) {
      lines.push(`> ⚠️ ${errors.length} model(s) failed: ${errors.map(e => e.model).join(", ")}`);
      lines.push("");
    }
  }
  
  // =========================================================================
  // HALLUCINATION ANALYSIS
  // =========================================================================
  lines.push("---");
  lines.push("");
  lines.push("## Hallucination Analysis");
  lines.push("");
  
  const halluVitals: Record<string, number> = {};
  const halluLabs: Record<string, number> = {};
  const modelCounts: Record<string, number> = {};
  
  for (const e of results.all) {
    if (!modelCounts[e.model]) {
      modelCounts[e.model] = 0;
      halluVitals[e.model] = 0;
      halluLabs[e.model] = 0;
    }
    if (!e.hasError) {
      modelCounts[e.model]++;
      if (e.hallucinatedVitals) halluVitals[e.model]++;
      if (e.hallucinatedLabs) halluLabs[e.model]++;
    }
  }
  
  lines.push("| Model | Hallucinated Vitals | Hallucinated Labs | Total Valid Runs |");
  lines.push("|-------|---------------------|-------------------|------------------|");
  
  for (const model of Object.keys(modelCounts)) {
    lines.push(`| ${model} | ${halluVitals[model]}/${modelCounts[model]} | ${halluLabs[model]}/${modelCounts[model]} | ${modelCounts[model]} |`);
  }
  lines.push("");
  
  lines.push("> **Note**: Hallucination = model generated specific values when reference note had none.");
  lines.push("");
  
  // =========================================================================
  // LATENCY ANALYSIS
  // =========================================================================
  lines.push("---");
  lines.push("");
  lines.push("## Latency Analysis");
  lines.push("");
  
  lines.push("| Model | Avg Latency (s) | Min (s) | Max (s) |");
  lines.push("|-------|-----------------|---------|---------|");
  
  for (const [model, evals] of Object.entries(results.byModel)) {
    const validEvals = evals.filter(e => !e.hasError && e.latencyMs > 0);
    if (validEvals.length === 0) {
      lines.push(`| ${model} | - | - | - |`);
      continue;
    }
    const latencies = validEvals.map(e => e.latencyMs / 1000);
    const avg = latencies.reduce((s, l) => s + l, 0) / latencies.length;
    const min = Math.min(...latencies);
    const max = Math.max(...latencies);
    lines.push(`| ${model} | ${avg.toFixed(2)} | ${min.toFixed(2)} | ${max.toFixed(2)} |`);
  }
  lines.push("");
  
  // =========================================================================
  // DETAILED RESULTS TABLE
  // =========================================================================
  lines.push("---");
  lines.push("");
  lines.push("## Detailed Results");
  lines.push("");
  lines.push("<details>");
  lines.push("<summary>Click to expand full results table</summary>");
  lines.push("");
  lines.push("| Image | Model | Prompt | Schema | Sections | Highlight | Symptom | Diagnosis | ROUGE-L | Status |");
  lines.push("|-------|-------|--------|--------|----------|-----------|---------|-----------|---------|--------|");
  
  for (const e of results.all) {
    const status = e.hasError ? `❌ ${e.errorMessage?.slice(0, 20) || "Error"}` : "✅";
    lines.push(`| ${e.image.replace("medical_note_", "")} | ${e.model} | ${e.prompt.replace("_", " ")} | ${e.schemaValid ? "✅" : "❌"} | ${formatPercent(e.sectionCompleteness)} | ${formatPercent(e.highlightRecall)} | ${formatPercent(e.symptomRecall)} | ${e.diagnosisGrounded ? "✅" : "❌"} | ${formatScore(e.rougeLScore)} | ${status} |`);
  }
  
  lines.push("");
  lines.push("</details>");
  lines.push("");
  
  // =========================================================================
  // RECOMMENDATIONS
  // =========================================================================
  lines.push("---");
  lines.push("");
  lines.push("## Recommendations");
  lines.push("");
  
  const top3 = modelRankings.slice(0, 3);
  lines.push("### Best Models for Production Use");
  lines.push("");
  lines.push(`1. **${top3[0]?.model}** - Best overall composite score (${formatScore(top3[0]?.compositeScore || 0)})`);
  if (top3[1]) lines.push(`2. **${top3[1].model}** - Strong runner-up (${formatScore(top3[1].compositeScore)})`);
  if (top3[2]) lines.push(`3. **${top3[2].model}** - Solid third option (${formatScore(top3[2].compositeScore)})`);
  lines.push("");
  
  lines.push("### Areas for Improvement");
  lines.push("");
  
  // Find models with high hallucination
  const highHallu = Object.entries(halluVitals)
    .filter(([_, count]) => count > 0)
    .map(([model]) => model);
  
  if (highHallu.length > 0) {
    lines.push(`- **Hallucination concerns**: ${highHallu.join(", ")} produced hallucinated content`);
  }
  
  // Find models with low highlight recall
  const lowRecall = Object.entries(modelAverages)
    .filter(([_, avg]) => avg.highlightRecall < 0.6)
    .map(([model]) => model);
  
  if (lowRecall.length > 0) {
    lines.push(`- **Low content coverage**: ${lowRecall.join(", ")} missed significant key information`);
  }
  
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("*Report generated by Medical Note Evaluation Test Suite*");
  
  return lines.join("\n");
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log("=".repeat(80));
  console.log("  MEDICAL NOTE EVALUATION TEST SUITE");
  console.log("=".repeat(80));
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
  
  // Find relevant batch results
  console.log("Finding batch results...");
  const batchFiles = fs.readdirSync(BATCH_RESULTS_DIR)
    .filter(f => f.endsWith(".json"))
    .filter(f => Object.keys(IMAGE_TO_REFERENCE).some(img => f.startsWith(img)));
  
  console.log(`  Found ${batchFiles.length} relevant batch result files`);
  console.log("");
  
  // Evaluate each batch result
  console.log("Running evaluations...");
  const results: AggregatedResults = {
    byModel: {},
    byImage: {},
    byPrompt: {},
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
    
    const metrics = evaluateBatchResult(batchResult, reference);
    
    // Store in aggregated results
    results.all.push(metrics);
    
    if (!results.byModel[metrics.model]) results.byModel[metrics.model] = [];
    results.byModel[metrics.model].push(metrics);
    
    if (!results.byImage[metrics.image]) results.byImage[metrics.image] = [];
    results.byImage[metrics.image].push(metrics);
    
    if (!results.byPrompt[metrics.prompt]) results.byPrompt[metrics.prompt] = [];
    results.byPrompt[metrics.prompt].push(metrics);
    
    evaluated++;
    if (metrics.hasError) errors++;
    
    const status = metrics.hasError ? "❌" : "✅";
    console.log(`  ${status} ${file.slice(0, 50)}... HR=${formatPercent(metrics.highlightRecall)}`);
  }
  
  console.log("");
  console.log(`Evaluated ${evaluated} results (${errors} errors)`);
  console.log("");
  
  // Generate results markdown
  console.log("Generating results.md...");
  const markdown = generateResultsMarkdown(results);
  const outputPath = path.join(PROJECT_ROOT, "results.md");
  fs.writeFileSync(outputPath, markdown);
  console.log(`  ✅ Saved to ${outputPath}`);
  
  // Also save raw JSON results for further analysis
  const jsonOutputPath = path.join(PROJECT_ROOT, "data", "evaluation-results.json");
  fs.writeFileSync(jsonOutputPath, JSON.stringify(results, null, 2));
  console.log(`  ✅ Saved raw data to ${jsonOutputPath}`);
  
  console.log("");
  console.log("=".repeat(80));
  console.log("  EVALUATION COMPLETE");
  console.log("=".repeat(80));
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
