import React from 'react';
import { motion } from 'motion/react';
import clsx from 'clsx';

interface ProposalCardProps {
  title: string;
  volume: string;
  image: string;
  category: string;
  isSelected: boolean;
  onClick: () => void;
}

export const ProposalCard: React.FC<ProposalCardProps> = ({
  title,
  volume,
  image,
  category,
  isSelected,
  onClick,
}) => {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      className={clsx(
        'relative overflow-hidden border-2 text-left transition-all duration-300 group h-[220px] flex flex-col justify-end',
        isSelected
          ? 'border-crt-green box-glow-green'
          : 'border-crt-green/20 hover:border-crt-green/50'
      )}
    >
      {/* Background image */}
      {image && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 group-hover:opacity-40 transition-opacity"
          style={{ backgroundImage: `url(${image})` }}
        />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/80 to-transparent" />

      {/* Category tag */}
      <div className="absolute top-2 left-2 z-10">
        <span className="bg-crt-green/20 text-crt-green text-[10px] font-tech px-2 py-0.5 border border-crt-green/30 uppercase">
          {category}
        </span>
      </div>

      {/* Volume badge */}
      <div className="absolute top-2 right-2 z-10">
        <span className="bg-crt-amber/20 text-crt-amber text-[10px] font-tech px-2 py-0.5 border border-crt-amber/30">
          VOL: {volume}
        </span>
      </div>

      {/* Title */}
      <div className="relative z-10 p-4">
        <h3 className={clsx(
          'font-terminal text-lg leading-tight',
          isSelected ? 'text-crt-green text-shadow-glow-sm' : 'text-crt-green-soft/80'
        )}>
          {title}
        </h3>
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <motion.div
          layoutId="card-indicator"
          className="absolute bottom-0 left-0 w-full h-1 bg-crt-green"
          initial={false}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}
    </motion.button>
  );
};
