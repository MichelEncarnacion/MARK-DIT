import ThemeToggle from './ThemeToggle';

const TODAY = new Date().toLocaleDateString('es-MX', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

export default function Hero({ theme, onToggleTheme }) {
  return (
    <div className="hero">
      <div className="hero-top">
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
      <div className="hero-body">
        <h1 className="hero-name">MARK-DIT</h1>
        <p className="hero-tagline">
          El asistente tech de la Dirección de Innovación Tecnológica · Red SPES
        </p>
        <span className="hero-date">{TODAY}</span>
      </div>
    </div>
  );
}
