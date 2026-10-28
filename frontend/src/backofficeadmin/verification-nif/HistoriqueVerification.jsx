import { formatDateHeure } from './verification.utils';

/**
 * Liste des trois dernières opérations d'un type de vérification, stockées dans
 * `localStorage` par `pushHistorique`.
 */
export default function HistoriqueVerification({ entries, emptyLabel }) {
  return (
    <div className="panel" style={{ marginTop: '1.5rem' }}>
      <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.05rem' }}>Trois dernières vérifications</h2>

      {entries.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: '190px' }}>Date & heure</th>
                <th>Opération</th>
                <th style={{ width: '150px' }}>Résultat</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => (
                <tr key={`${entry.date}-${index}`} className="admin-row">
                  <td>
                    <small style={{ fontWeight: 600 }}>{formatDateHeure(entry.date)}</small>
                  </td>
                  <td>
                    <strong>{entry.label}</strong>
                    {entry.detail && (
                      <small style={{ display: 'block', color: 'var(--text-muted, #666)' }}>{entry.detail}</small>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${entry.reussi ? 'conforme' : 'critique'}`}>
                      {entry.reussi ? 'Réussi' : 'Échec'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="status">{emptyLabel}</p>
      )}
    </div>
  );
}
