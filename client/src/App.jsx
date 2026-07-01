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
    // Se intenta primero el API en vivo (contenido fresco cuando corre el
    // servidor Node) y, si no responde, el feed.json estatico incluido en el
    // build. Asi la app muestra contenido aunque Lienzo solo sirva archivos
    // estaticos y no ejecute server.js. Ambas URLs son relativas al documento
    // para funcionar desde un subdirectorio (.../mark-dit/).
    const load = async () => {
      const candidates = [
        new URL('api/feed', document.baseURI),
        new URL('feed.json', document.baseURI),
      ];
      for (const url of candidates) {
        try {
          const res = await fetch(url);
          if (!res.ok) continue;
          const data = await res.json();
          if (data && data.categories) {
            setFeed(data);
            return;
          }
        } catch {
          // intenta la siguiente fuente
        }
      }
      setError('No se pudo cargar el contenido. Intenta de nuevo más tarde.');
    };
    load();
  }, []);

  const categories = feed?.categories || { news: [], courses: [], edtech: [] };
  const updatedAt = feed?.updatedAt
    ? new Date(feed.updatedAt).toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' })
    : null;

  const totals = {
    news: categories.news.length,
    courses: categories.courses.length,
    edtech: categories.edtech.length,
  };

  return (
    <div className="app">
      <Hero
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        totals={totals}
      />

      <div className="status-bar">
        <span>{updatedAt ? `Última actualización: ${updatedAt}` : 'Cargando última actualización…'}</span>
      </div>

      {error && <div className="error-state">{error}</div>}

      {!error && (
        <>
          <Section
            title="Noticias"
            intro="Lo más relevante en tecnología e IA, sin el ruido."
            items={categories.news}
          />
          <Section
            title="Cursos IA"
            intro="Para aprender a usar IA gratis — con prioridad en lo oficial de Anthropic."
            items={categories.courses}
          />
          <Section
            title="Tech Educativa"
            intro="Herramientas y tendencias que le sirven directo a la Red SPES."
            items={categories.edtech}
          />
        </>
      )}

      <footer className="app-footer">
        MARK-DIT · Dirección de Innovación Tecnológica · Red SPES
      </footer>
    </div>
  );
}
