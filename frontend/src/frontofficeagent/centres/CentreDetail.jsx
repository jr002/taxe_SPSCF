import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getCentreById, getContribuables, getErrorMessage } from '../../api/api';

export default function CentreDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [centre, setCentre] = useState(null);
  const [contribuables, setContribuables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadCentre = async () => {
      setLoading(true);
      setError('');
      try {
        const [centreResult, contribuablesResult] = await Promise.all([
          getCentreById(id),
          getContribuables({ limit: 10000 }),
        ]);
        const allContribuables = contribuablesResult.data || contribuablesResult;
        setCentre(centreResult);
        setContribuables(
          allContribuables.filter((contribuable) => String(contribuable.id_centre) === String(id))
        );
      } catch (requestError) {
        setError(getErrorMessage(requestError));
      } finally {
        setLoading(false);
      }
    };

    loadCentre();
  }, [id]);

  if (loading) return <p className="page status">Chargement du centre...</p>;

  if (error || !centre) {
    return (
      <section className="page error">
        <h1>Centre indisponible</h1>
        <p>{error || 'Ce centre n’existe pas.'}</p>
        <Link className="primary detail-back" to="/register">Retour à la liste des centres</Link>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="page-heading">
        <p className="eyebrow">Détail du centre</p>
        <h1>{centre.nom_centre}</h1>
        <p>Contribuables rattachés à ce centre fiscal.</p>
      </div>

      <div className="result-card">
        <dl className="result-rows">
          <div className="result-row"><dt>Type</dt><dd>{centre.type_centre}</dd></div>
          <div className="result-row"><dt>Numéro</dt><dd>{centre.numero_centre}</dd></div>
          <div className="result-row"><dt>E-mail</dt><dd>{centre.email_centre || 'Non renseigné'}</dd></div>
          <div className="result-row"><dt>Téléphone</dt><dd>{centre.telephone_centre || 'Non renseigné'}</dd></div>
          <div className="result-row"><dt>Contribuables rattachés</dt><dd>{contribuables.length}</dd></div>
        </dl>
      </div>

      <div className="page-heading" style={{ marginTop: '2rem' }}>
        <h2>Contribuables du centre</h2>
      </div>

      <div className="table-wrap">
        <table className="register-table">
          <thead>
            <tr>
              <th>Raison sociale</th>
              <th>NIF</th>
              <th>Secteur d’activité</th>
              <th>E-mail</th>
            </tr>
          </thead>
          <tbody>
            {contribuables.map((contribuable) => (
              <tr
                key={contribuable.id_contribuable}
                className="clickable-row"
                onClick={() => navigate(`/contribuables/${contribuable.id_contribuable}`, {
                  state: { contribuable },
                })}
                title="Voir la fiche du contribuable"
              >
                <td><strong>{contribuable.raison_sociale}</strong></td>
                <td>{contribuable.nif}</td>
                <td>{contribuable.secteur_activite || '—'}</td>
                <td>{contribuable.email || '—'}</td>
              </tr>
            ))}
            {!contribuables.length && (
              <tr><td colSpan="4" className="empty">Aucun contribuable n’est rattaché à ce centre.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="home-footer-note" style={{ marginTop: '2rem' }}>
        <Link className="detail-close" to="/register" title="Retourner à la liste des centres">←</Link>
        <p><strong>Retourner</strong> à la liste des centres</p>
      </div>
    </section>
  );
}
