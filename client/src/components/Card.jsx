import { useSpeech } from '../context/SpeechContext';

const CATEGORY_LABEL = {
  news: 'Noticia',
  courses: 'Curso IA',
  edtech: 'Tech Educativa',
};

function formatDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}

export default function Card({ item }) {
  const date = formatDate(item.publishedAt);
  const { isSupported, speakingId, speak } = useSpeech();
  const isSpeaking = speakingId === item.link;

  return (
    <article className="card">
      <div className="card-top">
        <span className={`card-tag ${item.category}`}>{CATEGORY_LABEL[item.category] || item.category}</span>
        {isSupported && (
          <button
            type="button"
            className={`speak-btn${isSpeaking ? ' speaking' : ''}`}
            onClick={() => speak(item.link, `${item.title}. ${item.summary}`)}
            aria-label={isSpeaking ? 'Detener lectura' : 'Leer en voz alta'}
            title={isSpeaking ? 'Detener lectura' : 'Leer en voz alta'}
          >
            {isSpeaking ? '⏸' : '🔊'}
          </button>
        )}
      </div>
      <h3>{item.title}</h3>
      <p>{item.summary}</p>
      <div className="card-footer">
        <span>{item.source}{date ? ` · ${date}` : ''}</span>
        <a href={item.link} target="_blank" rel="noreferrer">
          Leer más →
        </a>
      </div>
    </article>
  );
}
