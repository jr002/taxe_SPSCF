import { Fragment, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import {
  deleteAgent,
  getAgents,
  getErrorMessage,
  resetAgentPassword,
  updateAgentRole,
  updateAgentStatut,
} from '../api/api';
import HistoriqueUtilisateurs from './HistoriqueUtilisateurs';

/** Statut d'un compte : libellé, pastille et couleur de ligne. */
const STATUTS = {
  actif: { label: 'Actif', badge: 'conforme', ligne: 'row-conforme' },
  en_attente: { label: 'En attente', badge: 'surveillance', ligne: 'row-surveillance' },
  inactif: { label: 'Bloqué', badge: 'critique', ligne: 'row-critique' },
};

const FILTRES = [
  ['Tous', 'Tous'],
  ['en_attente', 'En attente'],
  ['actif', 'Actifs'],
  ['inactif', 'Bloqués'],
];

const ACTION_BUTTON =
  'inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-bold rounded-lg border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
const BLUE_BUTTON = `${ACTION_BUTTON} text-blue-700 bg-blue-50 border-blue-300 hover:bg-blue-100`;
const GREEN_BUTTON = `${ACTION_BUTTON} text-emerald-700 bg-emerald-50 border-emerald-300 hover:bg-emerald-100`;
const AMBER_BUTTON = `${ACTION_BUTTON} text-amber-700 bg-amber-50 border-amber-300 hover:bg-amber-100`;
const RED_BUTTON = `${ACTION_BUTTON} text-red-700 bg-red-50 border-red-300 hover:bg-red-100`;

const getStatut = (statut) =>
  STATUTS[statut] || { label: statut || 'Inconnu', badge: 'surveillance', ligne: '' };

const formatDate = (value) => (value ? new Date(value).toLocaleDateString('fr-FR') : '—');

/**
 * Page d'administration des comptes agents (`/admin`).
 *
 * Espace dédié à la gestion des utilisateurs : activer une demande
 * d'inscription (statut `en_attente`), bloquer un compte pour refuser sa
 * connexion, le réactiver, changer son rôle, réinitialiser son mot de passe ou
 * le supprimer. L'accès est réservé aux administrateurs : le `Header` ne leur
 * présente que ce module et l'API répond `403` à tout autre rôle.
 */
export default function Admin({ currentUser }) {
  const location = useLocation();
  const isAdmin = currentUser?.role === 'admin';
  const currentUserId = currentUser?.id;

  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(Boolean(isAdmin));
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [filter, setFilter] = useState('');
  const [statutFilter, setStatutFilter] = useState(location.state?.statut || 'Tous');
  const [activeMainTab, setActiveMainTab] = useState('utilisateurs');
  const [passwordTarget, setPasswordTarget] = useState(null);
  const [passwordValue, setPasswordValue] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

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

  const reloadAgents = async () => {
    const result = await getAgents();
    setAgents(Array.isArray(result) ? result : []);
  };

  const handleRefresh = async () => {
    setLoading(true);
    setError('');

    try {
      await reloadAgents();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  const counts = useMemo(
    () =>
      agents.reduce((accumulator, agent) => {
        const key = agent.statut || 'inconnu';
        accumulator[key] = (accumulator[key] || 0) + 1;
        return accumulator;
      }, {}),
    [agents],
  );

  const visibleAgents = useMemo(() => {
    const normalizedFilter = filter.trim().toLowerCase();

    return agents.filter((agent) => {
      if (statutFilter !== 'Tous' && agent.statut !== statutFilter) return false;
      if (!normalizedFilter) return true;

      return [agent.nom, agent.prenom, agent.email, agent.role].some((value) =>
        String(value || '').toLowerCase().includes(normalizedFilter),
      );
    });
  }, [agents, filter, statutFilter]);

  const isSelf = (agent) => String(agent.id_agent) === String(currentUserId);

  const runAction = async (agent, action, successMessage) => {
    setBusyId(agent.id_agent);
    setError('');
    setSuccess('');

    try {
      await action();
      setSuccess(successMessage);
      await reloadAgents();
      return true;
    } catch (actionError) {
      setError(getErrorMessage(actionError));
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const toggleStatut = (agent) => {
    const nextStatut = agent.statut === 'actif' ? 'inactif' : 'actif';

    return runAction(
      agent,
      () => updateAgentStatut(agent.id_agent, nextStatut),
      nextStatut === 'actif'
        ? `Le compte ${agent.email} est activé : l'agent peut se connecter.`
        : `Le compte ${agent.email} est bloqué : la connexion est refusée.`,
    );
  };

  const changeRole = (agent, role) => {
    if (role === agent.role) return undefined;

    return runAction(
      agent,
      () => updateAgentRole(agent.id_agent, role),
      `Rôle de ${agent.email} mis à jour : ${
        role === 'admin' ? 'administrateur' : 'agent'
      }.`,
    );
  };

  const openPasswordForm = (agent) => {
    setPasswordTarget(agent.id_agent);
    setPasswordValue('');
    setDeleteTarget(null);
    setError('');
    setSuccess('');
  };

  const closePasswordForm = () => {
    setPasswordTarget(null);
    setPasswordValue('');
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    const agent = agents.find((item) => item.id_agent === passwordTarget);
    if (!agent) return;

    const done = await runAction(
      agent,
      () => resetAgentPassword(agent.id_agent, passwordValue),
      `Mot de passe de ${agent.email} réinitialisé.`,
    );

    if (done) closePasswordForm();
  };

  const confirmDelete = async (agent) => {
    const done = await runAction(
      agent,
      () => deleteAgent(agent.id_agent),
      `Le compte ${agent.email} a été supprimé.`,
    );

    if (done) setDeleteTarget(null);
  };

  if (!isAdmin) {
    return (
      <section className="page">
        <div className="page-heading">
          <p className="eyebrow">Administration</p>
          <h1>Utilisateurs</h1>
        </div>
        <p className="error">
          Cette page est réservée aux administrateurs. Connectez-vous avec un compte
          administrateur pour gérer les utilisateurs.
        </p>
      </section>
    );
  }

  return (
    <section className="page">
      <Link className="detail-back-link" to="/admin">
        ← Retour au tableau de bord
      </Link>

      <div className="page-heading">
        <p className="eyebrow">Administration</p>
        <h1>Gestion des Utilisateurs & Audit</h1>
        <p>
          Gérez les comptes d'accès, les statuts et les rôles, et consultez l'historique complet des modifications administratives.
        </p>
      </div>

      <div className="admin-main-tabs" style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color, #e5e7eb)', paddingBottom: '0.5rem' }}>
        <button
          type="button"
          onClick={() => setActiveMainTab('utilisateurs')}
          className={`categorie-tab${activeMainTab === 'utilisateurs' ? ' active' : ''}`}
          style={{ fontSize: '0.95rem', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: activeMainTab === 'utilisateurs' ? 700 : 500 }}
        >
          👥 Utilisateurs & Comptes ({agents.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveMainTab('historique')}
          className={`categorie-tab${activeMainTab === 'historique' ? ' active' : ''}`}
          style={{ fontSize: '0.95rem', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: activeMainTab === 'historique' ? 700 : 500 }}
        >
          📋 Historique & Journal des Modifications
        </button>
      </div>

      {activeMainTab === 'historique' ? (
        <HistoriqueUtilisateurs />
      ) : (
        <>
          <div className="categorie-tabs">
            {FILTRES.map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`categorie-tab${statutFilter === value ? ' active' : ''}`}
                onClick={() => setStatutFilter(value)}
              >
                {value === 'Tous' ? `Tous (${agents.length})` : `${label} (${counts[value] || 0})`}
              </button>
            ))}
          </div>

      <div className="datatable-toolbar contribuables-toolbar flex-wrap gap-2">
        <input
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Rechercher par nom, prénom, e-mail ou rôle..."
        />
        <span>{visibleAgents.length} utilisateur(s)</span>
        <button type="button" onClick={handleRefresh} disabled={loading}>
          Actualiser
        </button>
      </div>

      {error && <p className="error">{error}</p>}
      {success && (
        <p className="success form-submit-message" role="status">
          {success}
        </p>
      )}

      {loading ? (
        <p className="status">Chargement des utilisateurs...</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Rôle</th>
                <th>Statut</th>
                <th>Créé le</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleAgents.map((agent) => {
                const statut = getStatut(agent.statut);
                const self = isSelf(agent);
                const busy = busyId === agent.id_agent;

                return (
                  <Fragment key={agent.id_agent}>
                    <tr className={`admin-row ${statut.ligne}`}>
                      <td>
                        <strong>
                          {agent.prenom} {agent.nom}
                        </strong>
                        <small>
                          {agent.email}
                          {self ? ' · votre compte' : ''}
                        </small>
                      </td>
                      <td>
                        <select
                          className="admin-role-select"
                          value={agent.role || 'agent'}
                          disabled={busy || self}
                          title={
                            self
                              ? 'Vous ne pouvez pas modifier votre propre rôle.'
                              : 'Changer le rôle de cet utilisateur'
                          }
                          onChange={(event) => changeRole(agent, event.target.value)}
                        >
                          <option value="agent">Agent</option>
                          <option value="admin">Administrateur</option>
                        </select>
                      </td>
                      <td>
                        <span className={`badge ${statut.badge}`}>{statut.label}</span>
                      </td>
                      <td>{formatDate(agent.date_creation)}</td>
                      <td>
                        <div className="admin-actions">
                          <button
                            type="button"
                            className={agent.statut === 'actif' ? AMBER_BUTTON : GREEN_BUTTON}
                            disabled={busy || self}
                            title={
                              self
                                ? 'Vous ne pouvez pas modifier le statut de votre propre compte.'
                                : agent.statut === 'actif'
                                  ? 'Bloquer ce compte : la connexion sera refusée'
                                  : 'Activer ce compte : la connexion sera autorisée'
                            }
                            onClick={() => toggleStatut(agent)}
                          >
                            {agent.statut === 'actif' ? '🚫 Bloquer' : '✓ Activer'}
                          </button>
                          <button
                            type="button"
                            className={BLUE_BUTTON}
                            disabled={busy}
                            title="Définir un nouveau mot de passe pour cet utilisateur"
                            onClick={() => openPasswordForm(agent)}
                          >
                            🔑 Mot de passe
                          </button>
                          <button
                            type="button"
                            className={RED_BUTTON}
                            disabled={busy || self}
                            title={
                              self
                                ? 'Vous ne pouvez pas supprimer votre propre compte.'
                                : 'Supprimer définitivement ce compte'
                            }
                            onClick={() => {
                              setDeleteTarget(agent.id_agent);
                              setPasswordTarget(null);
                            }}
                          >
                            🗑 Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>

                    {passwordTarget === agent.id_agent && (
                      <tr className="admin-inline-row">
                        <td colSpan={5}>
                          <form className="admin-inline-form" onSubmit={handlePasswordSubmit}>
                            <label className="field">
                              <span>Nouveau mot de passe pour {agent.email}</span>
                              <input
                                type="password"
                                value={passwordValue}
                                minLength={4}
                                required
                                autoComplete="new-password"
                                placeholder="4 caractères minimum"
                                onChange={(event) => setPasswordValue(event.target.value)}
                              />
                            </label>
                            <div className="admin-inline-actions">
                              <button type="button" onClick={closePasswordForm}>
                                Annuler
                              </button>
                              <button className="primary" type="submit" disabled={busy}>
                                {busy ? 'Enregistrement...' : 'Enregistrer le mot de passe'}
                              </button>
                            </div>
                          </form>
                        </td>
                      </tr>
                    )}

                    {deleteTarget === agent.id_agent && (
                      <tr className="admin-inline-row">
                        <td colSpan={5}>
                          <div className="admin-inline-form admin-inline-danger">
                            <p>
                              Supprimer définitivement le compte{' '}
                              <strong>{agent.email}</strong> ? Le contrôle et les relances
                              qu'il a réalisés seront conservés, mais dissociés de ce compte.
                            </p>
                            <div className="admin-inline-actions">
                              <button type="button" onClick={() => setDeleteTarget(null)}>
                                Annuler
                              </button>
                              <button
                                type="button"
                                className="admin-danger-button"
                                disabled={busy}
                                onClick={() => confirmDelete(agent)}
                              >
                                {busy ? 'Suppression...' : 'Oui, supprimer ce compte'}
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}

              {!visibleAgents.length && (
                <tr>
                  <td colSpan="5" className="empty">
                    {agents.length
                      ? 'Aucun utilisateur ne correspond à cette recherche.'
                      : 'Aucun utilisateur enregistré.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      </>
      )}
    </section>
  );
}
