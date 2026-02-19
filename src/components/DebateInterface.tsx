import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { RobotAvatar } from './RobotAvatar';
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

export const DebateInterface: React.FC<DebateInterfaceProps> = ({ 
  proposalTitle, 
  messages,
  isLive = true
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLive]);

  return (
    <div className="w-full max-w-6xl mx-auto p-4 flex flex-col gap-6 font-terminal">
      {/* Header / Proposal Display */}
      <div className="border-4 border-crt-green bg-black/80 p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 bg-crt-green text-black px-2 py-1 text-xs font-retro uppercase">
          Target Proposal
        </div>
        <h2 className="text-2xl md:text-3xl text-crt-green text-shadow-glow mt-4 text-center uppercase tracking-widest">
          {proposalTitle}
        </h2>
        <div className="flex justify-center gap-4 mt-4 text-crt-green/60 text-sm font-tech">
          <span>STATUS: ACTIVE</span>
          <span>//</span>
          <span>VOL: HIGH</span>
          <span>//</span>
          <span>SCANNING...</span>
        </div>
      </div>

      {/* Debate Arena */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr_1fr] gap-4 min-h-[400px]">
        
        {/* Agent A - Left */}
        <div className="flex flex-col items-center gap-4 border-2 border-crt-amber/30 p-4 bg-black/50">
          <div className="relative">
            <RobotAvatar seed="logic-bot-v1" size={120} color="#ffb000" />
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-crt-amber text-black text-xs px-2 font-bold whitespace-nowrap">
              UNIT: LOGIC-01
            </div>
          </div>
          <div className="w-full h-full border border-crt-amber/20 p-2 font-tech text-xs text-crt-amber/80 overflow-y-auto">
            <p>{'>'} INITIALIZING LOGIC CORES...</p>
            <p>{'>'} SKEPTICISM LEVEL: 98%</p>
            <p>{'>'} DETECTING IRRATIONALITY...</p>
          </div>
        </div>

        {/* Chat Stream - Center */}
        <div 
          ref={scrollRef}
          className="border-x-2 border-crt-green/20 bg-black/90 p-4 flex flex-col gap-4 overflow-y-auto h-[500px] scrollbar-hide relative scroll-smooth"
        >
          <div className="sticky top-0 bg-black/90 z-10 border-b border-crt-green/20 pb-2 mb-2 text-center text-crt-green/50 text-xs">
            --- DEBATE LOG STREAM ---
          </div>
          
          {messages.map((msg) => {
            const isAgentA = msg.agentId === 'agent-a';
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={clsx(
                  "flex flex-col max-w-[90%]",
                  isAgentA ? "self-start items-start" : "self-end items-end"
                )}
              >
                <div className={clsx(
                  "text-[10px] mb-1 font-tech uppercase tracking-wider",
                  isAgentA ? "text-crt-amber" : "text-crt-blue"
                )}>
                  {isAgentA ? 'UNIT: LOGIC-01' : 'UNIT: CHAOS-X'} :: {new Date(msg.timestamp).toLocaleTimeString([], {hour12: false})}
                </div>
                <div className={clsx(
                  "p-3 border-2 text-sm md:text-base font-terminal leading-relaxed",
                  isAgentA 
                    ? "border-crt-amber text-crt-amber bg-crt-amber/5 rounded-tr-xl rounded-bl-xl rounded-br-xl" 
                    : "border-crt-blue text-crt-blue bg-crt-blue/5 rounded-tl-xl rounded-bl-xl rounded-br-xl"
                )}>
                  {msg.text}
                </div>
              </motion.div>
            );
          })}
          
          {isLive && (
            <div className="animate-pulse text-crt-green text-xs mt-4 text-center">
              {'>'} AWAITING NEXT CALCULATION...
            </div>
          )}
        </div>

        {/* Agent B - Right */}
        <div className="flex flex-col items-center gap-4 border-2 border-crt-blue/30 p-4 bg-black/50">
          <div className="relative">
            <RobotAvatar seed="chaos-bot-v9" size={120} color="#00ffff" />
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-crt-blue text-black text-xs px-2 font-bold whitespace-nowrap">
              UNIT: CHAOS-X
            </div>
          </div>
          <div className="w-full h-full border border-crt-blue/20 p-2 font-tech text-xs text-crt-blue/80 overflow-y-auto">
            <p>{'>'} RANDOMNESS SEED: ACTIVE</p>
            <p>{'>'} HUMOR MODULE: ENGAGED</p>
            <p>{'>'} MOCKERY SUBROUTINE: RUNNING</p>
          </div>
        </div>

      </div>
    </div>
  );
};
