import { useEffect, useState } from 'react';
import Splash from './components/Splash';
import KibiPresenter from './components/KibiPresenter';

const TODAY = new Date().toLocaleDateString('es-MX', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

// Orden en que Kibi narra: primero noticias, luego cursos, luego edtech.
const ORDER = ['news', 'courses', 'edtech'];

export default function App() {
  const [feed, setFeed] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Escenario visual fijo (azul marino oscuro), sin selector de tema.
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  useEffect(() => {
    // Se intenta primero el API en vivo (contenido fresco cuando corre el
    // servidor Node) y, si no responde, el feed.json estatico incluido en el
    // build. Ambas URLs son relativas al documento para funcionar desde un
    // subdirectorio (.../mark-dit/).
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
  const items = ORDER.flatMap((key) =>
    (categories[key] || []).map((item) => ({ ...item, category: key }))
  );

  return (
    <div className="stage">
      <Splash />

      <header className="stage-top">
        <span className="stage-brand">KIBI · Inteligencia · DIT UPAEP</span>
        <span className="stage-date">{TODAY}</span>
      </header>

      {error ? (
        <div className="error-state">{error}</div>
      ) : (
        <KibiPresenter items={items} />
      )}
    </div>
  );
}
