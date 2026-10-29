import { useEffect, useMemo, useState } from 'react';
import { getAgents, getCentres, getErrorMessage, updateAgentCentre, updateAgentRole } from '@/api';
import { ModaleConfirmation, Pagination } from '@/components/common';
import { useTablePagination } from '@/hooks';
import AdminNav from '@/backofficeadmin/components/AdminNav';
import {
  ROLES_AGENTS,
  centreResume,
  getRoleLabel,
  isCentreScoped,
  roleDefinition,
} from '@/backofficeadmin/utils/roles.utils';

export default function AdminRoles({ currentUser }) {
  const isAdmin = currentUser?.role === 'admin';
  const currentUserId = currentUser?.id;

  const [agents, setAgents] = useState([]);
  const [centres, setCentres] = useState([]);

  const [loading, setLoading] = useState(Boolean(isAdmin));
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [changementRole, setChangementRole] = useState(null);
  const [erreurChangementRole, setErreurChangementRole] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('TOUS');

  useEffect(() => {
    if (!isAdmin) return undefined;
    let isMounted = true;

    Promise.allSettled([getAgents(), getCentres()])
      .then(([agentsRes, centresRes]) => {
        if (!isMounted) return;
        if (agentsRes.status === 'fulfilled') {
          setAgents(Array.isArray(agentsRes.value) ? agentsRes.value : []);
        }
        if (centresRes.status === 'fulfilled') {
          setCentres(Array.isArray(centresRes.value) ? centresRes.value : []);
        }
      })
      .catch((err) => {
        if (isMounted) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isAdmin]);

  const refreshAgents = async () => {
    const updated = await getAgents();
    setAgents(Array.isArray(updated) ? updated : []);
  };

  const handleRoleChange = (agent, newRole) => {
    if (newRole === (agent.role || 'agent')) return;
    setChangementRole({ agent, newRole });
    setErreurChangementRole('');
    setError('');
    setSuccess('');
  };

  const confirmerChangementRole = async () => {
    if (!changementRole) return;
    const { agent, newRole } = changementRole;
    setBusyId(agent.id_agent);
    setErreurChangementRole('');

    try {
      await updateAgentRole(agent.id_agent, newRole);
      await refreshAgents();
      const message = `Le rôle de ${agent.email} a été mis à jour : ${getRoleLabel(newRole)}.`;
      setSuccess(
        isCentreScoped(newRole) && !agent.id_centre
          ? `${message} Attention : ce rôle consulte uniquement son centre, affectez-en un pour ouvrir l'accès aux dossiers.`
          : message
      );
      setChangementRole(null);
    } catch (err) {
      setErreurChangementRole(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleCentreChange = async (agent, idCentre) => {
    const nextValue = idCentre === '' ? null : Number(idCentre);
    if (nextValue === (agent.id_centre ?? null)) return;
    setBusyId(agent.id_agent);
    setError('');
    setSuccess('');

    try {
      const response = await updateAgentCentre(agent.id_agent, nextValue);
      await refreshAgents();
      setSuccess(response?.message || 'Centre de rattachement mis à jour.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const filteredAgents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return agents.filter((agent) => {
      if (roleFilter !== 'TOUS' && (agent.role || 'agent') !== roleFilter) return false;
      if (!q) return true;
      return [agent.nom, agent.prenom, agent.email, agent.role, agent.nom_centre].some((val) =>
        String(val || '').toLowerCase().includes(q)
      );
    });
  }, [agents, roleFilter, search]);

  const pages = useTablePagination(filteredAgents, 10);

  if (!isAdmin) {
    return (
      <section className="page">
        <p className="error">Cette page est réservée aux administrateurs.</p>
      </section>
    );
  }

  return (
    <section className="page">
      <AdminNav />

      <div className="page-heading">
        <p className="eyebrow">Backoffice Administration</p>
        <h1>Gestion des Rôles</h1>
        <p>
          Configurez les profils d'accès des agents et restreignez la consultation des dossiers contribuables selon leur centre fiscal de rattachement.
        </p>
      </div>

      {error && <p className="error">{error}</p>}
      {success && (
        <p className="success form-submit-message" role="status">
          {success}
        </p>
      )}

      {/* Matrice explicative des rôles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        {ROLES_AGENTS.map((def) => (
          <div
            key={def.role}
            className="panel"
            style={{ padding: '1rem', borderTop: `4px solid ${def.couleur}` }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>{def.label}</h3>
              <span className={`badge ${def.badge}`}>{def.role}</span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted, #666)', minHeight: '38px', margin: '0 0 0.5rem' }}>
              {def.description}
            </p>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-color, #111)', background: 'rgba(0,0,0,0.03)', padding: '4px 8px', borderRadius: '4px' }}>
              📌 Périmètre : {def.droits}
            </div>
          </div>
        ))}
      </div>

      {/* Barre de filtres et recherche */}
      <div className="datatable-toolbar contribuables-toolbar flex-wrap gap-2 mb-3">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            pages.setCurrentPage(1);
          }}
          placeholder="Rechercher un agent par nom, e-mail ou centre..."
          style={{ minWidth: '280px', flex: 1 }}
        />
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            pages.setCurrentPage(1);
          }}
          style={{ padding: '0.5rem 0.75rem', borderRadius: '8px' }}
        >
          <option value="TOUS">Tous les rôles</option>
          {ROLES_AGENTS.map((role) => (
            <option key={role.role} value={role.role}>
              {role.label}
            </option>
          ))}
        </select>
        <span>{filteredAgents.length} utilisateur(s)</span>
      </div>

      {loading ? (
        <p className="status">Chargement des utilisateurs et des centres...</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Agent / Utilisateur</th>
                <th>Statut</th>
                <th>Rôle attribué</th>
                <th>Centre Fiscal d'Affectation</th>
                <th>Périmètre de consultation</th>
              </tr>
            </thead>
            <tbody>
              {pages.pageItems.map((agent) => {
                const isSelf = String(agent.id_agent) === String(currentUserId);
                const currentRole = agent.role || 'agent';
                const def = roleDefinition(currentRole);
                const centreAttache = agent.id_centre
                  ? (agent.nom_centre ?? `le centre #${agent.id_centre}`)
                  : null;
                const horsCentre = centreResume(currentRole, agent.nom_centre);

                return (
                  <tr key={agent.id_agent} className="admin-row">
                    <td>
                      <strong>
                        {agent.prenom} {agent.nom}
                      </strong>
                      <small style={{ display: 'block', color: 'var(--text-muted, #666)' }}>
                        {agent.email}
                        {isSelf ? ' · votre compte' : ''}
                      </small>
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
                        {agent.statut === 'actif' ? 'Actif' : agent.statut === 'inactif' ? 'Bloqué' : 'En attente'}
                      </span>
                    </td>
                    <td>
                      <select
                        className="admin-role-select"
                        value={currentRole}
                        disabled={busyId === agent.id_agent || isSelf}
                        onChange={(e) => handleRoleChange(agent, e.target.value)}
                        style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', fontWeight: 600 }}
                      >
                        {ROLES_AGENTS.map((role) => (
                          <option key={role.role} value={role.role}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      {isCentreScoped(currentRole) ? (
                        <select
                          value={agent.id_centre ?? ''}
                          disabled={busyId === agent.id_agent}
                          onChange={(e) => handleCentreChange(agent, e.target.value)}
                          style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', maxWidth: '240px' }}
                        >
                          <option value="">Aucun centre (accès fermé)</option>
                          {centres.map((c) => (
                            <option key={c.id_centre} value={c.id_centre}>
                              {c.nom_centre}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span style={{ fontSize: '0.85rem', color: horsCentre.couleur, fontWeight: 600 }}>
                          {horsCentre.icon} {horsCentre.texte}
                        </span>
                      )}
                    </td>
                    <td>
                      <small style={{ color: 'var(--text-color, #333)', fontWeight: 500 }}>
                        {def.droits}
                        {isCentreScoped(currentRole)
                          ? ` : ${centreAttache ?? 'aucun centre affecté · consultation impossible'}`
                          : ''}
                      </small>
                    </td>
                  </tr>
                );
              })}

              {!filteredAgents.length && (
                <tr>
                  <td colSpan="5" className="empty" style={{ textAlign: 'center', padding: '2rem' }}>
                    Aucun utilisateur trouvé pour ce filtre.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading && (
        <Pagination
          currentPage={pages.currentPage}
          onPageChange={pages.setCurrentPage}
          totalPages={pages.totalPages}
          showSinglePage={Boolean(filteredAgents.length)}
        />
      )}

      <ModaleConfirmation
        ouvert={Boolean(changementRole)}
        etiquette="Changement de rôle"
        titre="Confirmer le changement de rôle"
        intro="Cette modification changera les droits d'accès de cet utilisateur."
        modifications={
          changementRole
            ? [
                {
                  label: `Rôle de ${changementRole.agent.email}`,
                  avant: getRoleLabel(changementRole.agent.role || 'agent'),
                  apres: getRoleLabel(changementRole.newRole),
                },
              ]
            : []
        }
        messageErreur={erreurChangementRole}
        texteValider="Confirmer le changement"
        enCours={Boolean(changementRole && busyId === changementRole.agent.id_agent)}
        onValider={confirmerChangementRole}
        onFermer={() => {
          if (busyId === null) {
            setChangementRole(null);
            setErreurChangementRole('');
          }
        }}
      />
    </section>
  );
}
