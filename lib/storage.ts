import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface ModelRunResult {
  modelName: string;
  modelId: string;
  success: boolean;
  output?: any;
  error?: string;
  latencyMs?: number;
  inputTokens?: number;
  outputTokens?: number;
  confidenceScore?: number;
}

export interface ComparisonRun {
  id: string;
  timestamp: string;
  imageHash: string;
  ocrText: string;
  results: ModelRunResult[];
}

const STORAGE_DIR = path.join(process.cwd(), "data");
const STORAGE_FILE = path.join(STORAGE_DIR, "model-runs.json");

function ensureStorageDir() {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
}

function loadRuns(): ComparisonRun[] {
  ensureStorageDir();
  if (!fs.existsSync(STORAGE_FILE)) {
    return [];
  }
  try {
    const data = fs.readFileSync(STORAGE_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveRuns(runs: ComparisonRun[]) {
  ensureStorageDir();
  fs.writeFileSync(STORAGE_FILE, JSON.stringify(runs, null, 2));
}

export function generateImageHash(imageBuffer: Buffer): string {
  return crypto.createHash("sha256").update(imageBuffer).digest("hex").slice(0, 16);
}

export function saveComparisonRun(run: ComparisonRun): void {
  const runs = loadRuns();
  runs.push(run);
  saveRuns(runs);

  // Also save individual model files for easier access
  const runDir = path.join(STORAGE_DIR, "runs", run.id);
  if (!fs.existsSync(runDir)) {
    fs.mkdirSync(runDir, { recursive: true });
  }

  // Save the full run metadata
  fs.writeFileSync(
    path.join(runDir, "meta.json"),
    JSON.stringify({
      id: run.id,
      timestamp: run.timestamp,
      imageHash: run.imageHash,
      ocrText: run.ocrText
    }, null, 2)
  );

  // Save each model's output individually
  run.results.forEach(result => {
    if (result.success && result.output) {
      fs.writeFileSync(
        path.join(runDir, `${result.modelId}.json`),
        JSON.stringify(result.output, null, 2)
      );
    }
  });
}

export function getAllRuns(): ComparisonRun[] {
  return loadRuns();
}

export function getRunById(id: string): ComparisonRun | undefined {
  const runs = loadRuns();
  return runs.find((r) => r.id === id);
}

export function generateRunId(): string {
  return `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
