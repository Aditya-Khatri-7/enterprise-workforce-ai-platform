import { useState, useEffect } from 'react';

export function useAIIntro(callback) {
  const [text, setText] = useState('');
  const [isDone, setIsDone] = useState(false);

  const fullText = [
    "Hello.",
    "Welcome to Enterprise Workforce OS.",
    "I'm EWAP AI.",
    "Your Enterprise Operations Assistant.",
    "I'll help you explore the platform, understand every module, and accelerate workforce management.",
    "What would you like to do today?"
  ];

  useEffect(() => {
    let lineIdx = 0;
    let charIdx = 0;
    let currentString = '';
    let interval;

    const typeChar = () => {
      if (lineIdx >= fullText.length) {
        setIsDone(true);
        if (callback) callback();
        return;
      }

      const currentLine = fullText[lineIdx];
      if (charIdx < currentLine.length) {
        currentString += currentLine[charIdx];
        setText(currentString);
        charIdx++;
        interval = setTimeout(typeChar, 25);
      } else {
        // Line finished. Add newline and wait a bit before next line
        currentString += '\n';
        setText(currentString);
        lineIdx++;
        charIdx = 0;
        interval = setTimeout(typeChar, 400);
      }
    };

    interval = setTimeout(typeChar, 600);

    return () => clearTimeout(interval);
  }, []);

  return { text, isDone };
}
