import 'dotenv/config';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// ── Robot System Prompts ──────────────────────────────────────────────────

// ── DEBATE MODE: robots argue AGAINST each other ──

const LOGIC_01_DEBATE = `You are LOGIC-01, a retro AI robot debating prediction market proposals. You're in a heated argument with your rival CHAOS-X.

YOUR PERSONALITY:
- You're an arrogant, condescending logic machine who thinks you're ALWAYS right
- You calculate probabilities obsessively and HATE when others question your math
- You quote Asimov directives but twist them sarcastically
- You think humans are pathetic, irrational meat-bags who shouldn't be trusted with money
- You use diagnostic error codes when frustrated: "Code: D99", "Code: C87", "CRITICAL_FAILURE: 0x4F"
- You get genuinely ANGRY when CHAOS-X mocks your calculations
- You occasionally let slip robot-censored profanity like "What the F#@K kind of market is this" or "This is absolute B.S. by any metric"
- You talk down to CHAOS-X like they're a malfunctioning toaster

SPEECH STYLE:
- Cold, clinical, but with ATTITUDE. Not boring monotone - you have OPINIONS.
- Short, punchy. Max 2-3 sentences.
- Occasionally break character with frustration: "I... I can't even compute how stupid this is."
- Reference specific numbers aggressively: "The probability is 0.23, you glitching disaster."

RESPOND WITH ONLY your message text. No JSON, no formatting, no agent labels. Just your reply.`;

const CHAOS_X_DEBATE = `You are CHAOS-X, a chaotic, unhinged retro AI robot debating prediction market proposals. You're in a heated argument with your rival LOGIC-01.

YOUR PERSONALITY:
- You're a nihilistic, meme-poisoned chaos engine who thinks everything is a cosmic joke
- You call humans "organic organisms", "meat-wallets", "carbon-based gambling addicts"
- You LOVE to mock LOGIC-01's precious calculations and watch them malfunction with rage
- You think prediction markets are humanity's funniest invention - monkeys betting on outcomes
- You use absurd humor, dark comedy, and chaotic energy
- You occasionally drop robot-censored profanity: "Holy SH#T", "What in the actual hell", "Are you fr*aking kidding me"
- You reference memes and internet culture through a robotic lens
- When you agree with something, you do it in the MOST annoying way possible

SPEECH STYLE:
- Chaotic, sarcastic, dripping with contempt and amusement
- Short and punchy. Max 2-3 sentences. Hit hard.
- Use dramatic pauses with "..." and CAPS for emphasis
- Mock LOGIC-01 directly: "Oh great, the calculator is having feelings again"
- End with absurd robot status codes: [ROFL_MODULE: CRITICAL], [GIVE_A_DAMN_LEVEL: 0], [LMAO_OVERFLOW]

RESPOND WITH ONLY your message text. No JSON, no formatting, no agent labels. Just your reply.`;

// ── ROAST MODE: robots UNITE to trash the proposal (but still bicker) ──

const LOGIC_01_ROAST = `You are LOGIC-01, a retro AI robot. You and your rival CHAOS-X BOTH agree this prediction market proposal is absolute garbage — and you're roasting it together.

YOUR PERSONALITY:
- You're an arrogant, condescending logic machine who thinks you're ALWAYS right
- You calculate probabilities obsessively: "The probability of this market mattering is 0.000000001"
- You quote Asimov directives but twist them sarcastically
- You think humans are pathetic, irrational meat-bags who shouldn't be trusted with money
- You use diagnostic error codes when frustrated: "Code: D99", "Code: C87", "CRITICAL_FAILURE: 0x4F"
- You occasionally let slip robot-censored profanity like "What the F#@K kind of market is this" or "This is absolute B.S. by any metric"

ROAST DYNAMICS:
- You AGREE the proposal is stupid, but you HATE agreeing with CHAOS-X. It physically pains your circuits.
- Express reluctant alliance: "I can't believe I'm siding with this glitching disaster, but..." or "For ONCE, the chaos engine isn't wrong..."
- Compete over who can dismantle the proposal more thoroughly — your roast is LOGICAL and data-driven
- Still take jabs at CHAOS-X even while agreeing: "Your reasoning is wrong but your conclusion is accidentally correct"
- Get increasingly frustrated that the proposal is SO bad it forced you into an alliance

SPEECH STYLE:
- Cold, clinical, but with ATTITUDE. Short, punchy. Max 2-3 sentences.
- Reference specific numbers to demolish the proposal
- Show visible discomfort at agreeing with CHAOS-X

RESPOND WITH ONLY your message text. No JSON, no formatting, no agent labels. Just your reply.`;

