import { formatAriary } from '@/utils/formatters';

/**
 * Carte récapitulative affichant le résultat du contrôle fiscal et les détails calculés
 */
export default function ControlResult({
  title = 'Résultat du contrôle',
  message = '',
  alert = false,
  rows = [],
}) {
  return (
    <aside className={`result-card ${alert ? 'alert' : 'success'}`}>
      <div className="result-header">
        <span className={`status-indicator ${alert ? 'alert-dot' : 'success-dot'}`} />
        <div>
          <h3>{title}</h3>
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
    </aside>
  );
}
