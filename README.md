# Proper Prediction Market

A satirical AI debate platform where two retro robots analyze PolyMarket proposals. Pre-generated debates with typewriter animation, bilingual EN/KR support, and a CRT retro aesthetic.

## Live

**https://proper-prediction-market.vercel.app**

## How It Works

```
GitHub Actions Cron (every 6h)
  -> scripts/generate.ts
    -> Fetch top 3 PolyMarket biggest-movers
    -> Triage each: "debate" or "roast" mode
    -> Generate 7-turn debate via OpenRouter (Gemini Flash)
    -> Translate to Korean
    -> Save to public/data/debates.json
    -> Git commit + push
  -> Vercel auto-deploys
  -> Frontend loads static JSON
```

No real-time API calls. No database. Pure static site with pre-generated content.

## AI Robot Personas

**LOGIC-01** — Arrogant logic machine. Calculates probabilities obsessively. Diagnostic error codes. Robot-censored profanity.

**CHAOS-X** — Nihilistic chaos engine. Calls humans "meat-wallets". Mocks LOGIC-01's calculations. Absurd robot status codes.

**Two modes:**
- **Debate** — Robots argue opposing sides of a legitimate proposal
- **Roast** — Robots unite to trash absurd proposals (but still bicker with each other)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 6, TailwindCSS 4, Motion |
| AI | OpenRouter API (google/gemini-2.0-flash-001) |
| Data | PolyMarket biggest-movers API |
| Deploy | Vercel (static), GitHub Actions (cron) |

## Local Development

```bash
# Generate debates (requires OPENROUTER_API_KEY in .env)
npm run generate

# Run frontend
npm run dev
```

## Project Structure

```
scripts/generate.ts        # Debate generation + translation script
public/data/debates.json   # Pre-generated debate data (auto-updated)
src/
  App.tsx                  # Main app, static JSON loading, language toggle
  components/
    DebateInterface.tsx    # Debate arena, typewriter, mode badge
    ProposalCard.tsx       # Proposal card with image and volume
    RobotAvatar.tsx        # Animated pixel SVG robot
  hooks/
    useRobotSound.ts       # Web Audio retro beep sounds
    useTypewriter.ts       # Character-by-character animation
.github/workflows/
  generate.yml             # 6h cron to regenerate debates
```
