import { useState, useEffect } from 'react';
import { DebateInterface } from './components/DebateInterface';
import { ProposalCard } from './components/ProposalCard';
import { motion } from 'motion/react';

interface Condition {
  question: string;
  outcomes: string[];
  prices: number[];
}

interface DebateMessage {
  id: string;
  agentId: 'agent-a' | 'agent-b';
  text: string;
}

interface Proposal {
  id: string;
  title: string;
  description: string;
  volume: string;
  image: string;
  category: string;
  mode?: 'debate' | 'roast';
  conditions: Condition[];
  debates: {
    en: DebateMessage[];
    ko: DebateMessage[];
  };
}

interface DebatesJSON {
  generatedAt: string;
  proposals: Proposal[];
}

function App() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<'en' | 'ko'>('en');

  // Load pre-generated debates from static JSON
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/data/debates.json');
        if (!res.ok) throw new Error('Failed to fetch debates');
        const data: DebatesJSON = await res.json();
        setProposals(data.proposals);
        if (data.proposals.length > 0) {
          setSelectedProposal(data.proposals[0]);
        }
      } catch (err) {
        console.error('Failed to load debates:', err);
        setError('Failed to load debate data.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const messages = selectedProposal?.debates[lang] ?? [];

  return (
    <div className="min-h-screen text-crt-green-soft font-terminal selection:bg-crt-green selection:text-black">
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

          {/* Language Toggle */}
          <div className="flex justify-center">
            <button
              onClick={() => setLang((l) => (l === 'en' ? 'ko' : 'en'))}
              className="flex items-center gap-1 border border-crt-green/40 px-3 py-1.5 text-xs font-retro hover:bg-crt-green/10 transition-colors rounded"
            >
              <span className={lang === 'en' ? 'text-crt-green' : 'text-crt-green-soft/40'}>EN</span>
              <span className="text-crt-green-soft/30">|</span>
              <span className={lang === 'ko' ? 'text-crt-green' : 'text-crt-green-soft/40'}>KR</span>
            </button>
          </div>
        </header>

        {/* Proposal Cards */}
        <section>
          <div className="flex items-center gap-2 mb-4 text-xs font-retro text-crt-green/70">
            <span className="animate-pulse-glow text-crt-green">&#x25CF;</span> LIVE FEED: TRENDING PROPOSALS
          </div>

          {isLoading ? (
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

        {/* Error */}
        {error && (
          <div className="text-center py-4 border border-red-500/30 bg-red-500/10 text-red-400 font-tech text-sm rounded-lg">
            ERROR: {error}
          </div>
        )}

        {/* Debate Arena */}
        <section className="mt-4">
          {selectedProposal && (
            <DebateInterface
              proposal={selectedProposal}
              messages={messages}
              isLive={false}
              lang={lang}
              mode={selectedProposal.mode}
            />
          )}
        </section>
      </main>

      <footer className="relative z-10 text-center py-8 text-crt-green-soft/30 text-xs font-tech border-t border-crt-green/10 mt-12">
        <p>SYSTEM: ONLINE // CONNECTED TO POLYMARKET // POWERED BY OPENROUTER</p>
      </footer>
    </div>
  );
}

export default App;
