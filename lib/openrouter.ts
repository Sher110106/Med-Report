import OpenAI from "openai";

// OpenRouter API client using OpenAI-compatible interface
const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "",
});

// Model IDs on OpenRouter
export const OPENROUTER_MODELS = {
  DEEPSEEK_V3_2: "deepseek/deepseek-chat-v3-0324",
  GLM_4_7: "thudm/glm-4-32b",
  KIMI_K2: "moonshotai/kimi-k2",
  QWEN_72B: "qwen/qwen-2.5-72b-instruct",
} as const;

export type OpenRouterModel = keyof typeof OPENROUTER_MODELS;

export interface OpenRouterResponse {
  success: boolean;
  content?: string;
  model: string;
  modelId: string;
  error?: string;
  latencyMs?: number;
  inputTokens?: number;
  outputTokens?: number;
}

export function isOpenRouterConfigured(): boolean {
  return !!process.env.OPENROUTER_API_KEY;
}

export async function callOpenRouter(
  modelKey: OpenRouterModel,
  systemPrompt: string,
  userContent: string
): Promise<OpenRouterResponse> {
  const modelId = OPENROUTER_MODELS[modelKey];
  const startTime = Date.now();

  if (!isOpenRouterConfigured()) {
    return {
      success: false,
      model: modelKey,
      modelId,
      error: "OpenRouter API key not configured",
    };
  }

  try {
    const response = await client.chat.completions.create({
      model: modelId,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      max_tokens: 16384,
    });

    const latencyMs = Date.now() - startTime;

    return {
      success: true,
      content: response.choices[0]?.message?.content || "",
      model: modelKey,
      modelId,
      latencyMs,
      inputTokens: response.usage?.prompt_tokens,
      outputTokens: response.usage?.completion_tokens,
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

// Helper to get human-readable model names
export function getModelDisplayName(modelKey: OpenRouterModel): string {
  const names: Record<OpenRouterModel, string> = {
    DEEPSEEK_V3_2: "DeepSeek V3.2",
    GLM_4_7: "GLM 4.7",
    KIMI_K2: "Kimi K2 Thinking",
    QWEN_72B: "Qwen2.5-72B-Instruct",
  };
  return names[modelKey];
}
