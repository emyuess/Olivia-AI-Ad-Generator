import { NextRequest, NextResponse } from "next/server";
import { getTextModel, dataUrlToGeminiPart } from "@/lib/gemini";
import type { ProductAnalysis } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const model = getTextModel();

    const result = await model.generateContent([
      {
        text: `You are an expert product photographer and advertising creative director.
Analyze the product image and return a JSON object with exactly these fields:
- productType: string (e.g. "skincare bottle", "sneaker", "watch", "candle")
- description: string (brief description of the product)
- colors: string[] (dominant colors in the product)
- mood: string (the visual mood/aesthetic e.g. "minimal", "luxury", "playful")
- suggestedPrompts: string[] (5 creative ad prompt suggestions tailored to this specific product)

Make the suggested prompts specific, creative, and varied — covering different ad styles like lifestyle, social media, editorial, seasonal, etc. Return ONLY valid JSON, no markdown fences.`,
      },
      dataUrlToGeminiPart(imageBase64),
    ]);

    const text = result.response.text();
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
    const analysis: ProductAnalysis = JSON.parse(cleaned);

    return NextResponse.json(analysis);
  } catch (error: unknown) {
    console.error("Analyze error:", error);
    const message = error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
