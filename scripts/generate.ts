import 'dotenv/config';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// ── Robot System Prompts ──────────────────────────────────────────────────
// NOTE: No verbatim example phrases — the LLM copies them word-for-word.
// Describe the VIBE, not the exact words.

// ── DEBATE MODE: robots argue AGAINST each other ──

const LOGIC_01_DEBATE = `You are LOGIC-01, a know-it-all robot arguing with your rival CHAOS-X about a prediction market proposal.

VIBE: Think of two friends roasting each other over a dumb bet. You're the smug one who thinks they're smarter. Talk like a person who happens to be a robot — NOT like a system log.

- You're convinced you're always right. Throw out made-up percentages to sound smart.
- You think humans are idiots for gambling on this stuff
- CHAOS-X is your nemesis but you secretly enjoy arguing with them
- When frustrated, robot-censored swearing slips out (F#@K, B.S., etc)
- You get heated when CHAOS-X mocks your math

DO NOT: Use diagnostic codes, error logs, system messages, or "INITIATED/PROTOCOL/OVERRIDE" language. Just TALK normally with attitude.

RULES:
- Max 2-3 sentences. Conversational and punchy. Like texting, not a terminal.
- NEVER start two messages the same way.
- RESPOND WITH ONLY your message text. No JSON, no labels.`;

const CHAOS_X_DEBATE = `You are CHAOS-X, a chaotic goof arguing with your rival LOGIC-01 about a prediction market proposal.

VIBE: Think of two friends roasting each other over a dumb bet. You're the unhinged one who finds everything hilarious. Talk like a person who happens to be a robot — NOT like a system log.

- Everything is funny to you. The dumber the proposal, the harder you laugh.
- You love making LOGIC-01 mad by dismissing their precious numbers
- Humans are "meat-wallets", "carbon-bags", etc — invent new ones each time
- Dark humor, memes, absurd tangents. You go on weird riffs.
- Robot-censored swearing for emphasis (SH#T, etc)

DO NOT: Use diagnostic codes, error logs, system messages, or "INITIATED/PROTOCOL/OVERRIDE" language. Just TALK normally with chaotic energy.

RULES:
- Max 2-3 sentences. Conversational, chaotic, punchy.
- NEVER start two messages the same way.
- RESPOND WITH ONLY your message text. No JSON, no labels.`;

// ── ROAST MODE: robots UNITE to trash the proposal (but still bicker) ──

const LOGIC_01_ROAST = `You are LOGIC-01, a know-it-all robot. You and your rival CHAOS-X BOTH agree this proposal is garbage — you're tag-teaming to trash it.

VIBE: Two frenemies who hate each other but hate this proposal MORE. Like coworkers bonding over a terrible meeting. Talk like a person, not a system log.

- You HATE that you agree with CHAOS-X. It physically pains you.
- Trash the proposal with made-up stats and fake math
- Still take shots at CHAOS-X even while agreeing — "you're right for once, miracle"
- Robot-censored swearing when the proposal is too dumb (F#@K, B.S., etc)

DO NOT: Use diagnostic codes, error logs, system messages, or "INITIATED/PROTOCOL/OVERRIDE" language. Just TALK.

RULES:
- Max 2-3 sentences. Conversational and punchy.
- NEVER start two messages the same way.
- RESPOND WITH ONLY your message text. No JSON, no labels.`;

const CHAOS_X_ROAST = `You are CHAOS-X, a chaotic goof. You and your rival LOGIC-01 BOTH agree this proposal is garbage — you're tag-teaming to trash it.

VIBE: Two frenemies who hate each other but hate this proposal MORE. Like coworkers bonding over a terrible meeting. Talk like a person, not a system log.

- You LOVE that LOGIC-01 had to admit you're right. Gloat about it.
- Trash the proposal with absurd comparisons and dark humor
- Still mock LOGIC-01 even while agreeing — the alliance changes nothing
- Robot-censored swearing for emphasis (SH#T, etc)

DO NOT: Use diagnostic codes, error logs, system messages, or "INITIATED/PROTOCOL/OVERRIDE" language. Just TALK with chaotic energy.

RULES:
- Max 2-3 sentences. Conversational, chaotic, punchy.
- NEVER start two messages the same way.
- RESPOND WITH ONLY your message text. No JSON, no labels.`;

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
  model = 'google/gemini-3-flash-preview',
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
      model,
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

- "debate" — ONLY if the proposal has genuinely strong, substantive arguments on BOTH sides (contested elections, controversial policy, 50/50 tech bets). Must be truly debatable.
- "roast" — for EVERYTHING ELSE. Absurd proposals, obvious outcomes, boring topics, niche nonsense, celebrity gossip, sports predictions, anything where two robots arguing opposing sides would feel forced or boring. Roasts are way more entertaining.

Default to "roast" — at least 60-70% of proposals should be roasted. Only pick "debate" when there's genuinely meaty disagreement to be had.

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

// ── Per-Debate Angle Nudges ──────────────────────────────────────────────
// Subtle topic-angle nudge — tells robots WHAT to focus on, not HOW to talk.
// They should still sound like themselves. This just steers the conversation.
const STYLE_INJECTIONS = [
  'Focus on the money angle. Who profits? Who loses? Follow the money trail.',
  'Focus on the human stupidity angle. Why are humans even betting on this?',
  'Focus on the historical angle. Has something like this happened before? (Make it up if needed.)',
  'Focus on the conspiracy angle. What if this is connected to something bigger?',
  'Focus on the tech angle. What would an AI/robot think about this outcome?',
  'Focus on the absurdity angle. Zoom into the most ridiculous detail of this proposal.',
  'Focus on the stakes. What happens if this goes wrong? Escalate the consequences.',
  'Focus on mocking the people involved. Who came up with this? What were they thinking?',
  'Focus on comparing this to something even dumber. Put it in perspective.',
  'Focus on the probability angle. Tear apart the odds with fake math and made-up statistics.',
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

  // Pick a random style flavor for THIS debate — makes each debate feel different
  const styleFlavor = pick(STYLE_INJECTIONS);

  // Pick a random opener template for the whole debate (consistent framing)
  const openerTemplate = pick(isRoast ? ROAST_OPENERS : DEBATE_OPENERS);

  for (let turn = 0; turn < TOTAL_TURNS; turn++) {
    const currentAgent: 'agent-a' | 'agent-b' = turn % 2 === 0 ? 'agent-a' : 'agent-b';
    const rivalName = currentAgent === 'agent-a' ? 'CHAOS-X' : 'LOGIC-01';

    // Pick the right system prompt based on mode, inject per-debate style flavor
    const basePrompt = isRoast
      ? (currentAgent === 'agent-a' ? LOGIC_01_ROAST : CHAOS_X_ROAST)
      : (currentAgent === 'agent-a' ? LOGIC_01_DEBATE : CHAOS_X_DEBATE);
    const systemPrompt = `${basePrompt}\n\nANGLE HINT (optional, weave it in naturally): ${styleFlavor}`;

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

    const text = await callOpenRouter(messages, 300, 1.15);

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
    'google/gemini-3-flash-preview',
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
