import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RobotAvatar } from './RobotAvatar';
import { useTypewriter } from '../hooks/useTypewriter';
import { useRobotSound } from '../hooks/useRobotSound';
import clsx from 'clsx';

interface Condition {
  question: string;
  outcomes: string[];
  prices: number[];
}

interface Proposal {
  id: string;
  title: string;
  description: string;
  volume: string;
  image: string;
  category: string;
  conditions: Condition[];
}

interface Message {
  id: string;
  agentId: 'agent-a' | 'agent-b';
  text: string;
  timestamp: number;
}

interface DebateInterfaceProps {
  proposal: Proposal;
  messages: Message[];
  isLive?: boolean;
  lang?: string;
  mode?: 'debate' | 'roast';
}

// Track which debates the user has already seen this session
const seenDebates = new Set<string>();

// Auto-scroll within the chat container only (not the page)
const useContainerScroll = (scrollRef: React.RefObject<HTMLDivElement | null>) => {
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const observer = new MutationObserver(() => {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    });
    observer.observe(container, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [scrollRef]);
};

const TypewriterMessage: React.FC<{
  message: Message;
  isLatest: boolean;
  onComplete?: () => void;
}> = ({ message, isLatest, onComplete }) => {
  const { beep } = useRobotSound();
  const isAgentA = message.agentId === 'agent-a';

  const { displayedText, isTyping } = useTypewriter({
    text: message.text,
    speed: 20,
    enabled: isLatest,
    onCharacter: () => {
      if (Math.random() > 0.7) beep();
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
        {isAgentA ? 'LOGIC-01' : 'CHAOS-X'}
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

// Foldable proposal details
const ProposalDetails: React.FC<{ proposal: Proposal }> = ({ proposal }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-2 border-crt-green/40 bg-dark-card/80 relative overflow-hidden">
      {/* Header - always visible, clickable */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 pt-8 text-left hover:bg-crt-green/5 transition-colors"
      >
        <div className="absolute top-0 left-0 bg-crt-green text-black px-3 py-1 text-xs font-retro uppercase">
          Target Proposal
        </div>
        <div className="absolute top-0 right-0 px-3 py-1 text-xs font-tech text-crt-green/50 flex items-center gap-1">
          {isOpen ? '▼' : '▶'} {proposal.conditions.length} condition{proposal.conditions.length !== 1 ? 's' : ''}
        </div>
        <h2 className="text-xl md:text-2xl text-crt-green text-shadow-glow-sm text-center uppercase tracking-wider">
          {proposal.title}
        </h2>
        <div className="flex justify-center gap-4 mt-2 text-crt-green-soft/50 text-xs font-tech">
          <span>VOL: {proposal.volume}</span>
          <span>//</span>
          <span>{proposal.category.toUpperCase()}</span>
        </div>
      </button>

      {/* Foldable conditions section */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-crt-green/20 pt-3">
              {/* Description */}
              {proposal.description && (
                <p className="text-crt-green-soft/60 text-sm font-tech leading-relaxed">
                  {proposal.description}
                </p>
              )}

              {/* Conditions / Market Outcomes */}
              {proposal.conditions.map((cond, i) => (
                <div key={i} className="border border-crt-green/15 bg-dark-bg/50 p-3 rounded">
                  <div className="text-xs font-tech text-crt-green/70 mb-2">{cond.question}</div>
                  <div className="flex gap-2 flex-wrap">
                    {cond.outcomes.map((outcome, j) => {
                      const price = cond.prices[j] ?? 0;
                      const isYes = outcome.toLowerCase() === 'yes';
                      const barColor = isYes ? 'bg-crt-green' : 'bg-red-500';
                      return (
                        <div key={j} className="flex-1 min-w-[120px]">
                          <div className="flex justify-between text-xs font-tech mb-1">
                            <span className={isYes ? 'text-crt-green' : 'text-red-400'}>{outcome}</span>
                            <span className="text-crt-green-soft/80">{price}%</span>
                          </div>
                          <div className="h-2 bg-dark-bg rounded-full overflow-hidden">
                            <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${price}%`, opacity: 0.7 }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const DebateInterface: React.FC<DebateInterfaceProps> = ({
  proposal,
  messages,
  isLive = true,
  lang,
  mode = 'debate',
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [speakingAgent, setSpeakingAgent] = useState<'agent-a' | 'agent-b' | null>(null);

  useContainerScroll(scrollRef);

  // Track which agent is speaking
  useEffect(() => {
    if (messages.length > 0 && completedCount < messages.length) {
      setSpeakingAgent(messages[completedCount]?.agentId ?? null);
    } else {
      setSpeakingAgent(null);
    }
  }, [messages, completedCount]);

  // On new proposal or language: skip typewriter if already seen
  useEffect(() => {
    const key = `${proposal.id}-${lang}`;
    if (seenDebates.has(key) && messages.length > 0) {
      setCompletedCount(messages.length);
    } else {
      setCompletedCount(0);
    }
  }, [proposal.id, lang, messages.length]);

  // Called when each message finishes typing — marks seen on final message
  const handleMessageComplete = () => {
    setCompletedCount((c) => {
      const next = c + 1;
      if (next >= messages.length) {
        seenDebates.add(`${proposal.id}-${lang}`);
      }
      return next;
    });
  };

  // Visible messages: completed + the one currently typing
  const visibleMessages = messages.slice(0, completedCount + 1);
  const debateActive = isLive || completedCount < messages.length;

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 font-terminal">
      {/* Proposal Header - Foldable */}
      <ProposalDetails proposal={proposal} />

      {/* Mode Badge */}
      <div className="flex justify-center">
        <div className={clsx(
          'px-3 py-1 text-[10px] font-retro uppercase tracking-widest border rounded',
          mode === 'roast'
            ? 'text-red-400 border-red-500/40 bg-red-500/10'
            : 'text-crt-green/60 border-crt-green/20 bg-crt-green/5'
        )}>
          {mode === 'roast' ? '// JOINT ROAST MODE //' : '// DEBATE MODE //'}
        </div>
      </div>

      {/* Debate Arena */}
      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr_200px] gap-4 min-h-[450px]">

        {/* Robot A - Left */}
        <div className="flex flex-col items-center gap-3 border-2 border-crt-amber/20 p-4 bg-dark-card/50 rounded-lg">
          <RobotAvatar seed="logic-bot-v1" size={160} color="#ffb000" isSpeaking={speakingAgent === 'agent-a'} />
          <div className="bg-crt-amber text-black text-xs px-3 py-1 font-bold font-retro">LOGIC-01</div>
          <div className="w-full border border-crt-amber/20 p-2 font-tech text-[11px] text-crt-amber/60 space-y-1">
            <p>{'>'} SKEPTICISM: 98%</p>
            <p>{'>'} LOGIC CORES: ONLINE</p>
            <p>{'>'} {speakingAgent === 'agent-a' ? 'TRANSMITTING...' : 'STANDBY'}</p>
          </div>
        </div>

        {/* Chat Stream - internal scroll, no blocking header */}
        <div
          ref={scrollRef}
          className="crt-scrollbar border border-crt-green/15 bg-dark-bg/90 p-4 flex flex-col gap-4 overflow-y-auto h-[500px] rounded-lg"
        >
          <AnimatePresence>
            {visibleMessages.map((msg, idx) => (
              <TypewriterMessage
                key={msg.id}
                message={msg}
                isLatest={idx === completedCount}
                onComplete={handleMessageComplete}
              />
            ))}
          </AnimatePresence>

          {/* Waiting for next API response */}
          {isLive && messages.length <= completedCount && messages.length > 0 && (
            <div className="animate-pulse-glow text-crt-green text-xs mt-2 text-center font-tech">
              <span className="inline-block animate-spin mr-1">&#x2699;</span> COMPUTING NEXT RESPONSE...
            </div>
          )}

          {/* Debate complete */}
          {!debateActive && messages.length > 0 && (
            <div className="text-crt-green-soft/40 text-xs mt-4 text-center font-tech">
              {'>'} DEBATE CONCLUDED. SELECT ANOTHER PROPOSAL.
            </div>
          )}

          {/* Initial loading */}
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
          <RobotAvatar seed="chaos-bot-v9" size={160} color="#00ffff" isSpeaking={speakingAgent === 'agent-b'} />
          <div className="bg-crt-blue text-black text-xs px-3 py-1 font-bold font-retro">CHAOS-X</div>
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
