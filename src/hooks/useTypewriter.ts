import { useState, useEffect, useRef } from 'react';

interface UseTypewriterOptions {
  text: string;
  speed?: number;
  enabled?: boolean;
  onCharacter?: (index: number) => void;
  onComplete?: () => void;
}

export function useTypewriter({
  text,
  speed = 30,
  enabled = true,
  onCharacter,
  onComplete,
}: UseTypewriterOptions) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled || !text) {
      setDisplayedText(text || '');
      return;
    }

    setIsTyping(true);
    setDisplayedText('');
    let i = 0;

    intervalRef.current = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(text.slice(0, i + 1));
        onCharacter?.(i);
        i++;
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsTyping(false);
        onComplete?.();
      }
    }, speed);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [text, speed, enabled]);

  return { displayedText, isTyping };
}
