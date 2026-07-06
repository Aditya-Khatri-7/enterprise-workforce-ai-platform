import { useState, useEffect, useRef } from 'react';

export function useAIIntro(callback) {
  const [text, setText] = useState('');
  const [isDone, setIsDone] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const lineIdxRef = useRef(0);
  const speechEndedRef = useRef(false);
  const typingEndedRef = useRef(false);
  const initialized = useRef(false);

  // Split into display and speak keys for perfect abbreviation reading
  const fullText = [
    { display: "Hello.", speak: "Hello." },
    { display: "Welcome to Enterprise Workforce OS.", speak: "Welcome to Enterprise Workforce O.S." },
    { display: "I'm EWAP AI.", speak: "I'm E.W.A.P. A.I." },
    { display: "Your Enterprise Operations Assistant.", speak: "Your Enterprise Operations Assistant." },
    { display: "I'll help you explore the platform, understand every module, and accelerate workforce management.", speak: "I'll help you explore the platform, understand every module, and accelerate workforce management." },
    { display: "What would you like to do today?", speak: "What would you like to do today?" }
  ];

  useEffect(() => {
    let charIdx = 0;
    let currentString = '';
    let interval;
    const speechCharIdxRef = { current: 0 };
    const hasBoundaryFired = { current: false };

    // Initial instruction text
    setText("> CLICK ANYWHERE TO WAKE UP EWAP AI...");

    const speakAndTypeLine = () => {
      const lineIdx = lineIdxRef.current;
      if (lineIdx >= fullText.length) {
        setIsDone(true);
        setIsSpeaking(false);
        if (callback) callback();
        return;
      }

      const currentLine = fullText[lineIdx];
      speechEndedRef.current = false;
      typingEndedRef.current = false;
      speechCharIdxRef.current = 0;
      hasBoundaryFired.current = false;

      // 1. Play Speech for current line
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(currentLine.speak);
        utterance.rate = 1.15; // 15% faster speech rate
        utterance.pitch = 0.85;

        const voices = window.speechSynthesis.getVoices();
        const maleVoice = voices.find(v => 
          v.lang.startsWith('en') && 
          (v.name.toLowerCase().includes('male') || 
           v.name.toLowerCase().includes('david') || 
           v.name.toLowerCase().includes('guy') || 
           v.name.toLowerCase().includes('microsoft david') ||
           v.name.toLowerCase().includes('google us english male') ||
           v.name.toLowerCase().includes('mark') ||
           v.name.toLowerCase().includes('arthur'))
        ) || voices.find(v => v.lang.startsWith('en'));

        if (maleVoice) {
          utterance.voice = maleVoice;
        }

        utterance.onstart = () => {
          setIsSpeaking(true);
          // Safety fallback: if no boundary event fires in 650ms, unlock typing speed completely
          setTimeout(() => {
            if (!hasBoundaryFired.current) {
              speechCharIdxRef.current = currentLine.display.length;
            }
          }, 650);
        };
        
        // Listen to word boundaries spoken by browser voice
        utterance.onboundary = (event) => {
          if (event.name === 'word') {
            hasBoundaryFired.current = true;
            speechCharIdxRef.current = event.charIndex;
          }
        };

        const handleEnd = () => {
          setIsSpeaking(false);
          speechEndedRef.current = true;
          speechCharIdxRef.current = currentLine.display.length; // Ensure all typed
          checkLineProgress();
        };

        utterance.onend = handleEnd;
        utterance.onerror = (e) => {
          console.warn("Speech Synthesis error on line:", e);
          handleEnd();
        };

        window.speechSynthesis.speak(utterance);
      } else {
        speechEndedRef.current = true;
        speechCharIdxRef.current = currentLine.display.length;
      }

      // 2. Type Characters for current line (gated by spoken index)
      charIdx = 0;
      const typeChar = () => {
        const lineIdxActive = lineIdxRef.current;
        if (lineIdxActive !== lineIdx) return; // Prevent overlap on double calls

        const allowedIndex = speechCharIdxRef.current + 12; // increased buffer ahead
        if (charIdx < currentLine.display.length) {
          if (charIdx <= allowedIndex || !('speechSynthesis' in window)) {
            currentString += currentLine.display[charIdx];
            setText(currentString);
            charIdx++;
            interval = setTimeout(typeChar, 16); // snappier typing
          } else {
            // Wait for speech to catch up
            interval = setTimeout(typeChar, 25);
          }
        } else {
          currentString += '\n';
          setText(currentString);
          typingEndedRef.current = true;
          checkLineProgress();
        }
      };

      typeChar();
    };

    const checkLineProgress = () => {
      if (speechEndedRef.current && typingEndedRef.current) {
        setTimeout(() => {
          lineIdxRef.current += 1;
          speakAndTypeLine();
        }, 250); // shortened delay between sentences
      }
    };

    // Autoplay policy bypass gesture handler
    const handleGesture = () => {
      if (initialized.current) return;
      initialized.current = true;
      setText(""); // clear prompt
      speakAndTypeLine();
    };

    window.addEventListener('click', handleGesture);
    window.addEventListener('keydown', handleGesture);

    return () => {
      clearTimeout(interval);
      window.removeEventListener('click', handleGesture);
      window.removeEventListener('keydown', handleGesture);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return { text, isDone, isSpeaking };
}
