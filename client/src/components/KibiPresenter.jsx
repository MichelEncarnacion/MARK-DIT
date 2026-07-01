import { useEffect, useRef, useState } from 'react';

const KIBI = `${import.meta.env.BASE_URL}kibi.svg`;

const CAT_LABEL = { news: 'Noticia', courses: 'Curso IA', edtech: 'Tech Educativa' };

function pickSpanishVoice(voices) {
  return (
    voices.find((v) => v.lang?.toLowerCase() === 'es-mx') ||
    voices.find((v) => v.lang?.toLowerCase().startsWith('es')) ||
    null
  );
}

// Kibi presenta y narra en voz alta las noticias del dia, una por una.
export default function KibiPresenter({ items }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const playingRef = useRef(false);
  const tokenRef = useRef(0);
  const voiceRef = useRef(null);

  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    if (!supported) return undefined;
    const load = () => {
      voiceRef.current = pickSpanishVoice(window.speechSynthesis.getVoices());
    };
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', load);
      window.speechSynthesis.cancel();
    };
  }, [supported]);

  const speakIndex = (i) => {
    if (!supported) return;
    const item = items[i];
    if (!item) return;
    const token = ++tokenRef.current;
    window.speechSynthesis.cancel();

    const u = new SpeechSynthesisUtterance(`${CAT_LABEL[item.category] || ''}. ${item.title}. ${item.summary}`);
    u.lang = 'es-MX';
    u.rate = 1;
    u.pitch = 1;
    if (voiceRef.current) u.voice = voiceRef.current;
    u.onend = () => {
      if (tokenRef.current !== token || !playingRef.current) return;
      if (i < items.length - 1) {
        setIndex(i + 1);
        speakIndex(i + 1);
      } else {
        playingRef.current = false;
        setPlaying(false);
      }
    };
    u.onerror = () => {
      if (tokenRef.current !== token) return;
      playingRef.current = false;
      setPlaying(false);
    };
    window.speechSynthesis.speak(u);
  };

  const play = () => {
    playingRef.current = true;
    setPlaying(true);
    speakIndex(index);
  };

  const pause = () => {
    playingRef.current = false;
    setPlaying(false);
    if (supported) window.speechSynthesis.cancel();
  };

  const go = (delta) => {
    if (!items.length) return;
    const next = (index + delta + items.length) % items.length;
    setIndex(next);
    if (playingRef.current) speakIndex(next);
  };

  if (!items.length) {
    return (
      <div className="presenter">
        <div className="kibi-wrap">
          <img className="kibi-figure" src={KIBI} alt="Kibi" />
        </div>
        <div className="present-panel">
          <h2>Ando juntando las noticias del día…</h2>
          <p>Dame un momento y vuelve. Aquí te las voy a contar yo mismo. 🤖</p>
        </div>
      </div>
    );
  }

  const current = items[index];

  return (
    <div className="presenter">
      <div className="kibi-wrap">
        <img className={`kibi-figure${playing ? ' talking' : ''}`} src={KIBI} alt="Kibi" />
        <div className="kibi-shadow" />
      </div>

      <div className="present-side">
        <div className="present-panel" aria-live="polite">
          <span className={`card-tag ${current.category}`}>{CAT_LABEL[current.category] || current.category}</span>
          <h2>{current.title}</h2>
          <p>{current.summary}</p>
          <div className="present-foot">
            <span>{current.source}</span>
            {current.link && (
              <a href={current.link} target="_blank" rel="noreferrer">Leer la fuente ↗</a>
            )}
          </div>
        </div>

        <div className="present-controls">
          <button className="nav-btn" onClick={() => go(-1)} aria-label="Anterior">‹</button>
          {supported ? (
            <button className="play-btn" onClick={playing ? pause : play}>
              {playing ? '⏸ Pausar' : '▶ Escuchar noticias del día'}
            </button>
          ) : (
            <span className="play-note">Navega las noticias con ‹ ›</span>
          )}
          <button className="nav-btn" onClick={() => go(1)} aria-label="Siguiente">›</button>
        </div>

        <p className="present-progress">
          {index + 1} / {items.length}
          {supported && <span className="present-hint"> · Kibi las lee en voz alta</span>}
        </p>
      </div>
    </div>
  );
}
