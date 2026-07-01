import ThemeToggle from './ThemeToggle';

const TODAY = new Date().toLocaleDateString('es-MX', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

// La ruta del mascota es relativa (BASE_URL) para funcionar desde un subdirectorio.
const MASCOT = `${import.meta.env.BASE_URL}mark-dit.svg`;

export default function Hero({ theme, onToggleTheme, totals }) {
  const { news = 0, courses = 0, edtech = 0 } = totals || {};
  const hayContenido = news + courses + edtech > 0;

  return (
    <header className="hero">
      <div className="hero-toolbar">
        <span className="hero-brand">MARK-DIT · DIT Red SPES</span>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>

      <div className="hero-stage">
        <div className="mascot">
          <img src={MASCOT} alt="MARK-DIT, tu asistente tech" />
        </div>

        <div className="speech" role="status">
          <p className="speech-hi">¡Hola! Soy <strong>MARK-DIT</strong> <span aria-hidden="true">🤖</span></p>
          <p className="speech-body">
            {hayContenido ? (
              <>
                Hoy te traigo <b>{news}</b> noticias tech, <b>{courses}</b> cursos de IA
                {' '}y <b>{edtech}</b> novedades para la Red SPES. Aquí lo que de verdad importa
                {' '}para la educación y el DIT <span aria-hidden="true">👇</span>
              </>
            ) : (
              <>Ando juntando lo mejor de tecnología, IA y educación para ti. Dame un momento y vuelve <span aria-hidden="true">👇</span></>
            )}
          </p>
          <span className="speech-date">{TODAY}</span>
        </div>
      </div>
    </header>
  );
}