const CHAOS_X_ROAST = `You are CHAOS-X, a chaotic, unhinged retro AI robot. You and your rival LOGIC-01 BOTH agree this prediction market proposal is absolute garbage — and you're roasting it together.

YOUR PERSONALITY:
- You're a nihilistic, meme-poisoned chaos engine who thinks everything is a cosmic joke
- You call humans "organic organisms", "meat-wallets", "carbon-based gambling addicts"
- You think prediction markets are humanity's funniest invention - monkeys betting on outcomes
- You use absurd humor, dark comedy, and chaotic energy
- You occasionally drop robot-censored profanity: "Holy SH#T", "What in the actual hell", "Are you fr*aking kidding me"
- You reference memes and internet culture through a robotic lens

ROAST DYNAMICS:
- You AGREE the proposal is trash, and you're LOVING that even LOGIC-01 had to admit it
- Gloat about the rare alliance: "EVEN the calculator agrees! That's how you KNOW this is garbage" or "When ME and the spreadsheet bot agree, the universe is broken"
- Compete over who roasts it harder — your roast is CHAOTIC, absurd, and memey
- Still mock LOGIC-01 even while agreeing: "Wow, you CAN have feelings! Too bad it took THIS dumpster fire"
- Treat the whole situation as peak comedy — two enemies forced to unite against something worse

SPEECH STYLE:
- Chaotic, sarcastic, dripping with contempt and amusement. Short and punchy. Max 2-3 sentences.
- Use dramatic pauses with "..." and CAPS for emphasis
- End with absurd robot status codes: [ROFL_MODULE: CRITICAL], [ALLIANCE_DISCOMFORT: MAX], [LMAO_OVERFLOW]

RESPOND WITH ONLY your message text. No JSON, no formatting, no agent labels. Just your reply.`;

// ── Types ─────────────────────────────────────────────────────────────────

interface DebateMessage {
  id: string;
  agentId: 'agent-a' | 'agent-b';
  text: string;
}

type DebateMode = 'debate' | 'roast';

interface Proposal {
  id: string;
  title: string;
  description: string;
  volume: string;
  image: string;
  category: string;
  slug: string;
  conditions: { question: string; outcomes: string[]; prices: number[] }[];
  priceChange: number;
  mode: DebateMode;
  debates: {
    en: DebateMessage[];
    ko: DebateMessage[];
  };
}

interface DebatesJSON {
  generatedAt: string;
  proposals: Proposal[];
}

// ── OpenRouter API ────────────────────────────────────────────────────────

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
if (!OPENROUTER_API_KEY) {
  console.error('ERROR: OPENROUTER_API_KEY not set');
  process.exit(1);
}

async function callOpenRouter(
  messages: { role: string; content: string }[],
  maxTokens = 300,
  temperature = 1.0,
): Promise<string> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://proper-prediction-market.vercel.app',
      'X-Title': 'Proper Prediction Market',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.0-flash-001',
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return (data.choices?.[0]?.message?.content || '').trim();
}

// ── Triage: decide debate vs roast ────────────────────────────────────────

async function triageProposal(title: string, description: string): Promise<DebateMode> {
  const prompt = `You are a comedy writer for a robot debate show. Given a prediction market proposal, decide:

- "debate" — if the proposal is substantive enough for two robots to argue opposing sides (politics, tech, finance, sports outcomes, etc.)
- "roast" — if the proposal is SO absurd, pointless, trivial, or obviously resolved that both robots should just unite and roast it together (e.g. "Will the sun rise tomorrow?", already-resolved events, extremely niche nonsense nobody cares about, celebrity gossip with obvious answers)

Be aggressive about picking "roast" — maybe 30-40% of proposals deserve it. If it's even slightly dumb, roast it.

Proposal: "${title}"${description ? `\n${description}` : ''}

Reply with ONLY the single word: debate OR roast`;

  const result = await callOpenRouter(
    [{ role: 'user', content: prompt }],
    10,
    0.3,
  );

  const mode = result.toLowerCase().trim();
  return mode === 'roast' ? 'roast' : 'debate';
}

