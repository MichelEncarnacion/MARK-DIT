import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const SpeechContext = createContext(null);

function pickSpanishVoice(voices) {
  return (
    voices.find((v) => v.lang?.toLowerCase() === 'es-mx') ||
    voices.find((v) => v.lang?.toLowerCase().startsWith('es')) ||
    null
  );
}

export function SpeechProvider({ children }) {
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const [speakingId, setSpeakingId] = useState(null);
  const voiceRef = useRef(null);

  useEffect(() => {
    if (!isSupported) return;
    const loadVoices = () => {
      voiceRef.current = pickSpanishVoice(window.speechSynthesis.getVoices());
    };
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, [isSupported]);

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setSpeakingId(null);
  }, [isSupported]);

  const speak = useCallback(
    (id, texts) => {
      if (!isSupported) return;
      window.speechSynthesis.cancel();

      if (speakingId === id) {
        setSpeakingId(null);
        return;
      }

      const queue = Array.isArray(texts) ? texts : [texts];
      queue.forEach((text, index) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-MX';
        utterance.rate = 1;
        utterance.pitch = 0.95;
        if (voiceRef.current) utterance.voice = voiceRef.current;
        if (index === queue.length - 1) {
          utterance.onend = () => setSpeakingId(null);
          utterance.onerror = () => setSpeakingId(null);
        }
        window.speechSynthesis.speak(utterance);
      });
      setSpeakingId(id);
    },
    [isSupported, speakingId]
  );

  useEffect(() => () => { if (isSupported) window.speechSynthesis.cancel(); }, [isSupported]);

  return (
    <SpeechContext.Provider value={{ isSupported, speakingId, speak, stop }}>
      {children}
    </SpeechContext.Provider>
  );
}

export function useSpeech() {
  const ctx = useContext(SpeechContext);
  if (!ctx) throw new Error('useSpeech debe usarse dentro de <SpeechProvider>');
  return ctx;
}
