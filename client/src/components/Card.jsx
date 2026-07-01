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
  return (
    <article className="card">
      <span className={`card-tag ${item.category}`}>{CATEGORY_LABEL[item.category] || item.category}</span>
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