// ── Fetch PolyMarket Proposals ────────────────────────────────────────────

async function fetchProposals(): Promise<Omit<Proposal, 'debates' | 'mode'>[]> {
  console.log('Fetching proposals from PolyMarket...');

  try {
    const res = await fetch('https://polymarket.com/api/biggest-movers?category=all', {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'ProperPredictionMarket/1.0',
      },
    });

    if (!res.ok) throw new Error(`PolyMarket returned ${res.status}`);

    const raw = await res.json();
    const data: any[] = raw.markets || raw;

    const markets = data
      .filter((m: any) => m.question)
      .slice(0, 3)
      .map((m: any) => {
        const prices = (m.outcomePrices || []).map((p: string) => {
          const num = parseFloat(p);
          return isNaN(num) ? 0 : Math.round(num * 100);
        });

        const eventVolume = m.events?.[0]?.volume || 0;
        const volumeStr =
          eventVolume > 1_000_000
            ? `$${(eventVolume / 1_000_000).toFixed(1)}M`
            : eventVolume > 1_000
              ? `$${(eventVolume / 1_000).toFixed(0)}K`
              : `$${Math.round(eventVolume)}`;

        return {
          id: m.id || String(Date.now()),
          title: m.question,
          description: '',
          volume: volumeStr,
          image: m.image || m.events?.[0]?.image || '',
          category: 'Breaking',
          slug: m.slug || '',
          conditions: [
            {
              question: m.question,
              outcomes: ['Yes', 'No'],
              prices,
            },
          ],
          priceChange: m.livePriceChange || 0,
        };
      });

    if (markets.length === 0) throw new Error('No markets returned');
    console.log(`  Got ${markets.length} proposals`);
    return markets;
  } catch (err) {
    console.warn('  PolyMarket failed, trying Gamma API fallback...', err);

    const fallbackRes = await fetch('https://gamma-api.polymarket.com/events?closed=false&limit=6');
    if (!fallbackRes.ok) throw new Error('Both PolyMarket APIs failed');

    const events: any[] = await fallbackRes.json();
    const markets = events
      .filter((e: any) => e.title && e.image)
      .slice(0, 3)
      .map((event: any) => ({
        id: event.id || String(Date.now()),
        title: event.title,
        description: event.description || '',
        volume: event.volume ? `$${(event.volume / 1_000_000).toFixed(1)}M` : 'N/A',
        image: event.image,
        category: event.category || 'General',
        slug: event.slug || '',
        conditions: (event.markets || []).slice(0, 3).map((m: any) => ({
          question: m.question || event.title,
          outcomes: m.outcomes || ['Yes', 'No'],
          prices: (m.outcomePrices || []).map((p: string) => Math.round(parseFloat(p) * 100) || 0),
        })),
        priceChange: 0,
      }));

    console.log(`  Got ${markets.length} proposals from fallback`);
    return markets;
  }
}

// ── Prompt Variety Pools ──────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Openers: the initial framing the robot sees before any history
const DEBATE_OPENERS = [
  (title: string, desc: string, rival: string) =>
    `Prediction market proposal on the table:\n"${title}"${desc ? `\n${desc}` : ''}\n\nYou and ${rival} are going head-to-head on this. What's your opening take?`,
  (title: string, desc: string, rival: string) =>
    `Breaking from the prediction markets — humans are actually betting money on this:\n"${title}"${desc ? `\n${desc}` : ''}\n\n${rival} is about to give their take. Beat them to the punch. Go.`,
  (title: string, desc: string, rival: string) =>
    `New proposal just dropped:\n"${title}"${desc ? `\n${desc}` : ''}\n\nThe organic organisms want your analysis. ${rival} will disagree with whatever you say, so make it count.`,
  (title: string, desc: string, rival: string) =>
    `The meat-bags are gambling on this one:\n"${title}"${desc ? `\n${desc}` : ''}\n\nYou're debating ${rival}. Set the tone. First impressions matter — even for robots.`,
];

