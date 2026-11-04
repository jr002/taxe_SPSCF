import { formatAriary } from '@/utils';

/**
 * Carte récapitulative affichant le résultat du contrôle fiscal et les détails calculés.
 * `children` accueille, sous les lignes de calcul, les puces de référence légale du
 * simulateur (composant `RefLegal`) : le formulaire reste seul juge de ce qu'il affiche.
 */
export default function ControlResult({
  title = 'Résultat du contrôle',
  message = '',
  alert = false,
  rows = [],
  children = null,
}) {
  return (
    <aside className={`result-card ${alert ? 'alert' : 'success'}`} role="status">
      <div className="result-header">
        <span className={`status-indicator ${alert ? 'alert-dot' : 'success-dot'}`} aria-hidden="true" />
        <div>
          <h3>{title}</h3>
          <p className="sr-only">{alert ? 'Anomalie détectée par le contrôle.' : 'Contrôle conforme, aucune anomalie détectée.'}</p>
          {message && <p className="result-message">{message}</p>}
        </div>
      </div>

      {rows.length > 0 && (
        <dl className="result-rows">
          {rows.map(([label, value], index) => {
            const isMonetary = typeof value === 'number';
            const displayValue = isMonetary ? formatAriary(value) : value;

            return (
              <div className="result-row" key={index}>
                <dt>{label}</dt>
                <dd className={isMonetary ? 'monetary-val' : ''}>{displayValue}</dd>
              </div>
            );
          })}
        </dl>
      )}

      {children && <div className="procedure-tags result-references">{children}</div>}
    </aside>
  );
}
