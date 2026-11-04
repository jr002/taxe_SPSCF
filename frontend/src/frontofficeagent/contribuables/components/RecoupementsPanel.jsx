import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { getErrorMessage, getRecoupements } from '@/api';
import { AideTerme } from '@/frontofficeagent/aide';
import { formatAriary } from '@/utils';

const SOURCE_LABELS = {
  tiers_declarant: 'Tiers déclarant',
  banque: 'Banque',
  fournisseur: 'Fournisseur',
  client: 'Client',
  administration: 'Administration',
  assurance: 'Assurance',
  notaire: 'Notaire',
  autre: 'Autre',
};

const OPERATION_LABELS = {
  vente: 'Vente',
  achat: 'Achat',
  service: 'Service',
  autre: 'Autre',
};

export default function RecoupementsPanel({ id }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');

      try {
        const result = await getRecoupements({ id_contribuable: id, limit: 100 });
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
          to={`/contribuables/${id}/recoupements/nouveau`}
        >
          + Enregistrer un recoupement
        </Link>
        <Link className="add-declaration-button" to={`/contribuables/${id}/confrontation`}>
          ⚖️ Retour à la confrontation
        </Link>
        <span>{rows.length} recoupement(s)</span>
      </div>

      {loading && <p className="status" role="status">Chargement des recoupements…</p>}
      {error && (
        <p className="error form-submit-message" role="alert">{error}</p>
      )}

      {!loading && !error && (
        <>
          <p className="aide-ecran-intro">
            <AideTerme id="recoupement">Recoupements</AideTerme> : ce que des tiers (banques,
            fournisseurs, clients, administrations) ont déclaré à votre sujet. Ces montants ne sont
            pas des impositions — c'est la <AideTerme id="confrontation">confrontation</AideTerme>{' '}
            qui les compare aux déclarations.
          </p>
          <div className="table-wrap">
            <table aria-label="Recoupements du contribuable">
              <thead>
                <tr>
                  <th>Période</th>
                  <th>Source</th>
                  <th>Type d’opération</th>
                  <th><AideTerme id="nif_tiers">NIF du tiers</AideTerme></th>
                  <th>Montant déclaré</th>
                  <th>Montant TVA</th>
                  <th><AideTerme id="rapprochement">Somme recoupée</AideTerme></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id_recoupement}>
                    <td><strong>{row.periode || '—'}</strong></td>
                    <td>{SOURCE_LABELS[row.source] || row.source || '—'}</td>
                    <td>{OPERATION_LABELS[row.type_operation] || row.type_operation || '—'}</td>
                    <td>{row.nif_tiers || '—'}</td>
                    <td>{formatAriary(row.montant_declare)}</td>
                    <td>{formatAriary(row.montant_tva)}</td>
                    <td><strong>{formatAriary(row.somme_recoupee)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && (
              <p className="empty">Aucun recoupement enregistré pour ce contribuable.</p>
            )}
          </div>
        </>
      )}
    </>
  );
}
