import { NextRequest, NextResponse } from "next/server";
import { getTextModel } from "@/lib/gemini";
import type { ProductAnalysis } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { messages, analysis } = (await req.json()) as {
      messages: { role: "user" | "assistant"; content: string }[];
      imageBase64: string;
      analysis: ProductAnalysis | null;
    };

    const productContext = analysis
      ? `You are working with a ${analysis.productType}. Colors: ${analysis.colors.join(", ")}. Mood: ${analysis.mood}. ${analysis.description}`
      : "A product image has been uploaded.";

    const systemPrompt = `You are AdCraft AI, a creative advertising assistant. You help users create product advertisements.

Current product context: ${productContext}

You can help users:
1. Refine their ad concept (suggest compositions, styles, moods)
2. Write ad copy / headlines for overlays
3. Iterate on generated images ("make it warmer", "add text", etc.)

When a user wants to modify or generate a new image, respond with helpful creative direction AND include the marker [GENERATE] at the end of your message followed by the optimized prompt to pass to the image generator. Only include [GENERATE] when the user is asking for image generation/modification.

Keep responses concise and creative. Be opinionated — suggest improvements proactively.`;

    const model = getTextModel();

    // Build Gemini chat history
    const geminiHistory = messages.slice(0, -1).map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "Understood. I'm AdCraft AI, ready to help create stunning product ads. What would you like to create?" }] },
        ...geminiHistory,
      ],
    });

    const lastMessage = messages[messages.length - 1]?.content ?? "";
    const result = await chat.sendMessage(lastMessage);
    const content = result.response.text();

    // Check if response includes a generation request
    const hasGenerate = content.includes("[GENERATE]");
    let chatText = content;
    let generatePrompt: string | null = null;

    if (hasGenerate) {
      const parts = content.split("[GENERATE]");
      chatText = parts[0].trim();
      generatePrompt = parts[1]?.trim() || null;
    }

    return NextResponse.json({
      message: chatText,
      generatePrompt,
    });
  } catch (error: unknown) {
    console.error("Chat error:", error);
    const message = error instanceof Error ? error.message : "Chat failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
