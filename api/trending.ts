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

    res.setHeader('Cache-Control', 's-maxage=21600, max-age=60, stale-while-revalidate=3600');
    return res.status(200).json(markets);
  } catch (error) {
    console.error('Error fetching trending markets:', error);
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
