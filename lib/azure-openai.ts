import { AzureOpenAI } from "openai";

const endpoint = "https://ai-sherpartap11019601ai587562462851.openai.azure.com/";
const deployment = "gpt-5-mini";
const visionDeployment = "gpt-4o"; // Vision-capable model for OCR
const apiVersion = "2024-12-01-preview";

// Lazy initialization to avoid crash when Azure credentials aren't configured
let client: AzureOpenAI | null = null;

function getClient(): AzureOpenAI {
  if (!client) {
    if (!process.env.AZURE_KEY) {
      throw new Error("AZURE_KEY environment variable is not set");
    }
    client = new AzureOpenAI({
      apiKey: process.env.AZURE_KEY,
      endpoint: endpoint,
      apiVersion: apiVersion,
    });
  }
  return client;
}

export async function callAzureOpenAI(
  systemPrompt: string,
  userContent: string
): Promise<string> {
  const response = await getClient().chat.completions.create({
    model: deployment,
    max_completion_tokens: 16384,
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: userContent,
      },
    ],
  });

  return response.choices[0].message.content || "";
}

export async function callAzureOpenAIWithImage(
  prompt: string,
  imageBase64: string,
  mimeType: string
): Promise<string> {
  const response = await getClient().chat.completions.create({
    model: visionDeployment,
    max_completion_tokens: 16384,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: prompt,
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${imageBase64}`,
            },
          },
        ],
      },
    ],
  });

  return response.choices[0].message.content || "";
}

