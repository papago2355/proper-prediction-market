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
