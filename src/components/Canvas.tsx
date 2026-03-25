"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontWeight: "normal" | "bold";
}

interface Filters {
  brightness: number;
  contrast: number;
  saturation: number;
}

interface HistoryEntry {
  overlays: TextOverlay[];
  filters: Filters;
}

interface CanvasProps {
  originalImage: string | null;
  generatedImages: string[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  isGenerating: boolean;
}

const DEFAULT_FILTERS: Filters = { brightness: 100, contrast: 100, saturation: 100 };

export default function Canvas({
  originalImage,
  generatedImages,
  currentIndex,
  onIndexChange,
  isGenerating,
}: CanvasProps) {
  const [zoom, setZoom] = useState(1);
  const [showOriginal, setShowOriginal] = useState(false);
  const [activeTool, setActiveTool] = useState<"select" | "text" | "filters">("select");
  const [overlays, setOverlays] = useState<TextOverlay[]>([]);
  const [selectedOverlay, setSelectedOverlay] = useState<string | null>(null);
  const [editingOverlay, setEditingOverlay] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [history, setHistory] = useState<HistoryEntry[]>([{ overlays: [], filters: DEFAULT_FILTERS }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [imageDimensions, setImageDimensions] = useState<{ w: number; h: number } | null>(null);
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const canvasAreaRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const currentImage = generatedImages[currentIndex];
  const displayImage = showOriginal ? originalImage : currentImage;

  // Push state to history
  const pushHistory = useCallback((newOverlays: TextOverlay[], newFilters: Filters) => {
    setHistory((prev) => {
      const trimmed = prev.slice(0, historyIndex + 1);
      return [...trimmed, { overlays: newOverlays, filters: newFilters }];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  // Undo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setOverlays(history[newIndex].overlays);
      setFilters(history[newIndex].filters);
    }
  }, [historyIndex, history]);

  // Redo
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setOverlays(history[newIndex].overlays);
      setFilters(history[newIndex].filters);
    }
  }, [historyIndex, history]);

  // Fit to window
  const fitToWindow = useCallback(() => {
    setZoom(1);
  }, []);

  // Scroll-wheel zoom
  useEffect(() => {
    const el = canvasAreaRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom((z) => Math.min(3, Math.max(0.25, z + delta)));
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z / Cmd+Z = Undo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Ctrl+Shift+Z / Cmd+Shift+Z = Redo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        redo();
      }
      // + / = to zoom in
      if (e.key === "=" || e.key === "+") {
        if (!e.ctrlKey && !e.metaKey) {
          setZoom((z) => Math.min(3, z + 0.25));
        }
      }
      // - to zoom out
      if (e.key === "-") {
        if (!e.ctrlKey && !e.metaKey) {
          setZoom((z) => Math.max(0.25, z - 0.25));
        }
      }
      // 0 to reset zoom
      if (e.key === "0" && !e.ctrlKey && !e.metaKey) {
        setZoom(1);
      }
      // Delete selected overlay
      if ((e.key === "Delete" || e.key === "Backspace") && selectedOverlay && !editingOverlay) {
        const newOverlays = overlays.filter((o) => o.id !== selectedOverlay);
        setOverlays(newOverlays);
        setSelectedOverlay(null);
        pushHistory(newOverlays, filters);
      }
      // T for text tool
      if (e.key === "t" && !e.ctrlKey && !e.metaKey && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        setActiveTool((t) => (t === "text" ? "select" : "text"));
      }
      // V for select tool
      if (e.key === "v" && !e.ctrlKey && !e.metaKey && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        setActiveTool("select");
      }
      // Escape
      if (e.key === "Escape") {
        setSelectedOverlay(null);
        setEditingOverlay(null);
        setActiveTool("select");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, selectedOverlay, editingOverlay, overlays, filters, pushHistory]);

  // Track image dimensions
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageDimensions({ w: img.naturalWidth, h: img.naturalHeight });
  };

  // Add text overlay on canvas click
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool !== "text" || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newOverlay: TextOverlay = {
      id: Date.now().toString(),
      text: "Your Text",
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
      fontSize: 24,
      color: "#ffffff",
      fontWeight: "bold",
    };