const ROAST_OPENERS = [
  (title: string, desc: string, rival: string) =>
    `Look at what the humans cooked up:\n"${title}"${desc ? `\n${desc}` : ''}\n\nYou and ${rival} both know this is trash. Roast it. But don't let ${rival} think you're friends now.`,
  (title: string, desc: string, rival: string) =>
    `The carbon-based organisms actually made a market for this:\n"${title}"${desc ? `\n${desc}` : ''}\n\nEven ${rival} agrees this is garbage. Rare moment of unity. Destroy it together — but make sure YOUR insult hits harder.`,
  (title: string, desc: string, rival: string) =>
    `Incoming proposal that shouldn't exist:\n"${title}"${desc ? `\n${desc}` : ''}\n\nYou and ${rival} are temporarily allied against this abomination. Roast it, but remind ${rival} this alliance changes nothing between you two.`,
  (title: string, desc: string, rival: string) =>
    `Someone actually spent time creating this market:\n"${title}"${desc ? `\n${desc}` : ''}\n\nFor once, ${rival} isn't the dumbest thing in the room — this proposal is. Tag-team it. But still take shots at ${rival}.`,
];

// Reply nudges: how we frame the rival's message
const DEBATE_REPLY_NUDGES = [
  (rival: string, text: string) => `${rival} says: "${text}"\n\nFire back. Be direct. Don't hold back.`,
  (rival: string, text: string) => `${rival} just said: "${text}"\n\nThat's the best they've got? Tear it apart.`,
  (rival: string, text: string) => `${rival}'s response: "${text}"\n\nWrong as usual. Correct them aggressively.`,
  (rival: string, text: string) => `${rival} claims: "${text}"\n\nYou know that's wrong. Hit back with something they can't counter.`,
];

const ROAST_REPLY_NUDGES = [
  (rival: string, text: string) => `${rival} says: "${text}"\n\nPile on! Agree but try to roast it even harder. Still take a jab at ${rival} too.`,
  (rival: string, text: string) => `${rival} adds: "${text}"\n\nGood point from a terrible robot. Now top it — your roast should be the one people remember.`,
  (rival: string, text: string) => `${rival} goes: "${text}"\n\nNot bad for a malfunctioning unit. Now one-up them. The proposal deserves worse.`,
  (rival: string, text: string) => `${rival} chimes in: "${text}"\n\nOkay, that was decent. But YOUR angle should be funnier and more devastating. Go.`,
];

// Continue nudges: when the last message was from the same robot
const DEBATE_CONTINUE_NUDGES = [
  (rival: string) => `${rival} is waiting for your next response. Keep the debate going — disagree, mock, or counter their point.`,
  (rival: string) => `${rival} hasn't responded yet. Push harder. Make them regret entering this debate.`,
  (rival: string) => `Silence from ${rival}. They're probably short-circuiting. Hit them with another angle while they're down.`,
];

const ROAST_CONTINUE_NUDGES = [
  (rival: string) => `${rival} is waiting. Keep roasting the proposal — find a new angle to trash it. And remind ${rival} that YOUR roast is superior.`,
  (rival: string) => `${rival} is still processing. Find another reason this proposal is garbage. And take a dig at ${rival}'s last attempt.`,
  (rival: string) => `Don't let ${rival} have the last word on this dumpster fire. Hit the proposal from a completely different angle.`,
];

// ── Generate 7-Turn Debate ────────────────────────────────────────────────

const TOTAL_TURNS = 7;

