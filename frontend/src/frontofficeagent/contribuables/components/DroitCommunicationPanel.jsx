import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { getDroitsCommunication, getErrorMessage } from '../../../api/api';

const STATUTS = {
  demande: { label: 'Demande', badge: 'badge surveillance' },
  reponse: { label: 'Réponse reçue', badge: 'badge conforme' },
  partiel: { label: 'Réponse partielle', badge: 'badge surveillance' },
  relance: { label: 'Relance émise', badge: 'badge critique' },
  sans_suite: { label: 'Sans suite', badge: 'badge critique' },
};

const TYPE_TIER_LABELS = {
  banque: 'Banque',
  assurance: 'Assurance',
  administration: 'Administration',
  notaire: 'Notaire',
  fournisseur: 'Fournisseur',
  client: 'Client',
  autre: 'Autre',
};

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('fr-FR');
}

export default function DroitCommunicationPanel({ id }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');

      try {
        const result = await getDroitsCommunication({ id_contribuable: id, limit: 100 });
        if (!cancelled) setRows(result?.data || []);
      } catch (requestError) {
        if (!cancelled) setError(getErrorMessage(requestError));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <>
      <div className="register-toolbar">
        <Link
          className="primary add-declaration-button"
          to={`/contribuables/${id}/droits-communication/nouveau`}
        >
          + Enregistrer un droit de communication
        </Link>
        <Link className="add-declaration-button" to={`/contribuables/${id}/confrontation`}>
          ⚖️ Retour à la confrontation
        </Link>
        <span>{rows.length} droit(s) de communication</span>
      </div>

      {loading && <p className="status">Chargement des droits de communication…</p>}
      {error && (
        <p className="error form-submit-message" role="alert">{error}</p>
      )}

      {!loading && !error && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date de demande</th>
                <th>Tiers</th>
                <th>Type de tiers</th>
                <th>Objet</th>
                <th>Statut</th>
                <th>Date de réponse</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const statut = STATUTS[row.statut] || { label: row.statut, badge: 'badge' };

                return (
                  <tr key={row.id_droit}>
                    <td><strong>{formatDate(row.date_demande)}</strong></td>
                    <td>{row.tier}</td>
                    <td>{TYPE_TIER_LABELS[row.type_tier] || row.type_tier || '—'}</td>
                    <td>{row.objet}</td>
                    <td><span className={statut.badge}>{statut.label}</span></td>
                    <td>{formatDate(row.date_reponse)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && (
            <p className="empty">Aucun droit de communication enregistré pour ce contribuable.</p>
          )}
        </div>
      )}
    </>
  );
}
