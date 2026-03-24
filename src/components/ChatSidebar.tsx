"use client";

import { useState, useRef, useEffect } from "react";
import type { ChatMessage, ProductAnalysis } from "@/lib/types";

interface ChatSidebarProps {
  messages: ChatMessage[];
  analysis: ProductAnalysis | null;
  isAnalyzing: boolean;
  isGenerating: boolean;
  onSend: (message: string) => void;
  onSuggestionClick: (prompt: string) => void;
}

export default function ChatSidebar({
  messages,
  analysis,
  isAnalyzing,
  isGenerating,
  onSend,
  onSuggestionClick,
}: ChatSidebarProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;
    onSend(input.trim());
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--border)]">
        <h2 className="text-sm font-semibold text-[var(--text)]">Creative Assistant</h2>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">Describe your ad, then iterate</p>
      </div>

      {/* Product analysis badge */}
      {isAnalyzing && (
        <div className="mx-4 mt-3 px-3 py-2 rounded-xl bg-[var(--accent-soft)] border border-[var(--accent)]/20 animate-fade-in">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
            <span className="text-xs text-[var(--accent)]">Analyzing product...</span>
          </div>
        </div>
      )}

      {analysis && !isAnalyzing && (
        <div className="mx-4 mt-3 px-3 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] animate-fade-in">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-2 h-2 rounded-full bg-[var(--success)]" />
            <span className="text-xs font-medium text-[var(--text)]">
              Detected: {analysis.productType}
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">{analysis.description}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {analysis.colors.map((color, i) => (
              <span key={i} className="px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] text-[10px] text-[var(--text-muted)]">
                {color}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {messages.length === 0 && !analysis && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--bg-surface)] flex items-center justify-center mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <p className="text-sm text-[var(--text-muted)]">Upload a product image to get started</p>
          </div>
        )}

        {/* Suggestions */}
        {analysis && messages.length === 0 && (
          <div className="space-y-2 animate-fade-in">
            <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Suggested prompts</p>
            {analysis.suggestedPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => onSuggestionClick(prompt)}
                disabled={isGenerating}
                className="w-full text-left px-3 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[var(--accent)]/40 hover:bg-[var(--accent-soft)] transition-all duration-200 text-xs text-[var(--text)] leading-relaxed disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`animate-fade-in ${msg.role === "user" ? "flex justify-end" : ""}`}
          >
            <div
              className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-[var(--accent)] text-white rounded-br-md"
                  : "bg-[var(--bg-surface)] text-[var(--text)] rounded-bl-md"
              }`}
            >
              {msg.isLoading ? (
                <div className="flex gap-1 py-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-current opacity-40"
                      style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
                    />
                  ))}
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="px-4 pb-4 pt-2">
        <div className="relative flex items-end bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl focus-within:border-[var(--accent)]/50 transition-colors">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={analysis ? "Describe your ad concept..." : "Upload an image first..."}
            disabled={!analysis || isGenerating}
            rows={1}
            className="flex-1 bg-transparent text-sm text-[var(--text)] placeholder-[var(--text-muted)] px-4 py-3 resize-none focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isGenerating || !analysis}
            className="p-2 m-1.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-30 disabled:hover:bg-[var(--accent)] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
