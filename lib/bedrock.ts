import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

// AWS Bedrock client for Claude
const getBedrockClient = () => {
  return new BedrockRuntimeClient({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
  });
};

export const BEDROCK_MODELS = {
  CLAUDE_SONNET: "us.anthropic.claude-sonnet-4-20250514-v1:0",
} as const;

export type BedrockModel = keyof typeof BEDROCK_MODELS;

export interface BedrockResponse {
  success: boolean;
  content?: string;
  model: string;
  modelId: string;
  error?: string;
  latencyMs?: number;
  inputTokens?: number;
  outputTokens?: number;
}

export function isBedrockConfigured(): boolean {
  return !!(
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
  );
}

export async function callBedrock(
  modelKey: BedrockModel,
  systemPrompt: string,
  userContent: string
): Promise<BedrockResponse> {
  const modelId = BEDROCK_MODELS[modelKey];
  const startTime = Date.now();

  if (!isBedrockConfigured()) {
    return {
      success: false,
      model: modelKey,
      modelId,
      error: "AWS Bedrock credentials not configured",
    };
  }

  try {
    const client = getBedrockClient();

    const payload = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 16384,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userContent,
        },
      ],
    };

    const command = new InvokeModelCommand({
      modelId,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(payload),
    });

    const response = await client.send(command);
    const latencyMs = Date.now() - startTime;

    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    return {
      success: true,
      content: responseBody.content?.[0]?.text || "",
      model: modelKey,
      modelId,
      latencyMs,
      inputTokens: responseBody.usage?.input_tokens,
      outputTokens: responseBody.usage?.output_tokens,
    };
  } catch (error: any) {
    return {
      success: false,
      model: modelKey,
      modelId,
      error: error.message || "Unknown error",
      latencyMs: Date.now() - startTime,
    };
  }
}

export function getBedrockModelDisplayName(modelKey: BedrockModel): string {
  const names: Record<BedrockModel, string> = {
    CLAUDE_SONNET: "Claude Sonnet 4.5",
  };
  return names[modelKey];
}
