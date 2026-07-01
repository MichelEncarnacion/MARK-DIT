import { useEffect, useState } from 'react';
import Hero from './components/Hero';
import Section from './components/Section';

function getInitialTheme() {
  if (typeof window === 'undefined') return 'light';
  const saved = window.localStorage.getItem('mark-dit-theme');
  if (saved) return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function App() {
  const [theme, setTheme] = useState(getInitialTheme);
  const [feed, setFeed] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem('mark-dit-theme', theme);
  }, [theme]);

  useEffect(() => {
    // URL relativa al documento actual, para que apunte a
    // .../mark-dit/api/feed y no a la raiz del dominio cuando la app
    // se sirve desde un subdirectorio.
    const feedUrl = new URL('api/feed', document.baseURI);
    fetch(feedUrl)
      .then((res) => res.json())
      .then(setFeed)
      .catch(() => setError('No se pudo cargar el contenido. Intenta de nuevo más tarde.'));
  }, []);

  const categories = feed?.categories || { news: [], courses: [], edtech: [] };
  const updatedAt = feed?.updatedAt
    ? new Date(feed.updatedAt).toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' })
    : null;

  return (
    <div className="app">
      <Hero theme={theme} onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))} />

      <div className="status-bar">
        <span>{updatedAt ? `Última actualización: ${updatedAt}` : 'Cargando última actualización…'}</span>
      </div>

      {error && <div className="error-state">{error}</div>}

      {!error && (
        <>
          <Section title="Noticias" items={categories.news} />
          <Section title="Cursos IA" items={categories.courses} />
          <Section title="Tech Educativa" items={categories.edtech} />
        </>
      )}

      <footer className="app-footer">
        MARK-DIT · Dirección de Innovación Tecnológica · Red SPES
      </footer>
    </div>
  );
}
