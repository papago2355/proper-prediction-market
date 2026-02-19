import { useCallback, useRef } from 'react';

export function useRobotSound() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getContext = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    return ctxRef.current;
  }, []);

  const beep = useCallback((pitch?: number) => {
    try {
      const ctx = getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const freq = pitch ?? 200 + Math.random() * 600;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.type = Math.random() > 0.5 ? 'square' : 'sawtooth';

      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    } catch {
      // Silently fail if audio not available
    }
  }, [getContext]);

  const speak = useCallback((text: string, onChar: (index: number) => void, speed = 30) => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        onChar(i);
        if (text[i] !== ' ') {
          beep();
        }
        i++;
      } else {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [beep]);

  return { beep, speak };
}
