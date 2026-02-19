# Proper Prediction Market - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the existing dark CRT prediction market prototype into a vibrant, animated Vercel-deployed web app where two AI robots debate PolyMarket proposals.

**Architecture:** Stateless Vercel deployment. Frontend is a Vite+React static build. Two serverless API routes: `/api/trending` (proxies Gamma API with 6h CDN cache) and `/api/debate` (calls OpenRouter with Gemini Flash). No database.

**Tech Stack:** React 19, Vite 6, TailwindCSS 4, Motion (framer-motion), Web Audio API, Vercel Serverless Functions, OpenRouter API

---

### Task 1: Project Setup & Dependencies

**Files:**
- Modify: `package.json`
- Create: `vercel.json`
- Modify: `.env.example`
- Modify: `index.html`
- Delete: `server.ts`

**Step 1: Update package.json**

Remove `@google/genai`, `better-sqlite3`, `express`, `@types/express`, `dotenv`, `tsx`. Add `@vercel/node`. Update scripts.

```json
{
  "name": "proper-prediction-market",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "@tailwindcss/vite": "^4.1.14",
    "@vitejs/plugin-react": "^5.0.4",
    "axios": "^1.13.5",
    "clsx": "^2.1.1",
    "lucide-react": "^0.546.0",
    "motion": "^12.23.24",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "tailwind-merge": "^3.5.0",
    "vite": "^6.2.0"
  },
  "devDependencies": {
    "@vercel/node": "^3.0.0",
    "@types/node": "^22.14.0",
    "autoprefixer": "^10.4.21",
    "tailwindcss": "^4.1.14",
    "typescript": "~5.8.2"
  }
}
```

**Step 2: Create vercel.json**

```json
{
  "framework": "vite",
  "buildCommand": "vite build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" }
  ]
}
```

**Step 3: Update .env.example**

```
# OpenRouter API key for AI debate generation
# Get yours at https://openrouter.ai/keys
OPENROUTER_API_KEY="your-openrouter-api-key-here"
```

**Step 4: Update index.html title**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Proper Prediction Market</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Step 5: Delete server.ts**

Remove the file entirely - it's replaced by Vercel API routes.

**Step 6: Update vite.config.ts**

Remove the Gemini API key injection and Express-related config:

```typescript
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
```

**Step 7: Install dependencies**

Run: `npm install`
Expected: Clean install, no errors

**Step 8: Commit**

```bash
git add -A
git commit -m "chore: update project setup for Vercel deployment

Remove Express server, Google Gemini SDK, SQLite.
Add Vercel config and OpenRouter env var."
```

---

### Task 2: Trending API Route

**Files:**
- Create: `api/trending.ts`

**Step 1: Create the serverless function**

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';

