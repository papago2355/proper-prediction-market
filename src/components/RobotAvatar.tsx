import React, { useMemo } from 'react';

interface RobotAvatarProps {
  seed: string;
  size?: number;
  color?: string;
  isSpeaking?: boolean;
  className?: string;
}

export const RobotAvatar: React.FC<RobotAvatarProps> = ({
  seed,
  size = 180,
  color = '#33ff00',
  isSpeaking = false,
  className,
}) => {
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

  const grid = useMemo(() => {
    const rng = seededRandom(seed);
    const gridSize = 10;
    const px = size / gridSize;
    const blocks: { x: number; y: number }[] = [];

    // Body (rows 3-9): symmetric pixel blocks
    for (let y = 3; y < gridSize; y++) {
      for (let x = 0; x < gridSize / 2; x++) {
        if (rng() > 0.4) {
          blocks.push({ x, y });
          blocks.push({ x: gridSize - 1 - x, y });
        }
      }
    }

    // Head block (rows 0-2): always filled for structure
    for (let y = 0; y < 3; y++) {
      for (let x = 2; x < 8; x++) {
        if (y === 0 && (x < 3 || x > 6)) continue;
        blocks.push({ x, y });
      }
    }

    return { blocks, px, gridSize };
  }, [seed, size]);

  const glowFilter = isSpeaking
    ? `drop-shadow(0 0 8px ${color}) drop-shadow(0 0 16px ${color})`
    : `drop-shadow(0 0 3px ${color})`;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: glowFilter, transition: 'filter 0.3s ease' }}
    >
      {/* Body pixels */}
      {grid.blocks.map((block, i) => (
        <rect
          key={i}
          x={block.x * grid.px}
          y={block.y * grid.px}
          width={grid.px}
          height={grid.px}
          fill={color}
          opacity={0.85}
        />
      ))}

      {/* Eyes */}
      <rect x={3 * grid.px} y={1 * grid.px} width={grid.px * 1.5} height={grid.px} fill="#000" rx={2}>
        <animate attributeName="height" values={`${grid.px};2;${grid.px}`} dur="3s" repeatCount="indefinite" keyTimes="0;0.03;0.06" keySplines="0.5 0 0.5 1;0.5 0 0.5 1" calcMode="spline" />
      </rect>
      <rect x={5.5 * grid.px} y={1 * grid.px} width={grid.px * 1.5} height={grid.px} fill="#000" rx={2}>
        <animate attributeName="height" values={`${grid.px};2;${grid.px}`} dur="3s" repeatCount="indefinite" keyTimes="0;0.03;0.06" keySplines="0.5 0 0.5 1;0.5 0 0.5 1" calcMode="spline" />
      </rect>

      {/* Eye glow when speaking */}
      {isSpeaking && (
        <>
          <rect x={3 * grid.px} y={1 * grid.px} width={grid.px * 1.5} height={grid.px} fill={color} opacity={0.6} rx={2}>
            <animate attributeName="opacity" values="0.6;0.2;0.6" dur="0.5s" repeatCount="indefinite" />
          </rect>
          <rect x={5.5 * grid.px} y={1 * grid.px} width={grid.px * 1.5} height={grid.px} fill={color} opacity={0.6} rx={2}>
            <animate attributeName="opacity" values="0.6;0.2;0.6" dur="0.5s" repeatCount="indefinite" />
          </rect>
        </>
      )}

      {/* Antenna */}
      <line x1={size / 2} y1={0} x2={size / 2} y2={-grid.px} stroke={color} strokeWidth={2} />
      <circle cx={size / 2} cy={-grid.px} r={grid.px / 3} fill={color}>
        <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
      </circle>

      {/* Mouth - animated when speaking */}
      <rect x={4 * grid.px} y={2 * grid.px} width={grid.px * 2} height={grid.px * 0.4} fill="#000" rx={1}>
        {isSpeaking && (
          <animate attributeName="height" values={`${grid.px * 0.4};${grid.px * 0.8};${grid.px * 0.4}`} dur="0.3s" repeatCount="indefinite" />
        )}
      </rect>
    </svg>
  );
};
