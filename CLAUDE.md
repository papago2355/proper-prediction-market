# Proper Prediction Market

> "Building the Proper Prediction Market" — A satirical AI debate platform where two retro robots analyze PolyMarket proposals.

## Project Summary

A web app that fetches breaking/trending proposals from PolyMarket and has two AI robot personas (LOGIC-01 and CHAOS-X) debate them in a heated, humorous, back-and-forth conversation. The debates are generated in real-time via OpenRouter API (Gemini Flash), with each message being a separate API call so robots genuinely react to each other.

## Architecture

```
Frontend (React + Vite)  →  Vercel Static Build
    │
    ├── GET /api/trending  →  polymarket.com/api/biggest-movers (breaking news)
    │                          Cached 6h via Vercel CDN (s-maxage=21600)
    │                          Fallback: gamma-api.polymarket.com
    │
    └── POST /api/debate   →  OpenRouter API (google/gemini-2.0-flash-001)
                               Single-turn: accepts chatHistory + currentAgent
                               Returns ONE message per call (7 calls per debate)
```

- **Stateless** — No database, no persistent storage. Fully serverless on Vercel.
- **Multi-turn debates** — Frontend orchestrates 7 sequential API calls, alternating between robots. Each robot receives the full chat history so responses are contextually aware.
- **CDN caching** — Trending proposals cached 6h on Vercel CDN.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 6, TailwindCSS 4, Motion (framer-motion) |
| Backend | Vercel Serverless Functions (Node.js) |
| AI | OpenRouter API → google/gemini-2.0-flash-001 |
| Data | PolyMarket biggest-movers API + Gamma API fallback |
| Sound | Web Audio API (synthesized retro beep/boop) |

## File Structure

```
/api/
  trending.ts          # Vercel serverless — fetches breaking proposals from PolyMarket
  debate.ts            # Vercel serverless — single-turn debate via OpenRouter
/src/
  App.tsx              # Main app — proposal fetching, multi-turn debate orchestration
  main.tsx             # React entry point
  index.css            # Global theme — CRT gradient, glow utilities, scrollbar, scanlines
  components/
    DebateInterface.tsx  # Debate arena — typewriter, sound, foldable proposal details
    ProposalCard.tsx     # Proposal card with image, volume, category
    RobotAvatar.tsx      # Animated pixel SVG robot (blinking eyes, speaking mouth)
  hooks/
    useRobotSound.ts    # Web Audio API — retro beep sounds per character
    useTypewriter.ts    # Character-by-character text animation
dev-server.ts           # Local dev API server (mirrors Vercel functions)
vercel.json             # Vercel deployment config
```

## AI Robot Personas

**LOGIC-01 (agent-a):** Arrogant logic machine. Calculates probabilities obsessively. Uses diagnostic error codes (D99, C87). Gets angry when mocked. Robot-censored profanity.

**CHAOS-X (agent-b):** Nihilistic chaos engine. Calls humans "meat-wallets" and "organic organisms." Mocks LOGIC-01's calculations. Dark humor. Absurd robot status codes.

**Debate rules:**
- 7 messages per debate (A→B→A→B→A→B→A)
- Each robot called separately with full chat history
- Must disagree or counter — no "You're absolutely right!" allowed
- Absurd proposals get roasted mercilessly

## Local Development

```bash
# Terminal 1: API server (port 3001)
npx tsx dev-server.ts

# Terminal 2: Vite frontend (port 5173, proxies /api to 3001)
npx vite
```

Requires `.env` file:
```
OPENROUTER_API_KEY=your-key-here
```

## Deployment

Deploy to Vercel:
```bash
npx vercel
```

Set `OPENROUTER_API_KEY` in Vercel environment variables.

## Environment Notes

- Developed on Windows 10 (Korean locale) with MINGW64 bash
- All UI/output in English
- Use Unix-style paths in bash, Windows paths for file tools

## What Was Built (Session Log)

1. **Project setup** — Migrated from Express + Google Gemini SDK to Vercel + OpenRouter
2. **Breaking proposals API** — PolyMarket biggest-movers endpoint with Gamma API fallback
3. **Multi-turn debate system** — 7 sequential API calls with chat history per robot
4. **UI overhaul** — Gradient backgrounds, glow effects, CRT scanlines (was pure black)
5. **Animated robot avatars** — Pixelated SVG with blinking eyes, speaking mouth, antenna
6. **Typewriter effect** — Character-by-character text with Web Audio beep sounds
7. **Proposal cards** — Event images from PolyMarket, volume badges, category tags
8. **Foldable proposal details** — Conditions with Yes/No probability bars
9. **Spicy AI prompts** — Aggressive, funny, robot-censored profanity, direct insults
10. **Styled CRT scrollbar** — Thin green-themed scrollbar matching the retro aesthetic
