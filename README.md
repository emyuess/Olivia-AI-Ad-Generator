# AdCraft — AI Product Ad Generator

An AI-powered product ad generator that transforms product photos into stunning ad creatives using conversational AI.

## Features

- **Smart Product Detection** — Upload any product image and Gemini automatically identifies the product type, colors, mood, and suggests tailored ad prompts
- **AI Ad Generation** — Uses Gemini 2.5 Flash with native image generation to create professional advertising creatives that preserve the actual product appearance
- **Conversational Iteration** — Chat-based interface to refine ads: "make the background warmer", "add a headline", "try a different style"
- **Agentic Behavior** — The system auto-detects product type, suggests context-aware prompts, optimizes your descriptions into detailed creative briefs, and decides when to trigger generation
- **Canvas Editor Feel** — Zoom controls, hold-to-compare with original, version history thumbnails, download
- **Version History** — Browse through all generated versions with thumbnail strip

## Tech Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS v4
- **Google Gemini API** — Gemini 2.5 Flash (vision + chat) + Gemini 2.5 Flash Preview Image Generation
- Deployed on Vercel

## Getting Started

```bash
# Install dependencies
npm install

# Set your Gemini API key (free from Google AI Studio)
cp .env.example .env.local
# Edit .env.local with your key

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How It Works

1. **Upload** a product photo (PNG, JPG, WebP)
2. Gemini **analyzes** the image — detects product type, colors, mood
3. Pick a **suggested prompt** or write your own
4. Gemini generates an ad creative with the **actual product** in the scene (image-to-image, not text-to-image)
5. **Iterate** via chat — the AI decides when to re-generate vs. give creative direction

## Architecture

```
src/
├── app/
│   ├── api/
│   │   ├── analyze/   # Gemini vision — product analysis
│   │   ├── generate/  # Gemini image-to-image generation
│   │   └── chat/      # Conversational AI with auto-generation
│   ├── layout.tsx
│   ├── page.tsx       # Main app orchestrator
│   └── globals.css
├── components/
│   ├── UploadZone.tsx # Drag-and-drop upload
│   ├── Canvas.tsx     # Image display + editor controls
│   └── ChatSidebar.tsx# Chat UI + suggestions
└── lib/
    ├── gemini.ts      # Gemini client
    └── types.ts       # Shared types
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Your Google Gemini API key (free from [Google AI Studio](https://aistudio.google.com/apikey)) |

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/ad-generator&env=GEMINI_API_KEY)

1. Push to GitHub
2. Import in Vercel
3. Add `GEMINI_API_KEY` environment variable
4. Deploy
