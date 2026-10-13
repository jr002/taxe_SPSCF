import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { getAgents, getErrorMessage } from '../api/api';

/** Statuts affichés dans la répartition, avec leur couleur. */
const STATUTS = [
  ['actif', 'Actifs', '#237a43'],
  ['en_attente', 'En attente', '#e0a92e'],
  ['inactif', 'Bloqués', '#b42318'],
];

const formatDate = (value) => (value ? new Date(value).toLocaleDateString('fr-FR') : '—');

const formatDateValue = (value) => (value ? new Date(value).getTime() : 0);

/**
 * Tableau de bord de l'espace administrateur (`/admin`).
 *
 * Synthèse des comptes agents : effectifs par statut et par rôle, derniers
 * comptes créés et accès rapide à la gestion des utilisateurs. Les données
 * proviennent de `GET /api/agents`, donc réservé au rôle `admin`.
 */
export default function AccueilAdmin({ currentUser }) {
  const isAdmin = currentUser?.role === 'admin';

  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(Boolean(isAdmin));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAdmin) return undefined;

    let isMounted = true;

    const load = async () => {
      try {
        const result = await getAgents();
        if (isMounted) setAgents(Array.isArray(result) ? result : []);
      } catch (requestError) {
        if (isMounted) setError(getErrorMessage(requestError));
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [isAdmin]);

  const stats = useMemo(() => {
    const parStatut = STATUTS.reduce((accumulator, [key]) => {
      accumulator[key] = agents.filter((agent) => agent.statut === key).length;
      return accumulator;
    }, {});

    return {
      total: agents.length,
      parStatut,
      administrateurs: agents.filter((agent) => agent.role === 'admin').length,
      agentsSimples: agents.filter((agent) => agent.role !== 'admin').length,
      enAttente: parStatut.en_attente || 0,
    };
  }, [agents]);

  const derniersComptes = useMemo(
    () =>
      [...agents]
        .sort((first, second) => formatDateValue(second.date_creation) - formatDateValue(first.date_creation))
        .slice(0, 5),
    [agents],
  );

  if (!isAdmin) {
    return (
      <section className="page">
        <div className="page-heading">
          <p className="eyebrow">Administration</p>
          <h1>Tableau de bord</h1>
        </div>
        <p className="error">
          Cet espace est réservé aux administrateurs. Connectez-vous avec un compte
          administrateur pour consulter le tableau de bord des utilisateurs.
        </p>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="page-heading">
        <p className="eyebrow">Administration</p>
        <h1>Tableau de bord</h1>
        <p>
          Bonjour {currentUser?.prenom || currentUser?.nom || 'administrateur'} · synthèse des
          comptes agents et accès rapide à leur gestion.
        </p>
      </div>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p className="status">Chargement du tableau de bord...</p>
      ) : (
        <>
          <div className="kpis">
            <article>
              <span>Comptes agents</span>
              <strong>{stats.total}</strong>
            </article>
            <article>
              <span>Comptes actifs</span>
              <strong style={{ color: '#237a43' }}>{stats.parStatut.actif || 0}</strong>
            </article>
            <article>
              <span>En attente d'activation</span>
              <strong style={{ color: stats.enAttente ? '#946200' : undefined }}>
                {stats.enAttente}
              </strong>
            </article>
            <article>
              <span>Comptes bloqués</span>
              <strong style={{ color: stats.parStatut.inactif ? '#b42318' : undefined }}>
                {stats.parStatut.inactif || 0}
              </strong>
            </article>
          </div>

          {stats.enAttente > 0 && (
            <p className="success form-submit-message" role="status">
              {stats.enAttente} demande(s) d'accès en attente d'activation —{' '}
              <Link to="/admin/utilisateurs">les traiter maintenant</Link>.
            </p>
          )}

          <div className="dashboard-grid" style={{ marginTop: '1.5rem' }}>
            <div className="panel">
              <h2>Répartition des comptes</h2>

              <div className="admin-repartition">
                {STATUTS.map(([key, label, couleur]) => {
                  const valeur = stats.parStatut[key] || 0;
                  const pourcentage = stats.total ? Math.round((valeur / stats.total) * 100) : 0;

                  return (
                    <div key={key} className="admin-repartition-ligne">
                      <div className="admin-repartition-entete">
                        <span>
                          <i className="admin-repartition-puce" style={{ background: couleur }} />
                          {label}
                        </span>
                        <strong>
                          {valeur} <small>({pourcentage} %)</small>
                        </strong>
                      </div>
                      <div className="admin-repartition-barre">
                        <span style={{ width: `${pourcentage}%`, background: couleur }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="declaration-summary" style={{ marginTop: '1.25rem', marginBottom: 0 }}>
                <div>
                  <span>Administrateurs</span>
                  <strong>{stats.administrateurs}</strong>
                </div>
                <div>
                  <span>Agents simples</span>
                  <strong>{stats.agentsSimples}</strong>
                </div>
              </div>
            </div>

            <div className="panel">
              <h2>Derniers comptes créés</h2>

              {derniersComptes.length ? (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Utilisateur</th>
                        <th>Statut</th>
                        <th>Créé le</th>
                      </tr>
                    </thead>
                    <tbody>
                      {derniersComptes.map((agent) => (
                        <tr key={agent.id_agent} className="admin-row">
                          <td>
                            <strong>
                              {agent.prenom} {agent.nom}
                            </strong>
                            <small>{agent.email}</small>
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                agent.statut === 'actif'
                                  ? 'conforme'
                                  : agent.statut === 'inactif'
                                    ? 'critique'
                                    : 'surveillance'
                              }`}
                            >
                              {agent.statut === 'actif'
                                ? 'Actif'
                                : agent.statut === 'inactif'
                                  ? 'Bloqué'
                                  : 'En attente'}
                            </span>
                          </td>
                          <td>{formatDate(agent.date_creation)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="status">Aucun compte enregistré pour le moment.</p>
              )}
            </div>
          </div>

          <div className="admin-dashboard-actions">
            <Link className="primary" to="/admin/utilisateurs">
              Gérer les utilisateurs
            </Link>
            <Link
              className="admin-secondary-button"
              to="/admin/utilisateurs"
              state={{ statut: 'en_attente' }}
            >
              Voir les demandes en attente
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
