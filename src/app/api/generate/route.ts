import { NextRequest, NextResponse } from "next/server";
import { getTextModel, dataUrlToGeminiPart } from "@/lib/gemini";
import type { ProductAnalysis } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, prompt, analysis } = (await req.json()) as {
      imageBase64: string;
      prompt: string;
      analysis: ProductAnalysis | null;
    };

    if (!imageBase64 || !prompt) {
      return NextResponse.json({ error: "Image and prompt required" }, { status: 400 });
    }

    const productContext = analysis
      ? `Product: ${analysis.productType}. Colors: ${analysis.colors.join(", ")}. Mood: ${analysis.mood}. ${analysis.description}.`
      : "";

    // Step 1: Use Gemini to craft a detailed image generation prompt
    // Gemini can SEE the product image and describe it precisely
    const model = getTextModel();

    const result = await model.generateContent([
      dataUrlToGeminiPart(imageBase64),
      {
        text: `You are an expert advertising creative director. You are looking at a product image.

${productContext}

The user wants to create this ad: "${prompt}"

Write a highly detailed image generation prompt for an AI model (like Flux/Stable Diffusion) that will recreate this product in the requested advertising scene.

CRITICAL: Describe the product's exact appearance in vivid detail — shape, colors, materials, branding, labels, textures — so the image generator can recreate it accurately. Then describe the scene, lighting, composition, and style.

Rules:
- Be extremely specific about the product's visual appearance
- Describe the ad scene, background, lighting, and composition
- Include art direction (camera angle, depth of field, color grading)
- Keep it under 800 characters
- Return ONLY the prompt text, nothing else`,
      },
    ]);

    const imagePrompt = result.response.text().trim();

    // Step 2: Generate image using Pollinations.ai Flux model
    const pollinationsUrl = `https://gen.pollinations.ai/image/${encodeURIComponent(imagePrompt)}?model=flux&width=1024&height=1024&nologo=true`;

    const imageRes = await fetch(pollinationsUrl, {
      headers: {
        Authorization: `Bearer ${process.env.POLLINATIONS_API_KEY}`,
      },
      signal: AbortSignal.timeout(90000),
    });

    if (!imageRes.ok) {
      const errorText = await imageRes.text().catch(() => "");
      throw new Error(`Pollinations returned ${imageRes.status}: ${errorText}`);
    }

    const imageBuffer = await imageRes.arrayBuffer();
    const base64 = Buffer.from(imageBuffer).toString("base64");
    const contentType = imageRes.headers.get("content-type") || "image/jpeg";
    const imageUrl = `data:${contentType};base64,${base64}`;

    return NextResponse.json({
      imageUrl,
      description: imagePrompt,
    });
  } catch (error: unknown) {
    console.error("Generate error:", error);
    const message = error instanceof Error ? error.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
