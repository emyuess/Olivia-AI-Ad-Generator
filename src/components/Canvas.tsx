"use client";

import { useState } from "react";

interface CanvasProps {
  originalImage: string | null;
  generatedImages: string[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  isGenerating: boolean;
}

export default function Canvas({
  originalImage,
  generatedImages,
  currentIndex,
  onIndexChange,
  isGenerating,
}: CanvasProps) {
  const [zoom, setZoom] = useState(1);
  const [showOriginal, setShowOriginal] = useState(false);

  const currentImage = generatedImages[currentIndex];
  const displayImage = showOriginal ? originalImage : currentImage;

  return (
    <div className="flex flex-col h-full">
      {/* Canvas area */}
      <div className="flex-1 relative bg-[var(--canvas-bg)] rounded-2xl overflow-hidden flex items-center justify-center min-h-0">
        {isGenerating ? (
          <div className="flex flex-col items-center gap-4 animate-fade-in">
            <div className="w-20 h-20 rounded-2xl shimmer" />
            <div className="flex flex-col items-center gap-2">
              <p className="text-[var(--text)] font-medium">Generating your ad...</p>
              <p className="text-[var(--text-muted)] text-sm">This usually takes 10-20 seconds</p>
            </div>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-[var(--accent)]"
                  style={{
                    animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        ) : displayImage ? (
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayImage}
              alt="Generated ad"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-transform duration-200"
              style={{ transform: `scale(${zoom})` }}
            />
            {showOriginal && (
              <div className="absolute top-6 left-6 px-3 py-1.5 rounded-lg bg-black/70 text-xs font-medium text-white backdrop-blur-sm">
                Original
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-[var(--text-muted)]">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <p className="text-sm">Your generated ad will appear here</p>
          </div>
        )}
      </div>

      {/* Toolbar */}
      {(generatedImages.length > 0 || originalImage) && (
        <div className="flex items-center justify-between mt-3 px-1">
          <div className="flex items-center gap-2">
            {/* Zoom controls */}
            <button
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
              className="p-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--border)] transition-colors text-[var(--text-muted)] text-xs"
            >
              −
            </button>
            <span className="text-xs text-[var(--text-muted)] w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
              className="p-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--border)] transition-colors text-[var(--text-muted)] text-xs"
            >
              +
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Compare toggle */}
            {originalImage && generatedImages.length > 0 && (
              <button
                onMouseDown={() => setShowOriginal(true)}
                onMouseUp={() => setShowOriginal(false)}
                onMouseLeave={() => setShowOriginal(false)}
                className="px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--border)] transition-colors text-xs text-[var(--text-muted)]"
              >
                Hold to compare
              </button>
            )}

            {/* Navigation */}
            {generatedImages.length > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onIndexChange(Math.max(0, currentIndex - 1))}
                  disabled={currentIndex === 0}
                  className="p-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--border)] transition-colors disabled:opacity-30 text-[var(--text-muted)]"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                </button>
                <span className="text-xs text-[var(--text-muted)] px-2">
                  {currentIndex + 1} / {generatedImages.length}
                </span>
                <button
                  onClick={() => onIndexChange(Math.min(generatedImages.length - 1, currentIndex + 1))}
                  disabled={currentIndex === generatedImages.length - 1}
                  className="p-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--border)] transition-colors disabled:opacity-30 text-[var(--text-muted)]"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              </div>
            )}

            {/* Download */}
            {currentImage && (
              <a
                href={currentImage}
                download="adcraft-generated.png"
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--border)] transition-colors text-[var(--text-muted)]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Thumbnail history strip */}
      {generatedImages.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 px-1">
          {originalImage && (
            <div
              className="relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 border-[var(--border)] opacity-60"
              title="Original"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={originalImage} alt="Original" className="w-full h-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-[8px] text-white font-medium">
                SRC
              </div>
            </div>
          )}
          {generatedImages.map((img, i) => (
            <button
              key={i}
              onClick={() => onIndexChange(i)}
              className={`relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                i === currentIndex
                  ? "border-[var(--accent)] shadow-[0_0_12px_rgba(124,92,252,0.3)]"
                  : "border-[var(--border)] hover:border-[var(--border-hover)]"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt={`Version ${i + 1}`} className="w-full h-full object-cover" />
              <div className="absolute bottom-0.5 right-0.5 px-1 rounded bg-black/60 text-[8px] text-white">
                v{i + 1}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
