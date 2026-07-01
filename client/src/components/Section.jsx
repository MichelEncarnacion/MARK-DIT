import Card from './Card';

export default function Section({ title, items }) {
  return (
    <section className="category">
      <div className="category-header">
        <h2>{title}</h2>
        <span className="category-count">{items.length} {items.length === 1 ? 'ítem' : 'ítems'}</span>
      </div>
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
