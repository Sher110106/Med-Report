import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const geminiModels = {
  pro: genAI.getGenerativeModel({ model: "gemini-3-pro-preview" }),
  flash: genAI.getGenerativeModel({ model: "gemini-3-flash-preview" }),
};

export async function callGeminiWithImage(
  model: "pro" | "flash",
  prompt: string,
  imageBase64: string,
  mimeType: string
) {
  const selectedModel = geminiModels[model];

  const imagePart = {
    inlineData: {
      data: imageBase64,
      mimeType,
    },
  };

  const result = await selectedModel.generateContent([prompt, imagePart]);
  const response = await result.response;
  return response.text();
}

export async function callGeminiWithText(
  model: "pro" | "flash",
  prompt: string,
  text: string
) {
  const selectedModel = geminiModels[model];
  const fullPrompt = `${prompt}\n\nINPUT TEXT:\n"""\n${text}\n"""`;

  const result = await selectedModel.generateContent(fullPrompt);
  const response = await result.response;
  return response.text();
}