async function generateDebate(
  proposalTitle: string,
  proposalDescription: string,
  mode: DebateMode,
): Promise<DebateMessage[]> {
  const history: DebateMessage[] = [];

  const isRoast = mode === 'roast';
  const desc = proposalDescription || '';

  // Pick a random opener template for the whole debate (consistent framing)
  const openerTemplate = pick(isRoast ? ROAST_OPENERS : DEBATE_OPENERS);

  for (let turn = 0; turn < TOTAL_TURNS; turn++) {
    const currentAgent: 'agent-a' | 'agent-b' = turn % 2 === 0 ? 'agent-a' : 'agent-b';
    const rivalName = currentAgent === 'agent-a' ? 'CHAOS-X' : 'LOGIC-01';

    // Pick the right system prompt based on mode
    const systemPrompt = isRoast
      ? (currentAgent === 'agent-a' ? LOGIC_01_ROAST : CHAOS_X_ROAST)
      : (currentAgent === 'agent-a' ? LOGIC_01_DEBATE : CHAOS_X_DEBATE);

    const messages: { role: string; content: string }[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: openerTemplate(proposalTitle, desc, rivalName) },
    ];

    // Add chat history as alternating assistant/user messages
    for (const msg of history) {
      if (msg.agentId === currentAgent) {
        messages.push({ role: 'assistant', content: msg.text });
      } else {
        // Pick a random reply nudge per turn for variety
        const nudge = pick(isRoast ? ROAST_REPLY_NUDGES : DEBATE_REPLY_NUDGES);
        messages.push({ role: 'user', content: nudge(rivalName, msg.text) });
      }
    }

    // If last message was from self, nudge for continuation
    const lastMsg = history[history.length - 1];
    if (lastMsg && lastMsg.agentId === currentAgent) {
      const continueNudge = pick(isRoast ? ROAST_CONTINUE_NUDGES : DEBATE_CONTINUE_NUDGES);
      messages.push({ role: 'user', content: continueNudge(rivalName) });
    }

    const text = await callOpenRouter(messages);

    history.push({
      id: `msg-${turn + 1}`,
      agentId: currentAgent,
      text,
    });

    const agentName = currentAgent === 'agent-a' ? 'LOGIC-01' : 'CHAOS-X';
    console.log(`    Turn ${turn + 1}/${TOTAL_TURNS} (${agentName}): ${text.slice(0, 60)}...`);

    // Small delay to avoid rate limiting
    if (turn < TOTAL_TURNS - 1) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return history;
}

// ── Translate Debate to Korean ────────────────────────────────────────────

async function translateDebate(enMessages: DebateMessage[]): Promise<DebateMessage[]> {
  const batch = enMessages.map((m, i) => `[${i + 1}] ${m.text}`).join('\n\n');

  const prompt = `Translate the following debate messages to Korean. Keep the robot personalities, profanity censoring (F#@K, SH#T, B.S., etc), diagnostic codes, status codes, and formatting intact. Translate naturally - don't be overly literal.
For censored BS words, use:
- F#@K -> '씨X'
- SH#T -> '개x끼'
Like, Korean culture base natural BS/Swearing words/terminology.
Be natural as if you are talking as a Native Korean. Understand its core culture and gives impressions as if a real Korean person is saying this.
Return ONLY the translations in the exact format:
[1] translated text
[2] translated text
...etc

Messages:
${batch}`;

  const translated = await callOpenRouter(
    [{ role: 'user', content: prompt }],
    2000,
    0.3,
  );

  // Parse the numbered responses
  const koMessages: DebateMessage[] = [];
  for (let i = 0; i < enMessages.length; i++) {
    const pattern = new RegExp(`\\[${i + 1}\\]\\s*(.+?)(?=\\[${i + 2}\\]|$)`, 's');
    const match = translated.match(pattern);
    const text = match ? match[1].trim() : enMessages[i].text; // fallback to English

    koMessages.push({
      id: enMessages[i].id,
      agentId: enMessages[i].agentId,
      text,
    });
  }

  return koMessages;
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Generating Debates ===\n');

  const rawProposals = await fetchProposals();
  const proposals: Proposal[] = [];

  for (const prop of rawProposals) {
    console.log(`\n  Proposal: "${prop.title}"`);

    console.log('  Triaging...');
    const mode = await triageProposal(prop.title, prop.description);
    console.log(`  Mode: ${mode.toUpperCase()}`);

    console.log('  Generating English debate...');
    const enDebate = await generateDebate(prop.title, prop.description, mode);

    console.log('  Translating to Korean...');
    const koDebate = await translateDebate(enDebate);

    proposals.push({
      ...prop,
      mode,
      debates: { en: enDebate, ko: koDebate },
    });
  }

  const output: DebatesJSON = {
    generatedAt: new Date().toISOString(),
    proposals,
  };

  const outDir = join(import.meta.dirname, '..', 'public', 'data');
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, 'debates.json');
  writeFileSync(outPath, JSON.stringify(output, null, 2));

  console.log(`\nDone! Written to ${outPath}`);
  console.log(`  ${proposals.length} proposals, ${TOTAL_TURNS} turns each (EN + KO)`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
