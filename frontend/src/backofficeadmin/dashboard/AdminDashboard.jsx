import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { getAgents, getErrorMessage } from '@/api/api';
import Pagination from '@/components/common/Pagination';
import { useTablePagination } from '@/hooks/useTablePagination';
import AdminNav from '@/backofficeadmin/components/AdminNav';
import CamembertUtilisateurs from './CamembertUtilisateurs';

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
      [...agents].sort(
        (first, second) =>
          formatDateValue(second.date_creation) - formatDateValue(first.date_creation),
      ),
    [agents],
  );

  const comptes = useTablePagination(derniersComptes, 10);

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
      <AdminNav />

      <div className="page-heading">
        <p className="eyebrow">Backoffice Administration</p>
        <h1>Tableau de bord & Répartition</h1>
        <p>
          Bonjour {currentUser?.prenom || currentUser?.nom || 'administrateur'} · Synthèse globale et répartition visuelle en camembert des comptes utilisateurs.
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
              <h2>Répartition des utilisateurs</h2>
              <CamembertUtilisateurs stats={stats} agents={agents} />
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
                      {comptes.pageItems.map((agent) => (
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
              <Pagination
                currentPage={comptes.currentPage}
                onPageChange={comptes.setCurrentPage}
                totalPages={comptes.totalPages}
              />
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
