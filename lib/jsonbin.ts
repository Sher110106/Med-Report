/**
 * JSONBin.io Integration for Survey Responses
 *
 * Handles creating bins and submitting survey data to JSONBin.io
 */

const JSONBIN_API_URL = "https://api.jsonbin.io/v3";

interface SurveyResponse {
  imageId: string;
  submittedAt: string;
  doctorId: string;
  responses: Record<
    string,
    {
      a1_overall_fidelity: number;
      a2_subjective: number;
      a2_objective: number;
      a2_assessment: number;
      a2_plan: number;
      b1_hallucination: boolean;
      b2_critical_omission: boolean;
      b3_numerical_errors: boolean;
      c1_edit_effort: "increases_workload" | "neutral" | "saves_time";
      c2_trust_threshold: boolean;
      d_feedback: string;
    }
  >;
}

/**
 * Get the JSONBin access key from environment
 */
function getAccessKey(): string {
  const key = process.env.JSONBIN_ACCESS_KEY;
  if (!key) {
    throw new Error("JSONBIN_ACCESS_KEY environment variable is not set");
  }
  // Remove quotes if present (from .env.local escaping)
  return key.replace(/^["']|["']$/g, "");
}

/**
 * Get or create a bin ID - stored in environment or created fresh
 */
let cachedBinId: string | null = null;

export async function getOrCreateBin(): Promise<string> {
  // Check if we have a cached bin ID
  if (cachedBinId) {
    return cachedBinId;
  }

  // Check if bin ID is in environment
  const envBinId = process.env.JSONBIN_BIN_ID;
  if (envBinId) {
    cachedBinId = envBinId.replace(/^["']|["']$/g, "");
    return cachedBinId;
  }

  // Create a new bin
  const accessKey = getAccessKey();

  const response = await fetch(`${JSONBIN_API_URL}/b`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Master-Key": accessKey,
      "X-Bin-Name": "medical-soap-survey-responses",
    },
    body: JSON.stringify({
      surveys: [],
      createdAt: new Date().toISOString(),
      description: "Doctor evaluation survey responses for SOAP note extraction",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create JSONBin: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  cachedBinId = data.metadata.id;

  console.log(`Created new JSONBin with ID: ${cachedBinId}`);
  console.log(`Add JSONBIN_BIN_ID="${cachedBinId}" to your .env.local to reuse this bin`);

  return cachedBinId!;
}

/**
 * Submit a completed survey response to JSONBin
 */
export async function submitSurveyResponse(
  surveyData: SurveyResponse
): Promise<{ success: boolean; binId: string }> {
  const accessKey = getAccessKey();
  const binId = await getOrCreateBin();

  // First, get existing data
  const getResponse = await fetch(`${JSONBIN_API_URL}/b/${binId}/latest`, {
    headers: {
      "X-Master-Key": accessKey,
    },
  });

  if (!getResponse.ok) {
    throw new Error(`Failed to fetch existing data: ${getResponse.status}`);
  }

  const existingData = await getResponse.json();
  const surveys = existingData.record?.surveys || [];

  // Add the new survey response
  surveys.push(surveyData);

  // Update the bin
  const updateResponse = await fetch(`${JSONBIN_API_URL}/b/${binId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Master-Key": accessKey,
    },
    body: JSON.stringify({
      ...existingData.record,
      surveys,
      lastUpdated: new Date().toISOString(),
    }),
  });

  if (!updateResponse.ok) {
    const errorText = await updateResponse.text();
    throw new Error(`Failed to update JSONBin: ${updateResponse.status} - ${errorText}`);
  }

  return { success: true, binId };
}

/**
 * Get all survey responses from JSONBin
 */
export async function getSurveyResponses(): Promise<SurveyResponse[]> {
  const accessKey = getAccessKey();
  const binId = await getOrCreateBin();

  const response = await fetch(`${JSONBIN_API_URL}/b/${binId}/latest`, {
    headers: {
      "X-Master-Key": accessKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch survey responses: ${response.status}`);
  }

  const data = await response.json();
  return data.record?.surveys || [];
}
