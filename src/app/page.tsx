"use client";

import { useState, useCallback } from "react";
import UploadZone from "@/components/UploadZone";
import Canvas from "@/components/Canvas";
import ChatSidebar from "@/components/ChatSidebar";
import type { ChatMessage, ProductAnalysis } from "@/lib/types";

export default function Home() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [originalFileName, setOriginalFileName] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "assistant"; content: string }[]>([]);

  const addMessage = useCallback((role: "user" | "assistant", content: string, imageUrl?: string) => {
    const msg: ChatMessage = {
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      role,
      content,
      imageUrl,
    };
    setMessages((prev) => prev.filter((m) => !m.isLoading).concat(msg));
    return msg;
  }, []);

  const addLoadingMessage = useCallback(() => {
    const msg: ChatMessage = {
      id: "loading-" + Date.now(),
      role: "assistant",
      content: "",
      isLoading: true,
    };
    setMessages((prev) => [...prev, msg]);
  }, []);

  const handleUpload = useCallback(
    async (base64: string, fileName: string) => {
      setOriginalImage(base64);
      setOriginalFileName(fileName);
      setGeneratedImages([]);
      setCurrentIndex(0);
      setAnalysis(null);
      setMessages([]);
      setChatHistory([]);
      setIsAnalyzing(true);

      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64 }),
        });

        if (!res.ok) throw new Error("Analysis failed");
        const data: ProductAnalysis = await res.json();
        setAnalysis(data);
      } catch {
        addMessage("assistant", "I couldn't analyze the image. You can still describe what you'd like and I'll do my best!");
        setAnalysis({
          productType: "product",
          description: "Uploaded product image",
          colors: [],
          mood: "neutral",
          suggestedPrompts: [
            "Clean product photo on white background",
            "Lifestyle shot in a cozy home setting",
            "Bold social media ad with vibrant colors",
            "Minimalist editorial product shot",
            "Seasonal holiday advertisement",
          ],
        });
      } finally {
        setIsAnalyzing(false);
      }
    },
    [addMessage]
  );

  const generateImage = useCallback(
    async (prompt: string) => {
      if (!originalImage) return;
      setIsGenerating(true);

      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: originalImage,
            prompt,
            analysis,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Generation failed");
        }

        const data = await res.json();
        setGeneratedImages((prev) => {
          const next = [...prev, data.imageUrl];
          setCurrentIndex(next.length - 1);
          return next;
        });

        return data.imageUrl as string;
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Generation failed";
        addMessage("assistant", `Sorry, I couldn't generate the image: ${msg}. Try a different prompt?`);
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    [originalImage, analysis, addMessage]
  );

  const handleSend = useCallback(
    async (userMessage: string) => {
      addMessage("user", userMessage);
      const updatedHistory = [...chatHistory, { role: "user" as const, content: userMessage }];
      setChatHistory(updatedHistory);
      addLoadingMessage();

      try {
        // Send to chat API for creative direction
        const chatRes = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: updatedHistory,
            imageBase64: originalImage,
            analysis,
          }),
        });

        if (!chatRes.ok) throw new Error("Chat failed");
        const chatData = await chatRes.json();

        // Add assistant response
        addMessage("assistant", chatData.message);
        setChatHistory((prev) => [...prev, { role: "assistant", content: chatData.message }]);

        // If the AI decided to generate, trigger image generation
        if (chatData.generatePrompt) {
          setIsGenerating(true);
          const imageUrl = await generateImage(chatData.generatePrompt);
          if (imageUrl) {
            addMessage("assistant", "Here's your new ad creative! What do you think — want to adjust anything?");
          }
        }
      } catch {
        addMessage("assistant", "Something went wrong. Please try again.");
      }
    },
    [chatHistory, originalImage, analysis, addMessage, addLoadingMessage, generateImage]
  );

  const handleSuggestionClick = useCallback(
    async (prompt: string) => {
      addMessage("user", prompt);
      setChatHistory([{ role: "user", content: prompt }]);
      addLoadingMessage();

      // For suggestion clicks, go directly to generation with a brief creative note
      addMessage("assistant", `Great choice! I'm generating a "${prompt}" creative for your ${analysis?.productType || "product"}...`);
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: `Generating: ${prompt}` },
      ]);

      const imageUrl = await generateImage(prompt);
      if (imageUrl) {
        addMessage("assistant", "Here it is! You can iterate — try \"make the lighting warmer\", \"add a catchy headline\", or describe a completely different concept.");
      }
    },
    [analysis, addMessage, addLoadingMessage, generateImage]
  );

  const handleNewProject = () => {
    setOriginalImage(null);
    setOriginalFileName(null);
    setGeneratedImages([]);
    setCurrentIndex(0);
    setAnalysis(null);
    setIsAnalyzing(false);
    setIsGenerating(false);
    setMessages([]);
    setChatHistory([]);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-[var(--border)] bg-[var(--bg-elevated)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-[var(--text)]">AdCraft</h1>
            <p className="text-[10px] text-[var(--text-muted)]">AI Product Ad Generator</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {originalFileName && (
            <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-surface)] px-3 py-1.5 rounded-lg">
              {originalFileName}
            </span>
          )}
          {originalImage && (
            <button
              onClick={handleNewProject}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--border)] transition-colors"
            >
              New Project
            </button>
          )}
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex min-h-0">
        {/* Canvas / Upload area */}
        <div className="flex-1 flex flex-col p-5 min-w-0">
          {!originalImage ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full max-w-lg">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-[var(--text)] mb-2">
                    Create stunning product ads
                  </h2>
                  <p className="text-[var(--text-muted)]">
                    Upload a product photo and let AI transform it into scroll-stopping ad creatives
                  </p>
                </div>
                <UploadZone onUpload={handleUpload} disabled={isAnalyzing} />
                <div className="flex items-center justify-center gap-6 mt-8 text-xs text-[var(--text-muted)]">
                  <span className="flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                    ~20s generation
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    Iterate via chat
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/></svg>
                    Smart detection
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <Canvas
              originalImage={originalImage}
              generatedImages={generatedImages}
              currentIndex={currentIndex}
              onIndexChange={setCurrentIndex}
              isGenerating={isGenerating}
            />
          )}
        </div>

        {/* Chat sidebar */}
        {originalImage && (
          <div className="w-[380px] border-l border-[var(--border)] bg-[var(--bg-elevated)] flex-shrink-0">
            <ChatSidebar
              messages={messages}
              analysis={analysis}
              isAnalyzing={isAnalyzing}
              isGenerating={isGenerating}
              onSend={handleSend}
              onSuggestionClick={handleSuggestionClick}
            />
          </div>
        )}
      </div>
    </div>
  );
}
