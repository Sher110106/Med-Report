/**
 * Unified Evaluation Report Generator
 * 
 * Combines basic (non-embedding) evaluation metrics with embedding-based metrics
 * to create a comprehensive analysis with a unified composite score.
 * 
 * Usage: npx tsx scripts/generate-unified-results.ts
 */

import fs from "fs";
import path from "path";

// ============================================================================
// CONFIGURATION
// ============================================================================

const PROJECT_ROOT = process.cwd();
const BASIC_EVAL_PATH = path.join(PROJECT_ROOT, "data", "evaluation-results.json");
const EMBEDDING_EVAL_PATH = path.join(PROJECT_ROOT, "data", "evaluation-embeddings.json");
const OUTPUT_PATH = path.join(PROJECT_ROOT, "results-embeddings.md");

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface BasicMetrics {
  image: string;
  model: string;
  modelName: string;
  prompt: string;
  schemaValid: boolean;
  sectionCompleteness: number;
  nullFieldRatio: number;
  highlightRecall: number;
  highlightsCovered: number;
  highlightsTotal: number;
  negationErrors: number;
  negationPreservationRate: number;
  symptomRecall: number;
  hallucinatedVitals: boolean;
  hallucinatedLabs: boolean;
  diagnosisGrounded: boolean;
  rougeLScore: number;
  wordOverlap: number;
  latencyMs: number;
  hasError: boolean;
}

interface EmbeddingMetrics {
  image: string;
  model: string;
  modelName: string;
  overallSimilarity: number;
  subjectiveSimilarity: number;
  objectiveSimilarity: number;
  assessmentSimilarity: number;
  planSimilarity: number;
  highlightRecallSemantic: number;
  highlightsCoveredSemantic: number;
  highlightsTotal: number;
  avgHighlightSimilarity: number;
  precision: number;
  recall: number;
  f1Score: number;
  diagnosisSemanticMatch: number;
  latencyMs: number;
  hasError: boolean;
}

