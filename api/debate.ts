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

    let cleaned = content.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const messages = JSON.parse(cleaned);

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
