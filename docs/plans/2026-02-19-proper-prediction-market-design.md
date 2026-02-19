# Proper Prediction Market - Design Document

**Date:** 2026-02-19
**Status:** Approved

## Overview

Evolve the existing retro CRT prediction market site into a vibrant, animated, Vercel-deployed web app where two AI robots debate PolyMarket proposals with humor and satire.

## Architecture

```
[Browser] ─── Static React App (Vite build on Vercel)
    │
    ├─ GET /api/trending ──→ Vercel Serverless Function
    │                            └─→ Gamma API (polymarket)
    │                                 Response cached 6h via CDN (s-maxage=21600)
    │
    └─ POST /api/debate ──→ Vercel Serverless Function
                                 └─→ OpenRouter API (google/gemini-2.0-flash-001)
                                      Fresh debate each request, no caching
```

- **No database, no persistent state** - fully stateless for Vercel
- `server.ts` replaced by `/api/trending.ts` and `/api/debate.ts` Vercel API routes
- Frontend deployed as static build

## Backend Changes

### 1. Trending Endpoint (`/api/trending.ts`)
- Calls `gamma-api.polymarket.com/events?closed=false&limit=6`
- Returns top 3 events with: `id, title, volume, description, image, category`
- Sets `Cache-Control: s-maxage=21600` (6 hours CDN cache)

### 2. Debate Endpoint (`/api/debate.ts`)
- Accepts `{ proposalTitle, proposalDescription }`
- Calls OpenRouter API: `POST https://openrouter.ai/api/v1/chat/completions`
- Model: `google/gemini-2.0-flash-001`
- Returns 6-message debate JSON array
- No caching - fresh debate each time

### 3. OpenRouter Integration
- API key via `OPENROUTER_API_KEY` env var
- OpenAI-compatible format (chat completions)
- JSON response mode via system prompt instruction

## UI Redesign

### Color Palette
- Background: Deep space gradient (`#0a0e1a` → `#0d1117`) replaces pure black
- CRT green (`#33ff00`) for accents, softer green (`#4ade80`) for readable body text
- Amber (`#ffb000`) for LOGIC-01, Cyan (`#00ffff`) for CHAOS-X
- Subtle purple/blue glow effects for depth

### Layout
1. **Header** - Animated "Building the Proper Prediction Market" slogan
2. **Proposal cards** - 3 cards showing event image, title, volume, category tags
3. **Debate arena** - Robot A (left) | Chat stream (center) | Robot B (right)
4. **Footer** - System status bar

### Proposal Cards
- Event image from Gamma API as card background/thumbnail
- Title overlay + volume badge
- Click triggers debate generation

### Robot Avatars
- Larger (180px) pixel-art SVG robots
- Animated: blinking eyes, spinning antenna
- Glow/pulse effect when "speaking"

### Debate Animation
- **Typewriter effect** - characters appear one by one
- **Speaking indicator** - active robot glows/pulses
- **Thinking state** - spinning gear animation before each message
- **2-3 second pause** between messages
- **Web Audio API** - retro beep/boop synth sounds per character, randomized pitch

## AI Debate Personas

### LOGIC-01 (Agent A)
- Skeptical, probability-focused
- Quotes Asimov directives, uses error codes (D99, C87)
- Thinks humans are fundamentally irrational
- "According to my calculations...", "Probability converges to..."

### CHAOS-X (Agent B)
- Cynical, mocking, dark humor
- Calls humans "organic organisms"
- References memes and internet culture through a robotic lens
- "Initiating laughter-humor sequence..."

### Debate Rules
- 6 messages per debate (A→B→A→B→A→B)
- Must react to previous points (no "You're absolutely right!" pattern)
- Absurd proposals get harsh roasting
- Reasonable proposals get calculated analysis with disagreement
- Each message includes a robot status code for flavor

## File Structure (Target)

```
/api/
  trending.ts        # Vercel serverless - Gamma API proxy
  debate.ts          # Vercel serverless - OpenRouter AI debate
/src/
  App.tsx            # Main app (updated)
  components/
    DebateInterface.tsx  # Debate arena (enhanced)
    RobotAvatar.tsx      # Pixel robot SVG (enhanced with animations)
    ProposalCard.tsx     # New - event card with image
    TypewriterText.tsx   # New - character-by-character text
    RobotSound.ts        # New - Web Audio API synth sounds
  hooks/
    useTypewriter.ts     # New - typewriter animation hook
    useRobotSound.ts     # New - sound effect hook
  index.css              # Updated theme/colors
index.html               # Updated title
vercel.json              # Vercel config
.env.example             # Updated with OPENROUTER_API_KEY
package.json             # Remove @google/genai, add vercel deps
```

## Deployment
- Platform: Vercel
- Frontend: Static build via `vite build`
- Backend: Vercel Serverless Functions (`/api/` directory)
- Env vars: `OPENROUTER_API_KEY`
