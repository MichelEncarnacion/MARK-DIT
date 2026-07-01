import Card from './Card';
import { useSpeech } from '../context/SpeechContext';

export default function Section({ title, intro, items }) {
  const { isSupported, speakingId, speak } = useSpeech();
  const sectionId = `section:${title}`;
  const isSpeakingSection = speakingId === sectionId;

  const speakSection = () => {
    const texts = items.map((item) => `${item.title}. ${item.summary}`);
    speak(sectionId, texts);
  };

  return (
    <section className="category">
      <div className="category-header">
        <h2>{title}</h2>
        <span className="category-count">{items.length} {items.length === 1 ? 'ítem' : 'ítems'}</span>
        {isSupported && items.length > 0 && (
          <button type="button" className="speak-section-btn" onClick={speakSection}>
            {isSpeakingSection ? '⏸ Detener' : '🔊 Leer sección'}
          </button>
        )}
      </div>
      {intro && <p className="category-intro">{intro}</p>}
      {items.length === 0 ? (
        <div className="empty-state">Todavía no hay contenido en esta sección. Vuelve más tarde.</div>
      ) : (
        <div className="card-grid">
          {items.map((item) => (
            <Card key={item.link} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
