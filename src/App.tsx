import React, { useState, useEffect } from 'react';
import { DebateInterface } from './components/DebateInterface';
import { motion } from 'motion/react';

interface Proposal {
  id: string;
  title: string;
  volume: string;
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

  // Fetch Proposals on Mount
  useEffect(() => {
    const fetchProposals = async () => {
      try {
        const res = await fetch('/api/trending');
        const data = await res.json();
        setProposals(data);
        if (data.length > 0) {
          setSelectedProposal(data[0]);
        }
      } catch (error) {
        console.error("Failed to fetch proposals:", error);
      } finally {
        setIsLoadingProposals(false);
      }
    };

    fetchProposals();
  }, []);

  // Fetch Debate when Selected Proposal Changes
  useEffect(() => {
    if (!selectedProposal) return;

    const fetchDebate = async () => {
      setIsGeneratingDebate(true);
      setMessages([]); // Clear previous messages
      try {
        const res = await fetch('/api/debate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ proposalTitle: selectedProposal.title })
        });
        const data = await res.json();
        
        // Simulate streaming/typing effect
        // We'll add messages one by one
        if (Array.isArray(data)) {
          let currentMsgs: Message[] = [];
          for (const msg of data) {
            await new Promise(resolve => setTimeout(resolve, 1500)); // Wait 1.5s between messages
            currentMsgs = [...currentMsgs, msg];
            setMessages(currentMsgs);
          }
        }
      } catch (error) {
        console.error("Failed to generate debate:", error);
      } finally {
        setIsGeneratingDebate(false);
      }
    };

    fetchDebate();
  }, [selectedProposal]);

  return (
    <div className="min-h-screen bg-dark-bg text-crt-green font-terminal selection:bg-crt-green selection:text-black">
      {/* CRT Effects */}
      <div className="scanlines" />
      <div className="crt-flicker" />

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-8 flex flex-col gap-8">
        
        {/* Title Section */}
        <header className="text-center space-y-4 mb-8">
          <motion.h1 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-3xl md:text-5xl font-retro text-crt-green text-shadow-glow leading-tight"
          >
            Building the Proper
            <br />
            <span className="text-crt-amber">Prediction Market</span>
          </motion.h1>
          <p className="font-tech text-crt-green/60 text-sm md:text-base max-w-2xl mx-auto border-b border-crt-green/30 pb-4">
            // SYSTEM: ANALYZING POLYMARKET TRENDS
            <br />
            // AGENTS: DEPLOYED FOR RATIONALITY VERIFICATION
          </p>
        </header>

        {/* Proposal Selector */}
        <section className="w-full max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-4 text-xs font-retro text-crt-green/80">
            <span className="animate-pulse">●</span> LIVE FEED: TOP TRENDING
          </div>
          
          {isLoadingProposals ? (
            <div className="text-center py-12 border border-crt-green/30 text-crt-green/50 animate-pulse">
              LOADING MARKET DATA...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {proposals.map((prop) => (
                <button
                  key={prop.id}
                  onClick={() => setSelectedProposal(prop)}
                  className={`
                    p-4 border-2 text-left transition-all duration-200 group relative overflow-hidden
                    ${selectedProposal?.id === prop.id 
                      ? 'border-crt-green bg-crt-green/10 shadow-[0_0_15px_rgba(51,255,0,0.3)]' 
                      : 'border-crt-green/30 hover:border-crt-green/60 hover:bg-crt-green/5'
                    }
                  `}
                >
                  <div className="absolute top-0 right-0 p-1 bg-crt-green/20 text-[10px] font-tech">
                    VOL: {prop.volume}
                  </div>
                  <h3 className={`font-terminal text-lg leading-tight mt-2 ${selectedProposal?.id === prop.id ? 'text-crt-green' : 'text-crt-green/70'}`}>
                    {prop.title}
                  </h3>
                  {selectedProposal?.id === prop.id && (
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-crt-green animate-pulse" />
                  )}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Active Debate */}
        <section className="mt-8">
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
      <footer className="relative z-10 text-center py-8 text-crt-green/40 text-xs font-tech border-t border-crt-green/10 mt-12">
        <p>SYSTEM STATUS: ONLINE // LATENCY: 12ms // CONNECTED TO POLYMARKET NODE</p>
      </footer>
    </div>
  );
}

export default App;
