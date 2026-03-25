# AdCraft — AI Product Ad Generator

**By Muhammad Usman Shahid**

An AI-powered product ad generator that transforms product photos into stunning ad creatives using conversational AI.

## Features

- **Smart Product Detection** — Upload any product image and Gemini automatically identifies the product type, colors, mood, and suggests tailored ad prompts
- **AI Ad Generation** — Gemini crafts optimized creative briefs, Pollinations Flux generates the visuals
- **Conversational Iteration** — Chat-based interface to refine ads: "make the background warmer", "add a headline", "try a different style"
- **Agentic Behavior** — The system auto-detects product type, suggests context-aware prompts, enhances user prompts into detailed creative briefs, and decides when to generate vs. ask clarifying questions
- **Canvas Editor Feel** — Zoom controls, hold-to-compare with original, version history thumbnails, download
- **Version History** — Browse through all generated versions with thumbnail strip

## Tech Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS v4
- **Google Gemini 2.5 Flash** — Vision analysis + chat/creative direction
- **Pollinations Flux** — Image generation
- Deployed on Vercel

## How It Works

1. **Upload** a product photo (PNG, JPG, WebP)
2. **Gemini analyzes** the image — detects product type, colors, mood
3. Pick a **suggested prompt** or write your own
4. **Gemini enhances** your prompt into a detailed creative brief
5. **Pollinations Flux** generates the ad creative
6. **Iterate** via chat — Gemini decides when to re-generate vs. give creative direction

## Architecture

```
Two AI models working together:
  Gemini 2.5 Flash → Brain (analysis, chat, prompt enhancement)
  Pollinations Flux → Image generation
```

```
src/
├── app/
│   ├── api/
│   │   ├── analyze/   # Gemini vision — product analysis
│   │   ├── generate/  # Pollinations Flux — image generation
│   │   └── chat/      # Conversational AI with auto-generation
│   ├── layout.tsx
│   ├── page.tsx       # Main app orchestrator
│   └── globals.css
├── components/
│   ├── UploadZone.tsx  # Drag-and-drop upload
│   ├── Canvas.tsx      # Image display + editor controls
│   └── ChatSidebar.tsx # Chat UI + suggestions
└── lib/
    ├── gemini.ts       # Gemini client
    └── types.ts        # Shared types
```

## Getting Started

```bash
# Install dependencies
npm install

# Set your API keys
cp .env.example .env.local
# Edit .env.local with your keys

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google Gemini API key (free from [Google AI Studio](https://aistudio.google.com/apikey)) |
| `POLLINATIONS_API_KEY` | Pollinations API key (from [Pollinations](https://pollinations.ai)) |

## Deploy

```bash
npm install -g vercel
vercel --prod
```

Or import from GitHub into Vercel and add the environment variables above.
