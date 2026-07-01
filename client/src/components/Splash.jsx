import { useEffect, useState } from 'react';

const KIBI = `${import.meta.env.BASE_URL}kibi.svg`;

// Entrada espectacular: Kibi aparece sobre un fondo oscuro con resplandor rojo
// y rayos de luz girando, luego el splash se desvanece hacia el dashboard.
export default function Splash() {
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);

  const dismiss = () => {
    setLeaving(true);
    setTimeout(() => setGone(true), 550);
  };

  useEffect(() => {
    const t = setTimeout(dismiss, 2600);
    return () => clearTimeout(t);
  }, []);

  if (gone) return null;

  return (
    <div
      className={`splash${leaving ? ' splash-out' : ''}`}
      onClick={dismiss}
      role="button"
      aria-label="Entrar"
    >
      <div className="splash-rays" aria-hidden="true" />
      <div className="splash-inner">
        <img className="splash-kibi" src={KIBI} alt="Kibi" />
        <h1 className="splash-name">Kibi</h1>
        <p className="splash-tag">Inteligencia · DIT UPAEP</p>
      </div>
    </div>
  );
}
