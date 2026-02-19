import React, { useMemo } from 'react';

interface RobotAvatarProps {
  seed: string;
  size?: number;
  color?: string;
  className?: string;
}

export const RobotAvatar: React.FC<RobotAvatarProps> = ({ 
  seed, 
  size = 64, 
  color = '#33ff00',
  className 
}) => {
  // Simple pseudo-random number generator based on seed
  const seededRandom = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return () => {
      const x = Math.sin(hash++) * 10000;
      return x - Math.floor(x);
    };
  };

  const rects = useMemo(() => {
    const rng = seededRandom(seed);
    const blocks = [];
    const gridSize = 8;
    const pixelSize = size / gridSize;

    // Generate half the face and mirror it
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize / 2; x++) {
        if (rng() > 0.5) {
          blocks.push({ x, y });
          blocks.push({ x: gridSize - 1 - x, y });
        }
      }
    }
    return { blocks, pixelSize };
  }, [seed, size]);

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox={`0 0 ${size} ${size}`} 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width={size} height={size} fill="transparent" />
      {rects.blocks.map((block, i) => (
        <rect
          key={i}
          x={block.x * rects.pixelSize}
          y={block.y * rects.pixelSize}
          width={rects.pixelSize}
          height={rects.pixelSize}
          fill={color}
        />
      ))}
      {/* Eyes - usually distinct */}
      <rect 
        x={2 * rects.pixelSize} 
        y={3 * rects.pixelSize} 
        width={rects.pixelSize} 
        height={rects.pixelSize} 
        fill="#000" 
      />
      <rect 
        x={(8 - 1 - 2) * rects.pixelSize} 
        y={3 * rects.pixelSize} 
        width={rects.pixelSize} 
        height={rects.pixelSize} 
        fill="#000" 
      />
    </svg>
  );
};