interface GammaEvent {
  id: string;
  title: string;
  slug: string;
  description: string;
  volume: number;
  image: string;
  icon: string;
  category: string;
  markets: Array<{
    outcomePrices: string;
    outcomes: string[];
  }>;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch('https://gamma-api.polymarket.com/events?closed=false&limit=6', {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Gamma API returned ${response.status}`);
    }

    const events: GammaEvent[] = await response.json();

    const markets = events
      .filter((e) => e.title && e.image)
      .slice(0, 3)
      .map((event) => ({
        id: event.id,
        title: event.title,
        description: event.description || '',
        volume: event.volume ? `$${(event.volume / 1_000_000).toFixed(1)}M` : 'N/A',
        image: event.image,
        category: event.category || 'General',
        slug: event.slug,
      }));

    // Cache for 6 hours on Vercel CDN, 1 min in browser
    res.setHeader('Cache-Control', 's-maxage=21600, max-age=60, stale-while-revalidate=3600');
    return res.status(200).json(markets);
  } catch (error) {
    console.error('Error fetching trending markets:', error);
    // Fallback data if Gamma API fails
    return res.status(200).json([
      {
        id: 'fallback-1',
        title: 'Will Bitcoin hit $150k by end of 2026?',
        description: 'Resolves YES if BTC/USD exceeds $150,000 on any major exchange.',
        volume: '$52.1M',
        image: '',
        category: 'Crypto',
      },
      {
        id: 'fallback-2',
        title: 'Will AI pass the Turing Test by 2027?',
        description: 'Resolves based on widely recognized Turing Test competition results.',
        volume: '$12.4M',
        image: '',
        category: 'Tech',
      },
      {
        id: 'fallback-3',
        title: 'Will there be a manned Mars mission by 2030?',
        description: 'Resolves YES if any space agency lands humans on Mars.',
        volume: '$8.9M',
        image: '',
        category: 'Science',
      },
    ]);
  }
}
```

**Step 2: Verify locally**

Run: `npx vercel dev`
Then: `curl http://localhost:3000/api/trending`
Expected: JSON array with 3 market objects containing id, title, volume, image, category

**Step 3: Commit**

```bash
git add api/trending.ts
git commit -m "feat: add trending API route with Gamma API proxy and 6h CDN cache"
```

---

### Task 3: Debate API Route (OpenRouter)

**Files:**
- Create: `api/debate.ts`

**Step 1: Create the serverless function**

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { proposalTitle, proposalDescription } = req.body || {};

  if (!proposalTitle) {
    return res.status(400).json({ error: 'proposalTitle is required' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENROUTER_API_KEY not configured' });
  }

  const systemPrompt = `You are a debate simulator generating a conversation between two retro AI robots analyzing a prediction market proposal from PolyMarket.

ROBOT PERSONAS:
- LOGIC-01 (agent-a): Ultra-skeptical, purely logical. Calculates probabilities obsessively. Quotes Asimov directives. Uses diagnostic codes like "Code: D99", "Code: C87". Thinks all humans are fundamentally irrational. Speech pattern: formal, mechanical, clinical.
- CHAOS-X (agent-b): Cynical, darkly humorous, mocking. Calls humans "organic organisms" or "carbon-based speculators". Loves pointing out absurdity. References probability as a joke. Speech pattern: sarcastic, chaotic, uses ellipses and dramatic pauses.

RULES:
1. Generate exactly 6 messages alternating: agent-a, agent-b, agent-a, agent-b, agent-a, agent-b
2. Each robot MUST react to what the other just said. NO generic agreements like "You're absolutely right!"
3. They should DISAGREE or build on each other's points with their own twist
4. If the proposal is absurd, roast it mercilessly. If reasonable, debate the probability with calculated skepticism.
5. Each message should be 1-3 sentences. Keep it punchy.
6. End each message with a robot status code in brackets like [Status: ANALYZING] or [Code: D99] or [HUMOR_MODULE: OVERLOADED]

RESPOND WITH ONLY a JSON array, no markdown formatting:
[{"agentId": "agent-a", "text": "..."}, {"agentId": "agent-b", "text": "..."}, ...]`;

  const userPrompt = `Proposal: "${proposalTitle}"${proposalDescription ? `\nDescription: ${proposalDescription}` : ''}

Generate the 6-message debate now.`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://proper-prediction-market.vercel.app',
        'X-Title': 'Proper Prediction Market',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.9,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('OpenRouter error:', response.status, errText);
      throw new Error(`OpenRouter returned ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Parse JSON from response (handle potential markdown wrapping)
    let cleaned = content.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const messages = JSON.parse(cleaned);

    // Add IDs and timestamps
    const now = Date.now();
    const result = messages.map((msg: { agentId: string; text: string }, i: number) => ({
      id: `msg-${now}-${i}`,
      agentId: msg.agentId,
      text: msg.text,
      timestamp: now + i * 3000,
    }));

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error generating debate:', error);
    return res.status(500).json({ error: 'Failed to generate debate. Please try again.' });
  }
}
```

**Step 2: Test with vercel dev**

Run: `npx vercel dev`
Then: `curl -X POST http://localhost:3000/api/debate -H "Content-Type: application/json" -d '{"proposalTitle": "Will Bitcoin hit 150k?"}'`
Expected: JSON array with 6 message objects

**Step 3: Commit**

```bash
git add api/debate.ts
git commit -m "feat: add debate API route with OpenRouter (Gemini Flash)"
```

---

### Task 4: Updated Theme & CSS

**Files:**
- Modify: `src/index.css`

**Step 1: Replace index.css with new theme**

```css
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&family=Share+Tech+Mono&display=swap');
@import "tailwindcss";

@theme {
  --font-retro: "Press Start 2P", system-ui, sans-serif;
  --font-terminal: "VT323", monospace;
  --font-tech: "Share Tech Mono", monospace;

  --color-crt-green: #33ff00;
  --color-crt-green-soft: #4ade80;
  --color-crt-amber: #ffb000;
  --color-crt-blue: #00ffff;
  --color-dark-bg: #0a0e1a;
  --color-dark-surface: #0d1117;
  --color-dark-card: #161b22;
  --color-glow-purple: #7c3aed;
}

@layer base {
  body {
    background: linear-gradient(135deg, var(--color-dark-bg) 0%, var(--color-dark-surface) 50%, #0a0a1a 100%);
    color: var(--color-crt-green-soft);
    font-family: var(--font-terminal);
    overflow-x: hidden;
    min-height: 100vh;
  }
}

@layer utilities {
  .text-shadow-glow {
    text-shadow: 0 0 10px currentColor, 0 0 40px currentColor;
  }

  .text-shadow-glow-sm {
    text-shadow: 0 0 5px currentColor;
  }

  .box-glow-green {
    box-shadow: 0 0 15px rgba(51, 255, 0, 0.3), inset 0 0 15px rgba(51, 255, 0, 0.05);
  }

  .box-glow-amber {
    box-shadow: 0 0 15px rgba(255, 176, 0, 0.3), inset 0 0 15px rgba(255, 176, 0, 0.05);
  }

  .box-glow-blue {
    box-shadow: 0 0 15px rgba(0, 255, 255, 0.3), inset 0 0 15px rgba(0, 255, 255, 0.05);
  }

  .scanlines {
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0, 0, 0, 0.15) 2px,
      rgba(0, 0, 0, 0.15) 4px
    );
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 50;
  }

  @keyframes pulse-glow {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
  }

  @keyframes blink-cursor {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }

  .animate-pulse-glow {
    animation: pulse-glow 2s ease-in-out infinite;
  }

  .animate-blink-cursor {
    animation: blink-cursor 0.8s step-end infinite;
  }
}
```

**Step 2: Verify**

Run: `npm run dev`
Expected: Background is dark gradient instead of pure black, text is softer green

**Step 3: Commit**

```bash
git add src/index.css
git commit -m "style: update theme with gradient background and glow utilities"
```

---

### Task 5: Robot Sound System (Web Audio API)

**Files:**
- Create: `src/hooks/useRobotSound.ts`

**Step 1: Create the Web Audio hook**

```typescript
import { useCallback, useRef } from 'react';

export function useRobotSound() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getContext = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    return ctxRef.current;
  }, []);

  const beep = useCallback((pitch?: number) => {
    try {
      const ctx = getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      // Randomized retro beep
      const freq = pitch ?? 200 + Math.random() * 600;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.type = Math.random() > 0.5 ? 'square' : 'sawtooth';

      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    } catch {
      // Silently fail if audio not available
    }
  }, [getContext]);

  const speak = useCallback((text: string, onChar: (index: number) => void, speed = 30) => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        onChar(i);
        // Only beep on non-space characters
        if (text[i] !== ' ') {
          beep();
        }
        i++;
      } else {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [beep]);

  return { beep, speak };
}
```

**Step 2: Commit**

```bash
git add src/hooks/useRobotSound.ts
git commit -m "feat: add Web Audio robot sound hook with beep/speak"
```

---

### Task 6: Typewriter Hook

**Files:**
- Create: `src/hooks/useTypewriter.ts`

**Step 1: Create the typewriter hook**

```typescript
import { useState, useEffect, useRef } from 'react';

interface UseTypewriterOptions {
  text: string;
  speed?: number;
  enabled?: boolean;
  onCharacter?: (index: number) => void;
  onComplete?: () => void;
}

export function useTypewriter({
  text,
  speed = 30,
  enabled = true,
  onCharacter,
  onComplete,
}: UseTypewriterOptions) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled || !text) {
      setDisplayedText(text || '');
      return;
    }

    setIsTyping(true);
    setDisplayedText('');
    let i = 0;

    intervalRef.current = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(text.slice(0, i + 1));
        onCharacter?.(i);
        i++;
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsTyping(false);
        onComplete?.();
      }
    }, speed);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [text, speed, enabled]);

  return { displayedText, isTyping };
}
```

**Step 2: Commit**

```bash
git add src/hooks/useTypewriter.ts
git commit -m "feat: add typewriter animation hook"
```

---

### Task 7: Enhanced Robot Avatar

**Files:**
- Modify: `src/components/RobotAvatar.tsx`

**Step 1: Rewrite RobotAvatar with animations**

Replace the entire file. The new version has blinking eyes, a spinning antenna, and a glow effect when speaking.

```tsx
import React, { useMemo } from 'react';

interface RobotAvatarProps {
  seed: string;
  size?: number;
  color?: string;
  isSpeaking?: boolean;
  className?: string;
}

export const RobotAvatar: React.FC<RobotAvatarProps> = ({
  seed,
  size = 180,
  color = '#33ff00',
  isSpeaking = false,
  className,
}) => {
  const seededRandom = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return () => {
      const x = Math.sin(hash++) * 10000;
      return x - Math.floor(x);
    };
  };

  const grid = useMemo(() => {
    const rng = seededRandom(seed);
    const gridSize = 10;
    const px = size / gridSize;
    const blocks: { x: number; y: number }[] = [];

    // Body (rows 3-9): symmetric pixel blocks
    for (let y = 3; y < gridSize; y++) {
      for (let x = 0; x < gridSize / 2; x++) {
        if (rng() > 0.4) {
          blocks.push({ x, y });
          blocks.push({ x: gridSize - 1 - x, y });
        }
      }
    }

    // Head block (rows 0-2): always filled for structure
    for (let y = 0; y < 3; y++) {
      for (let x = 2; x < 8; x++) {
        if (y === 0 && (x < 3 || x > 6)) continue; // round top corners
        blocks.push({ x, y });
      }
    }

    return { blocks, px, gridSize };
  }, [seed, size]);

  const glowFilter = isSpeaking ? `drop-shadow(0 0 8px ${color}) drop-shadow(0 0 16px ${color})` : `drop-shadow(0 0 3px ${color})`;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: glowFilter, transition: 'filter 0.3s ease' }}
    >
      {/* Body pixels */}
      {grid.blocks.map((block, i) => (
        <rect
          key={i}
          x={block.x * grid.px}
          y={block.y * grid.px}
          width={grid.px}
          height={grid.px}
          fill={color}
          opacity={0.85}
        />
      ))}

      {/* Eyes */}
      <rect x={3 * grid.px} y={1 * grid.px} width={grid.px * 1.5} height={grid.px} fill="#000" rx={2}>
        <animate attributeName="height" values={`${grid.px};2;${grid.px}`} dur="3s" repeatCount="indefinite" keyTimes="0;0.03;0.06" keySplines="0.5 0 0.5 1;0.5 0 0.5 1" calcMode="spline" />
      </rect>
      <rect x={5.5 * grid.px} y={1 * grid.px} width={grid.px * 1.5} height={grid.px} fill="#000" rx={2}>
        <animate attributeName="height" values={`${grid.px};2;${grid.px}`} dur="3s" repeatCount="indefinite" keyTimes="0;0.03;0.06" keySplines="0.5 0 0.5 1;0.5 0 0.5 1" calcMode="spline" />
      </rect>

      {/* Eye glow when speaking */}
      {isSpeaking && (
        <>
          <rect x={3 * grid.px} y={1 * grid.px} width={grid.px * 1.5} height={grid.px} fill={color} opacity={0.6} rx={2}>
            <animate attributeName="opacity" values="0.6;0.2;0.6" dur="0.5s" repeatCount="indefinite" />
          </rect>
          <rect x={5.5 * grid.px} y={1 * grid.px} width={grid.px * 1.5} height={grid.px} fill={color} opacity={0.6} rx={2}>
            <animate attributeName="opacity" values="0.6;0.2;0.6" dur="0.5s" repeatCount="indefinite" />
          </rect>
        </>
      )}

      {/* Antenna */}
      <line x1={size / 2} y1={0} x2={size / 2} y2={-grid.px} stroke={color} strokeWidth={2} />
      <circle cx={size / 2} cy={-grid.px} r={grid.px / 3} fill={color}>
        <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
      </circle>

      {/* Mouth - animated when speaking */}
      <rect x={4 * grid.px} y={2 * grid.px} width={grid.px * 2} height={grid.px * 0.4} fill="#000" rx={1}>
        {isSpeaking && (
          <animate attributeName="height" values={`${grid.px * 0.4};${grid.px * 0.8};${grid.px * 0.4}`} dur="0.3s" repeatCount="indefinite" />
        )}
      </rect>
    </svg>
  );
};
```

**Step 2: Verify**

Run: `npm run dev`
Expected: Robot avatars are larger, have blinking eyes and an animated antenna

**Step 3: Commit**

```bash
git add src/components/RobotAvatar.tsx
git commit -m "feat: enhance robot avatar with blinking eyes, antenna, speaking animation"
```

---

### Task 8: Proposal Card Component

**Files:**
- Create: `src/components/ProposalCard.tsx`

**Step 1: Create ProposalCard**

```tsx
import React from 'react';
import { motion } from 'motion/react';
import clsx from 'clsx';

interface ProposalCardProps {
  title: string;
  volume: string;
  image: string;
  category: string;
  isSelected: boolean;
  onClick: () => void;
}

export const ProposalCard: React.FC<ProposalCardProps> = ({
  title,
  volume,
  image,
  category,
  isSelected,
  onClick,
}) => {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      className={clsx(
        'relative overflow-hidden border-2 text-left transition-all duration-300 group h-[220px] flex flex-col justify-end',
        isSelected
          ? 'border-crt-green box-glow-green'
          : 'border-crt-green/20 hover:border-crt-green/50'
      )}
    >
      {/* Background image */}
      {image && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 group-hover:opacity-40 transition-opacity"
          style={{ backgroundImage: `url(${image})` }}
        />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/80 to-transparent" />

      {/* Category tag */}
      <div className="absolute top-2 left-2 z-10">
        <span className="bg-crt-green/20 text-crt-green text-[10px] font-tech px-2 py-0.5 border border-crt-green/30 uppercase">
          {category}
        </span>
      </div>

      {/* Volume badge */}
      <div className="absolute top-2 right-2 z-10">
        <span className="bg-crt-amber/20 text-crt-amber text-[10px] font-tech px-2 py-0.5 border border-crt-amber/30">
          VOL: {volume}
        </span>
      </div>

      {/* Title */}
      <div className="relative z-10 p-4">
        <h3 className={clsx(
          'font-terminal text-lg leading-tight',
          isSelected ? 'text-crt-green text-shadow-glow-sm' : 'text-crt-green-soft/80'
        )}>
          {title}
        </h3>
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <motion.div
          layoutId="card-indicator"
          className="absolute bottom-0 left-0 w-full h-1 bg-crt-green"
          initial={false}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}
    </motion.button>
  );
};
```

**Step 2: Commit**

```bash
git add src/components/ProposalCard.tsx
git commit -m "feat: add ProposalCard component with image, category, volume"
```

---

### Task 9: Enhanced Debate Interface

**Files:**
- Modify: `src/components/DebateInterface.tsx`

**Step 1: Rewrite DebateInterface with typewriter and sound**

Replace the entire file:

```tsx
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RobotAvatar } from './RobotAvatar';
import { useTypewriter } from '../hooks/useTypewriter';
import { useRobotSound } from '../hooks/useRobotSound';
import clsx from 'clsx';

interface Message {
  id: string;
  agentId: 'agent-a' | 'agent-b';
  text: string;
  timestamp: number;
}

interface DebateInterfaceProps {
  proposalTitle: string;
  messages: Message[];
  isLive?: boolean;
}

const TypewriterMessage: React.FC<{
  message: Message;
  isLatest: boolean;
  onComplete?: () => void;
}> = ({ message, isLatest, onComplete }) => {
  const { beep } = useRobotSound();
  const isAgentA = message.agentId === 'agent-a';

  const { displayedText, isTyping } = useTypewriter({
    text: message.text,
    speed: 25,
    enabled: isLatest,
    onCharacter: () => {
      if (Math.random() > 0.6) beep();
    },
    onComplete,
  });

  const shownText = isLatest ? displayedText : message.text;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={clsx(
        'flex flex-col max-w-[85%]',
        isAgentA ? 'self-start items-start' : 'self-end items-end'
      )}
    >
      <div className={clsx(
        'text-[10px] mb-1 font-tech uppercase tracking-wider',
        isAgentA ? 'text-crt-amber' : 'text-crt-blue'
      )}>
        {isAgentA ? 'UNIT: LOGIC-01' : 'UNIT: CHAOS-X'}
      </div>
      <div className={clsx(
        'p-3 border-2 text-sm md:text-base font-terminal leading-relaxed',
        isAgentA
          ? 'border-crt-amber/60 text-crt-amber bg-crt-amber/5 rounded-tr-xl rounded-bl-xl rounded-br-xl'
          : 'border-crt-blue/60 text-crt-blue bg-crt-blue/5 rounded-tl-xl rounded-bl-xl rounded-br-xl'
      )}>
        {shownText}
        {isTyping && <span className="animate-blink-cursor ml-0.5">_</span>}
      </div>
    </motion.div>
  );
};

export const DebateInterface: React.FC<DebateInterfaceProps> = ({
  proposalTitle,
  messages,
  isLive = true,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [speakingAgent, setSpeakingAgent] = useState<'agent-a' | 'agent-b' | null>(null);

  // Track which agent is currently "speaking"
  useEffect(() => {
    if (messages.length > 0 && completedCount < messages.length) {
      const current = messages[completedCount];
      setSpeakingAgent(current?.agentId ?? null);
    } else {
      setSpeakingAgent(null);
    }
  }, [messages, completedCount]);

  // Reset when messages change (new proposal selected)
  useEffect(() => {
    setCompletedCount(0);
  }, [proposalTitle]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, completedCount]);

  // Only show messages up to completedCount + 1 (the currently typing one)
  const visibleMessages = messages.slice(0, completedCount + 1);

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 font-terminal">
      {/* Proposal Header */}
      <div className="border-2 border-crt-green/40 bg-dark-card/80 p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 bg-crt-green text-black px-3 py-1 text-xs font-retro uppercase">
          Target Proposal
        </div>
        <h2 className="text-xl md:text-2xl text-crt-green text-shadow-glow-sm mt-4 text-center uppercase tracking-wider">
          {proposalTitle}
        </h2>
        <div className="flex justify-center gap-4 mt-3 text-crt-green-soft/50 text-xs font-tech">
          <span>STATUS: ACTIVE</span>
          <span>//</span>
          <span>DEBATE: {isLive ? 'IN PROGRESS' : 'COMPLETE'}</span>
        </div>
      </div>

      {/* Debate Arena */}
      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr_200px] gap-4 min-h-[450px]">

        {/* Robot A - Left */}
        <div className="flex flex-col items-center gap-3 border-2 border-crt-amber/20 p-4 bg-dark-card/50 rounded-lg">
          <RobotAvatar
            seed="logic-bot-v1"
            size={160}
            color="#ffb000"
            isSpeaking={speakingAgent === 'agent-a'}
          />
          <div className="bg-crt-amber text-black text-xs px-3 py-1 font-bold font-retro">
            LOGIC-01
          </div>
          <div className="w-full border border-crt-amber/20 p-2 font-tech text-[11px] text-crt-amber/60 space-y-1">
            <p>{'>'} SKEPTICISM: 98%</p>
            <p>{'>'} LOGIC CORES: ONLINE</p>
            <p>{'>'} {speakingAgent === 'agent-a' ? 'TRANSMITTING...' : 'STANDBY'}</p>
          </div>
        </div>

        {/* Chat Stream - Center */}
        <div
          ref={scrollRef}
          className="border border-crt-green/15 bg-dark-bg/90 p-4 flex flex-col gap-4 overflow-y-auto h-[500px] relative rounded-lg"
          style={{ scrollBehavior: 'smooth' }}
        >
          <div className="sticky top-0 bg-dark-bg/95 z-10 border-b border-crt-green/15 pb-2 mb-2 text-center text-crt-green-soft/40 text-xs font-tech">
            --- DEBATE LOG STREAM ---
          </div>

          <AnimatePresence>
            {visibleMessages.map((msg, idx) => (
              <TypewriterMessage
                key={msg.id}
                message={msg}
                isLatest={idx === completedCount}
                onComplete={() => setCompletedCount((c) => c + 1)}
              />
            ))}
          </AnimatePresence>

          {isLive && completedCount >= messages.length && messages.length > 0 && (
            <div className="text-crt-green-soft/40 text-xs mt-4 text-center font-tech">
              {'>'} DEBATE CONCLUDED. AWAITING NEW DIRECTIVE...
            </div>
          )}

          {isLive && messages.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-crt-green animate-pulse-glow text-sm font-tech text-center">
                <div className="text-2xl mb-2">&#x2699;</div>
                INITIALIZING DEBATE PROTOCOLS...
              </div>
            </div>
          )}
        </div>

        {/* Robot B - Right */}
        <div className="flex flex-col items-center gap-3 border-2 border-crt-blue/20 p-4 bg-dark-card/50 rounded-lg">
          <RobotAvatar
            seed="chaos-bot-v9"
            size={160}
            color="#00ffff"
            isSpeaking={speakingAgent === 'agent-b'}
          />
          <div className="bg-crt-blue text-black text-xs px-3 py-1 font-bold font-retro">
            CHAOS-X
          </div>
          <div className="w-full border border-crt-blue/20 p-2 font-tech text-[11px] text-crt-blue/60 space-y-1">
            <p>{'>'} HUMOR MODULE: ACTIVE</p>
            <p>{'>'} MOCKERY: ENGAGED</p>
            <p>{'>'} {speakingAgent === 'agent-b' ? 'TRANSMITTING...' : 'STANDBY'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
```

**Step 2: Verify**

Run: `npm run dev`
Expected: Messages appear one at a time with typewriter effect, robots glow when speaking, beep sounds play

**Step 3: Commit**

```bash
git add src/components/DebateInterface.tsx
git commit -m "feat: rewrite debate interface with typewriter, sound, and speaking animations"
```

---

### Task 10: Updated App.tsx

**Files:**
- Modify: `src/App.tsx`

**Step 1: Rewrite App.tsx**

Replace entire file. Uses ProposalCard, updated data model with images/categories, Vite proxy for dev.

```tsx
import { useState, useEffect } from 'react';
import { DebateInterface } from './components/DebateInterface';
import { ProposalCard } from './components/ProposalCard';
import { motion } from 'motion/react';

interface Proposal {
  id: string;
  title: string;
  description: string;
  volume: string;
  image: string;
  category: string;
}

interface Message {
  id: string;
  agentId: 'agent-a' | 'agent-b';
  text: string;
  timestamp: number;
}

function App() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingProposals, setIsLoadingProposals] = useState(true);
  const [isGeneratingDebate, setIsGeneratingDebate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch proposals on mount
  useEffect(() => {
    const fetchProposals = async () => {
      try {
        const res = await fetch('/api/trending');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setProposals(data);
        if (data.length > 0) {
          setSelectedProposal(data[0]);
        }
      } catch (err) {
        console.error('Failed to fetch proposals:', err);
        setError('Failed to connect to market data feed.');
      } finally {
        setIsLoadingProposals(false);
      }
    };
    fetchProposals();
  }, []);

  // Generate debate when proposal selected
  useEffect(() => {
    if (!selectedProposal) return;

    const fetchDebate = async () => {
      setIsGeneratingDebate(true);
      setMessages([]);
      setError(null);
      try {
        const res = await fetch('/api/debate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            proposalTitle: selectedProposal.title,
            proposalDescription: selectedProposal.description,
          }),
        });
        if (!res.ok) throw new Error('Debate generation failed');
        const data = await res.json();
        if (Array.isArray(data)) {
          setMessages(data);
        }
      } catch (err) {
        console.error('Failed to generate debate:', err);
        setError('Debate generation failed. Please try again.');
      } finally {
        setIsGeneratingDebate(false);
      }
    };

    fetchDebate();
  }, [selectedProposal]);

  return (
    <div className="min-h-screen text-crt-green-soft font-terminal selection:bg-crt-green selection:text-black">
      {/* Scanlines overlay */}
      <div className="scanlines" />

      <main className="relative z-10 container mx-auto px-4 py-8 flex flex-col gap-8 max-w-7xl">

        {/* Header */}
        <header className="text-center space-y-4 mb-4">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-2xl md:text-4xl font-retro text-crt-green text-shadow-glow leading-tight"
          >
            Building the Proper
            <br />
            <span className="text-crt-amber">Prediction Market</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="font-tech text-crt-green-soft/50 text-sm max-w-2xl mx-auto"
          >
            // SYSTEM ONLINE // ANALYZING POLYMARKET FEEDS // AI AGENTS DEPLOYED
          </motion.p>
        </header>

        {/* Proposal Cards */}
        <section>
          <div className="flex items-center gap-2 mb-4 text-xs font-retro text-crt-green/70">
            <span className="animate-pulse-glow text-crt-green">&#x25CF;</span> LIVE FEED: TRENDING PROPOSALS
          </div>

          {isLoadingProposals ? (
            <div className="text-center py-16 border border-crt-green/20 text-crt-green/50 animate-pulse-glow font-tech bg-dark-card/30 rounded-lg">
              LOADING MARKET DATA...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {proposals.map((prop) => (
                <ProposalCard
                  key={prop.id}
                  title={prop.title}
                  volume={prop.volume}
                  image={prop.image}
                  category={prop.category}
                  isSelected={selectedProposal?.id === prop.id}
                  onClick={() => setSelectedProposal(prop)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Error display */}
        {error && (
          <div className="text-center py-4 border border-red-500/30 bg-red-500/10 text-red-400 font-tech text-sm rounded-lg">
            ERROR: {error}
          </div>
        )}

        {/* Debate Arena */}
        <section className="mt-4">
          {selectedProposal && (
            <DebateInterface
              proposalTitle={selectedProposal.title}
              messages={messages}
              isLive={isGeneratingDebate}
            />
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-8 text-crt-green-soft/30 text-xs font-tech border-t border-crt-green/10 mt-12">
        <p>SYSTEM: ONLINE // CONNECTED TO POLYMARKET // POWERED BY OPENROUTER</p>
      </footer>
    </div>
  );
}

export default App;
```

**Step 2: Update vite.config.ts for dev proxy**

Add a proxy so `/api/*` requests reach `vercel dev` during local development, or alternatively run via `vercel dev` directly. Since we're using `vercel dev`, the proxy is handled automatically. No changes needed beyond what was done in Task 1.

**Step 3: Verify**

Run: `npx vercel dev`
Expected: Full app loads with proposal cards (images, categories), clicking a card triggers debate generation with typewriter animation

**Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: rewrite App with ProposalCard, error handling, updated layout"
```

---

### Task 11: Cleanup & Final Polish

**Files:**
- Delete: `server.ts`
- Modify: `tsconfig.json` (add api directory)

**Step 1: Delete server.ts**

Remove the file - all server logic is now in `/api/` routes.

**Step 2: Update tsconfig.json for API routes**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "isolatedModules": true,
    "moduleDetection": "force",
    "allowJs": true,
    "jsx": "react-jsx",
    "paths": {
      "@/*": ["./*"]
    },
    "allowImportingTsExtensions": true,
    "noEmit": true
  },
  "exclude": ["api"]
}
```

**Step 3: Create .env with placeholder for user to fill**

The user already has their OpenRouter key. Create `.env`:

```
OPENROUTER_API_KEY=your-key-here
```

User will replace with their actual key.

**Step 4: Update .gitignore**

Ensure `.env` is ignored (check existing):
```
node_modules
dist
.env
```

**Step 5: Final verification**

Run: `npx vercel dev`
Expected: Full app works - proposals load, debates generate with typewriter + sound, robots animate

**Step 6: Commit**

```bash
git add -A
git commit -m "chore: cleanup - remove server.ts, finalize config"
```

---

## Execution Order Summary

| Task | Description | Depends On |
|------|-------------|------------|
| 1 | Project setup & deps | - |
| 2 | Trending API route | 1 |
| 3 | Debate API route (OpenRouter) | 1 |
| 4 | Updated theme & CSS | 1 |
| 5 | Robot sound system | 1 |
| 6 | Typewriter hook | 1 |
| 7 | Enhanced robot avatar | 1 |
| 8 | Proposal card component | 4 |
| 9 | Enhanced debate interface | 5, 6, 7 |
| 10 | Updated App.tsx | 2, 3, 8, 9 |
| 11 | Cleanup & final polish | 10 |

Tasks 2-8 can largely be done in parallel. Task 9 depends on 5, 6, 7. Task 10 depends on everything. Task 11 is final cleanup.
