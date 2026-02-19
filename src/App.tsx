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
