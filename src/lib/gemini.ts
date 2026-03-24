import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/** Model for text-only tasks (analysis, chat) */
export function getTextModel() {
  return genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
}

/** Convert a data URL (data:image/png;base64,...) to Gemini's inline data format */
export function dataUrlToGeminiPart(dataUrl: string) {
  const match = dataUrl.match(/^data:(.+?);base64,(.+)$/);
  if (!match) throw new Error("Invalid data URL");
  return {
    inlineData: {
      mimeType: match[1],
      data: match[2],
    },
  };
}
