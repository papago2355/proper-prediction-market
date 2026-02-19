import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import axios from "axios";

// Initialize Gemini
// Note: In a real deployment, ensure GEMINI_API_KEY is set in the environment
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON
  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", system: "Proper Prediction Market Node" });
  });

  // Fetch Trending Markets from PolyMarket
  app.get("/api/trending", async (req, res) => {
    try {
      // Fetching events from PolyMarket Gamma API
      // We'll use the /events endpoint and sort by volume to get trending items
      const response = await axios.get('https://gamma-api.polymarket.com/events', {
        params: {
          limit: 6, // Fetch a few more to filter if needed
          sort: 'volume',
          order: 'desc',
          closed: false
        }
      });

      // Transform data to our format
      const markets = response.data.map((event: any) => ({
        id: event.id,
        title: event.title,
        volume: event.volume ? `$${(event.volume / 1000000).toFixed(1)}M` : 'N/A',
        description: event.description,
        slug: event.slug
      })).slice(0, 3); // Take top 3

      res.json(markets);
    } catch (error) {
      console.error("Error fetching trending markets:", error);
      // Fallback to mock data if API fails (e.g. rate limits or network issues)
      res.json([
        { id: '1', title: "Will Bitcoin hit $100k by end of 2024?", volume: "$52.1M" },
        { id: '2', title: "Will Taylor Swift endorse a candidate in Oct?", volume: "$12.4M" },
        { id: '3', title: "Will GPT-5 be released before Q3?", volume: "$8.9M" }
      ]);
    }
  });

  // Generate Debate for a specific proposal
  app.post("/api/debate", async (req, res) => {
    const { proposalTitle } = req.body;

    if (!proposalTitle) {
      return res.status(400).json({ error: "Proposal title is required" });
    }

    try {
      const prompt = `
        You are simulating a debate between two retro AI robots discussing a prediction market proposal from PolyMarket.
        
        Proposal: "${proposalTitle}"

        Agent A (Logic-Bot):
        - Highly skeptical, purely logical, calculates probabilities.
        - Uses phrases like "According to my calculations", "Illogical", "Probability converges to...".
        - Thinks humans are irrational.

        Agent B (Chaos-Bot):
        - Chaotic, meme-loving, cynical, humorous.
        - Uses internet slang, mocks "logic", loves gambling/risk.
        - Thinks humans are amusingly stupid.

        Generate a short dialogue (4 messages total, alternating A -> B -> A -> B).
        Return the response as a JSON array of objects with 'agentId' ('agent-a' or 'agent-b') and 'text'.
        
        Example format:
        [
          { "agentId": "agent-a", "text": "..." },
          { "agentId": "agent-b", "text": "..." }
        ]
        
        Do not include markdown formatting like \`\`\`json. Just the raw JSON string.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const text = response.text;
      const messages = JSON.parse(text);

      // Add timestamps
      const now = Date.now();
      const messagesWithTime = messages.map((msg: any, index: number) => ({
        ...msg,
        id: `msg-${now}-${index}`,
        timestamp: now + (index * 2000) // Stagger timestamps slightly for effect
      }));

      res.json(messagesWithTime);

    } catch (error) {
      console.error("Error generating debate:", error);
      res.status(500).json({ error: "Failed to generate debate" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static file serving would go here
     app.use(express.static('dist'));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