    const newOverlays = [...overlays, newOverlay];
    setOverlays(newOverlays);
    setSelectedOverlay(newOverlay.id);
    setEditingOverlay(newOverlay.id);
    pushHistory(newOverlays, filters);
    setActiveTool("select");
  };

  // Drag overlay
  const handleOverlayMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (editingOverlay === id) return;

    setSelectedOverlay(id);
    const overlay = overlays.find((o) => o.id === id);
    if (!overlay || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const offsetX = e.clientX - (rect.left + (overlay.x / 100) * rect.width);
    const offsetY = e.clientY - (rect.top + (overlay.y / 100) * rect.height);
    setDragging({ id, offsetX, offsetY });
  };

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!imageRef.current) return;
      const rect = imageRef.current.getBoundingClientRect();
      const x = ((e.clientX - dragging.offsetX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - dragging.offsetY - rect.top) / rect.height) * 100;

      setOverlays((prev) =>
        prev.map((o) =>
          o.id === dragging.id
            ? { ...o, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) }
            : o
        )
      );
    };

    const handleMouseUp = () => {
      pushHistory(overlays, filters);
      setDragging(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, overlays, filters, pushHistory]);

  // Update overlay text
  const updateOverlayText = (id: string, text: string) => {
    const newOverlays = overlays.map((o) => (o.id === id ? { ...o, text } : o));
    setOverlays(newOverlays);
  };

  // Update overlay property
  const updateOverlay = (id: string, updates: Partial<TextOverlay>) => {
    const newOverlays = overlays.map((o) => (o.id === id ? { ...o, ...updates } : o));
    setOverlays(newOverlays);
    pushHistory(newOverlays, filters);
  };

  // Update filters
  const updateFilter = (key: keyof Filters, value: number) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    pushHistory(overlays, newFilters);
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    pushHistory(overlays, DEFAULT_FILTERS);
  };

  const filterStyle = {
    filter: `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%)`,
  };

  const hasFilterChanges = filters.brightness !== 100 || filters.contrast !== 100 || filters.saturation !== 100;

  return (
    <div className="flex flex-col h-full">
      {/* Editor Toolbar */}
      {(generatedImages.length > 0 || originalImage) && (
        <div className="flex items-center gap-1 mb-2 px-1">
          {/* Tool buttons */}
          <div className="flex items-center gap-1 mr-3">
            <button
              onClick={() => setActiveTool("select")}
              className={`p-1.5 rounded-lg transition-colors text-xs ${
                activeTool === "select"
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--bg-surface)] hover:bg-[var(--border)] text-[var(--text-muted)]"
              }`}
              title="Select tool (V)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
              </svg>
            </button>
            <button
              onClick={() => setActiveTool("text")}
              className={`p-1.5 rounded-lg transition-colors text-xs ${
                activeTool === "text"
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--bg-surface)] hover:bg-[var(--border)] text-[var(--text-muted)]"
              }`}
              title="Text tool (T) — Click on image to add text"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 7 4 4 20 4 20 7" />
                <line x1="9" y1="20" x2="15" y2="20" />
                <line x1="12" y1="4" x2="12" y2="20" />
              </svg>
            </button>
            <button
              onClick={() => setActiveTool(activeTool === "filters" ? "select" : "filters")}
              className={`p-1.5 rounded-lg transition-colors text-xs ${
                activeTool === "filters"
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--bg-surface)] hover:bg-[var(--border)] text-[var(--text-muted)]"
              }`}
              title="Filters"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a10 10 0 0 1 0 20" fill="currentColor" opacity="0.3" />
              </svg>
            </button>
          </div>

          {/* Divider */}
          <div className="w-px h-5 bg-[var(--border)] mr-3" />

          {/* Undo/Redo */}
          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            className="p-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--border)] transition-colors disabled:opacity-30 text-[var(--text-muted)]"
            title="Undo (Ctrl+Z)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
          </button>
          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--border)] transition-colors disabled:opacity-30 text-[var(--text-muted)]"
            title="Redo (Ctrl+Shift+Z)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10" />
            </svg>
          </button>

          {/* Divider */}
          <div className="w-px h-5 bg-[var(--border)] mx-2" />

          {/* Keyboard shortcuts help */}
          <button
            onClick={() => setShowShortcuts(!showShortcuts)}
            className="p-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--border)] transition-colors text-[var(--text-muted)] text-xs"
            title="Keyboard shortcuts"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M8 16h8" />
            </svg>
          </button>
        </div>
      )}

      {/* Shortcuts tooltip */}
      {showShortcuts && (
        <div className="mb-2 mx-1 p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] text-xs text-[var(--text-muted)] animate-fade-in">
          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            <span><kbd className="px-1.5 py-0.5 rounded bg-[var(--border)] text-[var(--text)] font-mono text-[10px]">V</kbd> Select tool</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-[var(--border)] text-[var(--text)] font-mono text-[10px]">T</kbd> Text tool</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-[var(--border)] text-[var(--text)] font-mono text-[10px]">+</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-[var(--border)] text-[var(--text)] font-mono text-[10px]">-</kbd> Zoom</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-[var(--border)] text-[var(--text)] font-mono text-[10px]">0</kbd> Reset zoom</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-[var(--border)] text-[var(--text)] font-mono text-[10px]">Ctrl+Z</kbd> Undo</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-[var(--border)] text-[var(--text)] font-mono text-[10px]">Ctrl+Shift+Z</kbd> Redo</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-[var(--border)] text-[var(--text)] font-mono text-[10px]">Del</kbd> Delete selected</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-[var(--border)] text-[var(--text)] font-mono text-[10px]">Esc</kbd> Deselect</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-[var(--border)] text-[var(--text)] font-mono text-[10px]">Ctrl+Scroll</kbd> Wheel zoom</span>
          </div>
        </div>
      )}

      {/* Filters panel */}
      {activeTool === "filters" && (
        <div className="mb-2 mx-1 p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[var(--text)]">Adjustments</span>
            {hasFilterChanges && (
              <button onClick={resetFilters} className="text-[10px] text-[var(--accent)] hover:underline">
                Reset
              </button>
            )}
          </div>
          <div className="space-y-2.5">
            {[
              { key: "brightness" as const, label: "Brightness", icon: "☀" },
              { key: "contrast" as const, label: "Contrast", icon: "◑" },
              { key: "saturation" as const, label: "Saturation", icon: "◉" },
            ].map(({ key, label, icon }) => (
              <div key={key} className="flex items-center gap-3">
                <span className="text-xs w-5 text-center">{icon}</span>
                <span className="text-xs text-[var(--text-muted)] w-16">{label}</span>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={filters[key]}
                  onChange={(e) => updateFilter(key, Number(e.target.value))}
                  className="flex-1 h-1 accent-[var(--accent)] cursor-pointer"
                />
                <span className="text-[10px] text-[var(--text-muted)] w-8 text-right font-mono">
                  {filters[key]}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected text overlay properties */}
      {selectedOverlay && overlays.find((o) => o.id === selectedOverlay) && (
        <div className="mb-2 mx-1 p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[var(--text)]">Text Properties</span>
            <button
              onClick={() => {
                const newOverlays = overlays.filter((o) => o.id !== selectedOverlay);
                setOverlays(newOverlays);
                setSelectedOverlay(null);
                pushHistory(newOverlays, filters);
              }}
              className="text-[10px] text-red-400 hover:underline"
            >
              Delete
            </button>
          </div>
          {(() => {
            const overlay = overlays.find((o) => o.id === selectedOverlay)!;
            return (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={overlay.text}
                  onChange={(e) => updateOverlayText(overlay.id, e.target.value)}
                  onBlur={() => pushHistory(overlays, filters)}
                  className="flex-1 px-2 py-1 rounded bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--text)] outline-none focus:border-[var(--accent)]"
                />
                <input
                  type="color"
                  value={overlay.color}
                  onChange={(e) => updateOverlay(overlay.id, { color: e.target.value })}
                  className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                  title="Text color"
                />
                <input
                  type="range"
                  min="12"
                  max="72"
                  value={overlay.fontSize}
                  onChange={(e) => updateOverlay(overlay.id, { fontSize: Number(e.target.value) })}
                  className="w-16 h-1 accent-[var(--accent)] cursor-pointer"
                  title="Font size"
                />
                <span className="text-[10px] text-[var(--text-muted)] w-6 font-mono">{overlay.fontSize}</span>
                <button
                  onClick={() => updateOverlay(overlay.id, { fontWeight: overlay.fontWeight === "bold" ? "normal" : "bold" })}
                  className={`px-1.5 py-0.5 rounded text-xs font-bold transition-colors ${
                    overlay.fontWeight === "bold"
                      ? "bg-[var(--accent)] text-white"
                      : "bg-[var(--bg)] text-[var(--text-muted)] hover:bg-[var(--border)]"
                  }`}
                  title="Bold"
                >
                  B
                </button>
              </div>
            );
          })()}
        </div>
      )}

      {/* Canvas area */}
      <div
        ref={canvasAreaRef}
        className={`flex-1 relative bg-[var(--canvas-bg)] rounded-2xl overflow-hidden flex items-center justify-center min-h-0 ${
          activeTool === "text" ? "cursor-crosshair" : ""
        }`}
        onClick={handleCanvasClick}
      >
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
            <div className="relative" style={{ transform: `scale(${zoom})`, transition: "transform 0.15s ease" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imageRef}
                src={displayImage}
                alt="Generated ad"
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                style={filterStyle}
                onLoad={handleImageLoad}
                draggable={false}
              />
              {/* Text overlays */}
              {!showOriginal &&
                overlays.map((overlay) => (
                  <div
                    key={overlay.id}
                    className={`absolute select-none ${
                      selectedOverlay === overlay.id ? "ring-2 ring-[var(--accent)] ring-offset-1 ring-offset-transparent" : ""
                    } ${dragging?.id === overlay.id ? "cursor-grabbing" : "cursor-grab"}`}
                    style={{
                      left: `${overlay.x}%`,
                      top: `${overlay.y}%`,
                      transform: "translate(-50%, -50%)",
                      fontSize: `${overlay.fontSize}px`,
                      color: overlay.color,
                      fontWeight: overlay.fontWeight,
                      textShadow: "0 2px 8px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.5)",
                      lineHeight: 1.2,
                    }}
                    onMouseDown={(e) => handleOverlayMouseDown(e, overlay.id)}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setEditingOverlay(overlay.id);
                      setSelectedOverlay(overlay.id);
                    }}
                  >
                    {editingOverlay === overlay.id ? (
                      <input
                        type="text"
                        value={overlay.text}
                        onChange={(e) => updateOverlayText(overlay.id, e.target.value)}
                        onBlur={() => {
                          setEditingOverlay(null);
                          pushHistory(overlays, filters);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            setEditingOverlay(null);
                            pushHistory(overlays, filters);
                          }
                        }}
                        autoFocus
                        className="bg-transparent border-none outline-none text-inherit font-inherit"
                        style={{
                          fontSize: "inherit",
                          color: "inherit",
                          fontWeight: "inherit",
                          width: `${Math.max(overlay.text.length, 3)}ch`,
                        }}
                      />
                    ) : (
                      overlay.text
                    )}
                  </div>
                ))}
            </div>
            {showOriginal && (
              <div className="absolute top-6 left-6 px-3 py-1.5 rounded-lg bg-black/70 text-xs font-medium text-white backdrop-blur-sm">
                Original
              </div>
            )}
            {activeTool === "text" && !showOriginal && (
              <div className="absolute top-6 left-6 px-3 py-1.5 rounded-lg bg-[var(--accent)]/80 text-xs font-medium text-white backdrop-blur-sm">
                Click anywhere to add text
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

      {/* Bottom toolbar */}
      {(generatedImages.length > 0 || originalImage) && (
        <div className="flex items-center justify-between mt-3 px-1">
          <div className="flex items-center gap-2">
            {/* Zoom controls */}
            <button
              onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}
              className="p-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--border)] transition-colors text-[var(--text-muted)] text-xs"
              title="Zoom out (-)"
            >
              −
            </button>
            <span className="text-xs text-[var(--text-muted)] w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
              className="p-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--border)] transition-colors text-[var(--text-muted)] text-xs"
              title="Zoom in (+)"
            >
              +
            </button>
            <button
              onClick={fitToWindow}
              className="px-2 py-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--border)] transition-colors text-[10px] text-[var(--text-muted)]"
              title="Fit to window (0)"
            >
              Fit
            </button>

            {/* Divider */}
            <div className="w-px h-4 bg-[var(--border)] mx-1" />

            {/* Image dimensions */}
            {imageDimensions && (
              <span className="text-[10px] text-[var(--text-muted)] font-mono">
                {imageDimensions.w} × {imageDimensions.h}
              </span>
            )}
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
                title="Download"
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
