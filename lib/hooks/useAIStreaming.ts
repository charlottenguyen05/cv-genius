import { useCallback } from 'react';

export function useAIStreaming() {
  const simulateStreaming = useCallback((
    text: string,
    onUpdate: (partialText: string) => void,
    intervalMs: number = 1000
  ) => {
    const words = text.split(' ');
    let currentIndex = 0;
    let currentText = '';

    const interval = setInterval(() => {
      if (currentIndex < words.length) {
        currentText += (currentIndex === 0 ? '' : ' ') + words[currentIndex];
        onUpdate(currentText);
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, []);

  return { simulateStreaming };
}