interface UnifiedMetrics {
  image: string;
  model: string;
  modelName: string;
  // Basic metrics
  schemaValid: boolean;
  sectionCompleteness: number;
  highlightRecall: number;
  symptomRecall: number;
  negationPreservationRate: number;
  diagnosisGrounded: boolean;
  rougeLScore: number;
  hallucinatedVitals: boolean;
  hallucinatedLabs: boolean;
  // Embedding metrics
  overallSimilarity: number;
  semanticPrecision: number;
  semanticRecall: number;
  semanticF1: number;
  diagnosisSemanticMatch: number;
  avgHighlightSimilarity: number;
  // Meta
  latencyMs: number;
  // Composite scores
  basicComposite: number;
  embeddingComposite: number;
  unifiedComposite: number;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatPercent(value: number): string {
  return (value * 100).toFixed(1) + "%";
}

function formatScore(value: number): string {
  return value.toFixed(3);
}

function boolToEmoji(value: boolean, invertMeaning: boolean = false): string {
  if (invertMeaning) {
    return value ? "⚠️" : "✅";
  }
  return value ? "✅" : "❌";
}

// ============================================================================
// DATA LOADING AND MERGING
// ============================================================================

function loadData(): { basic: Record<string, BasicMetrics[]>; embedding: Record<string, EmbeddingMetrics[]> } {
  const basicData = JSON.parse(fs.readFileSync(BASIC_EVAL_PATH, "utf-8"));
  const embeddingData = JSON.parse(fs.readFileSync(EMBEDDING_EVAL_PATH, "utf-8"));
  
  return {
    basic: basicData.byModel,
    embedding: embeddingData.byModel
  };
}

function mergeMetrics(
  basicByModel: Record<string, BasicMetrics[]>,
  embeddingByModel: Record<string, EmbeddingMetrics[]>
): Record<string, UnifiedMetrics[]> {
  const unified: Record<string, UnifiedMetrics[]> = {};
  
  for (const model of Object.keys(basicByModel)) {
    unified[model] = [];
    
    const basicEvals = basicByModel[model].filter(e => e.prompt === "soap_enhanced");
    const embeddingEvals = embeddingByModel[model] || [];
    
    for (const basic of basicEvals) {
      // Find matching embedding eval
      const embedding = embeddingEvals.find(e => e.image === basic.image);
      
      // Calculate composite scores
      const basicComposite = (
        (basic.schemaValid ? 0.1 : 0) +
        basic.sectionCompleteness * 0.1 +
        basic.highlightRecall * 0.2 +
        basic.symptomRecall * 0.15 +
        (basic.diagnosisGrounded ? 0.15 : 0) +
        basic.rougeLScore * 0.15 +
        basic.negationPreservationRate * 0.1 +
        (basic.hallucinatedLabs ? -0.05 : 0.05)
      );
      
      const embeddingComposite = embedding ? (
        embedding.overallSimilarity * 0.2 +
        embedding.f1Score * 0.3 +
        embedding.precision * 0.15 +
        embedding.recall * 0.15 +
        embedding.diagnosisSemanticMatch * 0.1 +
        embedding.avgHighlightSimilarity * 0.1
      ) : 0;
      
      // Unified composite: 50% basic + 50% embedding
      const unifiedComposite = (basicComposite + embeddingComposite) / 2;
      
      unified[model].push({
        image: basic.image,
        model: basic.model,
        modelName: basic.modelName,
        // Basic
        schemaValid: basic.schemaValid,
        sectionCompleteness: basic.sectionCompleteness,
        highlightRecall: basic.highlightRecall,
        symptomRecall: basic.symptomRecall,
        negationPreservationRate: basic.negationPreservationRate,
        diagnosisGrounded: basic.diagnosisGrounded,
        rougeLScore: basic.rougeLScore,
        hallucinatedVitals: basic.hallucinatedVitals,
        hallucinatedLabs: basic.hallucinatedLabs,
        // Embedding
        overallSimilarity: embedding?.overallSimilarity || 0,
        semanticPrecision: embedding?.precision || 0,
        semanticRecall: embedding?.recall || 0,
        semanticF1: embedding?.f1Score || 0,
        diagnosisSemanticMatch: embedding?.diagnosisSemanticMatch || 0,
        avgHighlightSimilarity: embedding?.avgHighlightSimilarity || 0,
        // Meta
        latencyMs: basic.latencyMs,
        // Composites
        basicComposite,
        embeddingComposite,
        unifiedComposite
      });
    }
  }
  
  return unified;
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

function generateUnifiedReport(unified: Record<string, UnifiedMetrics[]>): string {
  const lines: string[] = [];
  
  lines.push("# Comprehensive Model Evaluation Results");
  lines.push("");
  lines.push("> **Combined Analysis**: Basic metrics (Tests.md) + Semantic embeddings (text-embedding-3-large)");
  lines.push(`> Generated: ${new Date().toISOString()}`);
  lines.push(`> Evaluation Scope: SOAP Enhanced outputs only (5 images × 7 models = 35 evaluations)`);
  lines.push("");
  
  // =========================================================================
  // EXECUTIVE SUMMARY
  // =========================================================================
  lines.push("## 📊 Executive Summary");
  lines.push("");
  
  // Calculate model averages
  const modelAverages: Record<string, {
    basic: number;
    embedding: number;
    unified: number;
    highlightRecall: number;
    symptomRecall: number;
    diagnosisGrounded: number;
    semanticF1: number;
    overallSim: number;
    negationRate: number;
    halluLabs: number;
    count: number;
  }> = {};
  
  for (const [model, evals] of Object.entries(unified)) {
    modelAverages[model] = {
      basic: evals.reduce((s, e) => s + e.basicComposite, 0) / evals.length,
      embedding: evals.reduce((s, e) => s + e.embeddingComposite, 0) / evals.length,
      unified: evals.reduce((s, e) => s + e.unifiedComposite, 0) / evals.length,
      highlightRecall: evals.reduce((s, e) => s + e.highlightRecall, 0) / evals.length,
      symptomRecall: evals.reduce((s, e) => s + e.symptomRecall, 0) / evals.length,
      diagnosisGrounded: evals.filter(e => e.diagnosisGrounded).length / evals.length,
      semanticF1: evals.reduce((s, e) => s + e.semanticF1, 0) / evals.length,
      overallSim: evals.reduce((s, e) => s + e.overallSimilarity, 0) / evals.length,
      negationRate: evals.reduce((s, e) => s + e.negationPreservationRate, 0) / evals.length,
      halluLabs: evals.filter(e => e.hallucinatedLabs).length,
      count: evals.length
    };
  }
  
  // Sort by unified composite
  const rankings = Object.entries(modelAverages)
    .map(([model, avg]) => ({ model, ...avg }))
    .sort((a, b) => b.unified - a.unified);
  
  lines.push("### 🏆 Final Model Rankings (Unified Composite Score)");
  lines.push("");
  lines.push("| Rank | Model | Unified Score | Basic Score | Embedding Score |");
  lines.push("|------|-------|---------------|-------------|-----------------|");
  rankings.forEach((m, i) => {
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "  ";
    lines.push(`| ${medal} ${i + 1} | **${m.model}** | **${formatScore(m.unified)}** | ${formatScore(m.basic)} | ${formatScore(m.embedding)} |`);
  });
  lines.push("");
  
  lines.push("### 🔑 Key Insights");
  lines.push("");
  const best = rankings[0];
  const worst = rankings[rankings.length - 1];
  lines.push(`- **🏆 Best Overall**: \`${best.model}\` with unified score of ${formatScore(best.unified)}`);
  lines.push(`- **📈 Runner-up**: \`${rankings[1]?.model}\` with unified score of ${formatScore(rankings[1]?.unified || 0)}`);
  lines.push(`- **📉 Lowest Performer**: \`${worst.model}\` with unified score of ${formatScore(worst.unified)}`);
  lines.push("");
  
  // Metric-specific leaders
  const bestHighlight = rankings.sort((a, b) => b.highlightRecall - a.highlightRecall)[0];
  const bestSemantic = rankings.sort((a, b) => b.semanticF1 - a.semanticF1)[0];
  const bestDiagnosis = rankings.sort((a, b) => b.diagnosisGrounded - a.diagnosisGrounded)[0];
  const leastHallucination = rankings.sort((a, b) => a.halluLabs - b.halluLabs)[0];
  
  lines.push("| Category | Best Model | Score |");
  lines.push("|----------|------------|-------|");
  lines.push(`| Highlight Recall (basic) | ${bestHighlight.model} | ${formatPercent(bestHighlight.highlightRecall)} |`);
  lines.push(`| Semantic F1 (embedding) | ${bestSemantic.model} | ${formatScore(bestSemantic.semanticF1)} |`);
  lines.push(`| Diagnosis Accuracy | ${bestDiagnosis.model} | ${formatPercent(bestDiagnosis.diagnosisGrounded)} |`);
  lines.push(`| Least Lab Hallucinations | ${leastHallucination.model} | ${leastHallucination.halluLabs}/5 |`);
  lines.push("");
  
  // =========================================================================
  // METHODOLOGY
  // =========================================================================
  lines.push("---");
  lines.push("");
  lines.push("## 📋 Methodology");
  lines.push("");
  lines.push("### Unified Composite Score Formula");
  lines.push("");
  lines.push("```");
  lines.push("Unified = (Basic Composite + Embedding Composite) / 2");
  lines.push("");
  lines.push("Basic Composite = ");
  lines.push("  0.10 × SchemaValid +");
  lines.push("  0.10 × SectionCompleteness +");
  lines.push("  0.20 × HighlightRecall +");
  lines.push("  0.15 × SymptomRecall +");
  lines.push("  0.15 × DiagnosisGrounded +");
  lines.push("  0.15 × ROUGE-L +");
  lines.push("  0.10 × NegationPreservation +");
  lines.push("  ±0.05 × (no hallucination bonus/penalty)");
  lines.push("");
  lines.push("Embedding Composite =");
  lines.push("  0.20 × OverallSimilarity +");
  lines.push("  0.30 × SemanticF1 +");
  lines.push("  0.15 × Precision +");
  lines.push("  0.15 × Recall +");
  lines.push("  0.10 × DiagnosisSimilarity +");
  lines.push("  0.10 × AvgHighlightSimilarity");
  lines.push("```");
  lines.push("");
  
  lines.push("### All Metrics Evaluated");
  lines.push("");
  lines.push("#### Basic Metrics (Tests.md)");
  lines.push("");
  lines.push("| Metric | Description |");
  lines.push("|--------|-------------|");
  lines.push("| Schema Valid | SOAP structure has all required sections |");
  lines.push("| Section Completeness | Ratio of non-empty SOAP sections |");
  lines.push("| Highlight Recall | % of reference key-phrases found (fuzzy match) |");
  lines.push("| Symptom Recall | % of medical symptoms captured |");
  lines.push("| Negation Preservation | % of \"no X\", \"nil Y\" correctly preserved |");
  lines.push("| Diagnosis Grounded | Primary diagnosis matches reference |");
  lines.push("| ROUGE-L | Longest common subsequence overlap |");
  lines.push("| Hallucinated Vitals | Invented vital signs not in reference |");
  lines.push("| Hallucinated Labs | Invented lab results not in reference |");
  lines.push("");
  
  lines.push("#### Embedding Metrics (Azure OpenAI text-embedding-3-large)");
  lines.push("");
  lines.push("| Metric | Description |");
  lines.push("|--------|-------------|");
  lines.push("| Overall Similarity | Cosine similarity of full text embeddings |");
  lines.push("| Semantic Precision | Relevance of SOAP content to reference |");
  lines.push("| Semantic Recall | Coverage of reference content in SOAP |");
  lines.push("| Semantic F1 | Harmonic mean of precision and recall |");
  lines.push("| Diagnosis Similarity | Embedding similarity of diagnosis text |");
  lines.push("| Avg Highlight Similarity | Mean embedding similarity for key phrases |");
  lines.push("");
  
  // =========================================================================
  // DETAILED PER-MODEL COMPARISON
  // =========================================================================
  lines.push("---");
  lines.push("");
  lines.push("## 📈 Detailed Per-Model Comparison");
  lines.push("");
  
  // Resort by unified score
  const sortedModels = Object.entries(modelAverages)
    .sort((a, b) => b[1].unified - a[1].unified);
  
  lines.push("### Basic Metrics");
  lines.push("");
  lines.push("| Model | Schema | Sections | Highlight | Symptom | Negation | Diagnosis | ROUGE-L | Hallu. Labs |");
  lines.push("|-------|--------|----------|-----------|---------|----------|-----------|---------|-------------|");
  
  for (const [model, avg] of sortedModels) {
    const allEvals = unified[model];
    const schemaValid = allEvals.every(e => e.schemaValid);
    const sectionsComplete = allEvals.every(e => e.sectionCompleteness === 1);
    lines.push(`| ${model} | ${boolToEmoji(schemaValid)} | ${boolToEmoji(sectionsComplete)} | ${formatPercent(avg.highlightRecall)} | ${formatPercent(avg.symptomRecall)} | ${formatPercent(avg.negationRate)} | ${formatPercent(avg.diagnosisGrounded)} | ${formatScore(allEvals.reduce((s, e) => s + e.rougeLScore, 0) / allEvals.length)} | ${avg.halluLabs}/5 |`);
  }
  lines.push("");
  
  lines.push("### Embedding Metrics");
  lines.push("");
  lines.push("| Model | Overall Sim | Precision | Recall | F1 Score | Diagnosis Sim | Highlight Sim |");
  lines.push("|-------|-------------|-----------|--------|----------|---------------|---------------|");
  
  for (const [model, avg] of sortedModels) {
    const allEvals = unified[model];
    const precision = allEvals.reduce((s, e) => s + e.semanticPrecision, 0) / allEvals.length;
    const recall = allEvals.reduce((s, e) => s + e.semanticRecall, 0) / allEvals.length;
    const diagSim = allEvals.reduce((s, e) => s + e.diagnosisSemanticMatch, 0) / allEvals.length;
    const highSim = allEvals.reduce((s, e) => s + e.avgHighlightSimilarity, 0) / allEvals.length;
    lines.push(`| ${model} | ${formatScore(avg.overallSim)} | ${formatScore(precision)} | ${formatScore(recall)} | ${formatScore(avg.semanticF1)} | ${formatScore(diagSim)} | ${formatScore(highSim)} |`);
  }
  lines.push("");
  
  // =========================================================================
  // PER-IMAGE ANALYSIS
  // =========================================================================
  lines.push("---");
  lines.push("");
  lines.push("## 🏥 Per-Image Analysis");
  lines.push("");
  
  const imageDescriptions: Record<string, string> = {
    "medical_note_05.png": "Eczema Flare-up",
    "medical_note_06.png": "Migraine",
    "medical_note_07.png": "Viral URTI/Influenza",
    "medical_note_08.png": "UTI",
    "medical_note_09.png": "Gastroenteritis"
  };
  
  const imageOrder = [
    "medical_note_05.png",
    "medical_note_06.png",
    "medical_note_07.png",
    "medical_note_08.png",
    "medical_note_09.png"
  ];
  
  for (const image of imageOrder) {
    const desc = imageDescriptions[image];
    lines.push(`### ${image.replace("medical_note_", "Note ")} - ${desc}`);
    lines.push("");
    
    // Collect all model results for this image
    const imageResults: UnifiedMetrics[] = [];
    for (const [model, evals] of Object.entries(unified)) {
      const eval_ = evals.find(e => e.image === image);
      if (eval_) imageResults.push(eval_);
    }
    
    // Sort by unified composite
    imageResults.sort((a, b) => b.unifiedComposite - a.unifiedComposite);
    
    lines.push("| Rank | Model | Unified | Basic | Embedding | Highlight | F1 | Diagnosis |");
    lines.push("|------|-------|---------|-------|-----------|-----------|-----|-----------|");
    
    imageResults.forEach((e, i) => {
      const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`;
      lines.push(`| ${medal} | ${e.model} | ${formatScore(e.unifiedComposite)} | ${formatScore(e.basicComposite)} | ${formatScore(e.embeddingComposite)} | ${formatPercent(e.highlightRecall)} | ${formatScore(e.semanticF1)} | ${boolToEmoji(e.diagnosisGrounded)} |`);
    });
    lines.push("");
  }
  
  // =========================================================================
  // HALLUCINATION & SAFETY
  // =========================================================================
  lines.push("---");
  lines.push("");
  lines.push("## ⚠️ Hallucination & Safety Analysis");
  lines.push("");
  
  lines.push("| Model | Hallucinated Vitals | Hallucinated Labs | Negation Errors | Safety Score |");
  lines.push("|-------|---------------------|-------------------|-----------------|--------------|");
  
  for (const [model] of sortedModels) {
    const allEvals = unified[model];
    const halluVitals = allEvals.filter(e => e.hallucinatedVitals).length;
    const halluLabs = allEvals.filter(e => e.hallucinatedLabs).length;
    const avgNegation = allEvals.reduce((s, e) => s + e.negationPreservationRate, 0) / allEvals.length;
    const safetyScore = ((5 - halluVitals) / 5 * 0.3 + (5 - halluLabs) / 5 * 0.4 + avgNegation * 0.3);
    lines.push(`| ${model} | ${halluVitals}/5 ${halluVitals === 0 ? "✅" : "⚠️"} | ${halluLabs}/5 ${halluLabs <= 2 ? "✅" : "⚠️"} | ${formatPercent(1 - avgNegation)} | ${formatScore(safetyScore)} |`);
  }
  lines.push("");
  lines.push("> **Safety Score** = 0.3×NoVitalHallucination + 0.4×NoLabHallucination + 0.3×NegationPreservation");
  lines.push("");
  
  // =========================================================================
  // LATENCY ANALYSIS
  // =========================================================================
  lines.push("---");
  lines.push("");
  lines.push("## ⏱️ Latency Analysis");
  lines.push("");
  
  lines.push("| Model | Avg Latency (s) | Min (s) | Max (s) |");
  lines.push("|-------|-----------------|---------|---------|");
  
  for (const [model] of sortedModels) {
    const allEvals = unified[model];
    const latencies = allEvals.map(e => e.latencyMs / 1000);
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
  lines.push("## 📋 Full Results Table");
  lines.push("");
  lines.push("<details>");
  lines.push("<summary>Click to expand all 35 evaluation results</summary>");
  lines.push("");
  lines.push("| Image | Model | Unified | Basic | Embed | Highlight | Symptom | Diag | F1 | ROUGE | Hallu |");
  lines.push("|-------|-------|---------|-------|-------|-----------|---------|------|-----|-------|-------|");
  
  // Sort all results
  const allResults: UnifiedMetrics[] = [];
  for (const evals of Object.values(unified)) {
    allResults.push(...evals);
  }
  allResults.sort((a, b) => {
    if (a.image !== b.image) return a.image.localeCompare(b.image);
    return b.unifiedComposite - a.unifiedComposite;
  });
  
  for (const e of allResults) {
    const hallu = e.hallucinatedLabs ? "⚠️" : "✅";
    lines.push(`| ${e.image.replace("medical_note_", "").replace(".png", "")} | ${e.model} | ${formatScore(e.unifiedComposite)} | ${formatScore(e.basicComposite)} | ${formatScore(e.embeddingComposite)} | ${formatPercent(e.highlightRecall)} | ${formatPercent(e.symptomRecall)} | ${boolToEmoji(e.diagnosisGrounded)} | ${formatScore(e.semanticF1)} | ${formatScore(e.rougeLScore)} | ${hallu} |`);
  }
  
  lines.push("");
  lines.push("</details>");
  lines.push("");
  
  // =========================================================================
  // RECOMMENDATIONS
  // =========================================================================
  lines.push("---");
  lines.push("");
  lines.push("## 🎯 Recommendations");
  lines.push("");
  
  const top3 = rankings.slice(0, 3);
  lines.push("### Production Deployment");
  lines.push("");
  lines.push(`1. **${top3[0].model}** - Best overall unified score (${formatScore(top3[0].unified)})`);
  lines.push(`   - Excels in: ${top3[0].semanticF1 > 0.65 ? "Semantic understanding, " : ""}${top3[0].highlightRecall > 0.85 ? "Information extraction, " : ""}${top3[0].diagnosisGrounded > 0.9 ? "Diagnosis accuracy" : "Content coverage"}`);
  lines.push("");
  lines.push(`2. **${top3[1].model}** - Strong runner-up (${formatScore(top3[1].unified)})`);
  lines.push(`   - Consider for: ${top3[1].halluLabs < 3 ? "Lower hallucination use cases" : "General extraction"}`);
  lines.push("");
  lines.push(`3. **${top3[2].model}** - Solid alternative (${formatScore(top3[2].unified)})`);
  lines.push("");
  
  lines.push("### Use Case Recommendations");
  lines.push("");
  lines.push("| Use Case | Recommended Model | Reason |");
  lines.push("|----------|-------------------|--------|");
  lines.push(`| General SOAP extraction | ${best.model} | Highest unified score |`);
  lines.push(`| Semantic accuracy needed | ${bestSemantic.model} | Best F1 score (${formatScore(bestSemantic.semanticF1)}) |`);
  lines.push(`| Safety-critical applications | ${leastHallucination.model} | Fewest hallucinations |`);
  lines.push(`| Latency-sensitive | claude-sonnet | Fastest avg response |`);
  lines.push("");
  
  lines.push("---");
  lines.push("");
  lines.push("*Report generated by Unified Evaluation Suite combining Tests.md metrics + Azure OpenAI text-embedding-3-large semantic analysis*");
  
  return lines.join("\n");
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log("=".repeat(80));
  console.log("  UNIFIED EVALUATION REPORT GENERATOR");
  console.log("=".repeat(80));
  console.log("");
  
  console.log("Loading evaluation data...");
  const { basic, embedding } = loadData();
  console.log(`  ✅ Loaded basic evaluation data (${Object.keys(basic).length} models)`);
  console.log(`  ✅ Loaded embedding evaluation data (${Object.keys(embedding).length} models)`);
  console.log("");
  
  console.log("Merging metrics...");
  const unified = mergeMetrics(basic, embedding);
  console.log(`  ✅ Merged ${Object.values(unified).flat().length} unified evaluations`);
  console.log("");
  
  console.log("Generating unified report...");
  const report = generateUnifiedReport(unified);
  fs.writeFileSync(OUTPUT_PATH, report);
  console.log(`  ✅ Saved to ${OUTPUT_PATH}`);
  
  console.log("");
  console.log("=".repeat(80));
  console.log("  REPORT GENERATION COMPLETE");
  console.log("=".repeat(80));
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
