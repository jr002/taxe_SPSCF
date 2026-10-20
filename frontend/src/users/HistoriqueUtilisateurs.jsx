import { useEffect, useMemo, useState } from 'react';
import { getErrorMessage, getHistoriqueAgents } from '../api/api';

const TYPES_ACTION = [
  { id: 'TOUS', label: 'Toutes les actions' },
  { id: 'ACTIVATION', label: 'Activations', badge: 'conforme', icon: '✓' },
  { id: 'BLOCAGE', label: 'Blocages / Désactivations', badge: 'critique', icon: '🚫' },
  { id: 'ROLE_CHANGE', label: 'Changements de rôle', badge: 'surveillance', icon: '🔄' },
  { id: 'MDP_RESET', label: 'Mots de passe', badge: 'surveillance', icon: '🔑' },
  { id: 'SUPPRESSION', label: 'Suppressions', badge: 'critique', icon: '🗑' },
];

const getActionInfo = (type) => {
  switch (type) {
    case 'ACTIVATION':
      return { label: 'Activation', badge: 'conforme', icon: '✓' };
    case 'BLOCAGE':
      return { label: 'Désactivation', badge: 'critique', icon: '🚫' };
    case 'ROLE_CHANGE':
      return { label: 'Rôle modifié', badge: 'surveillance', icon: '🔄' };
    case 'MDP_RESET':
      return { label: 'Mot de passe', badge: 'surveillance', icon: '🔑' };
    case 'SUPPRESSION':
      return { label: 'Suppression', badge: 'critique', icon: '🗑' };
    case 'CREATION':
      return { label: 'Création initiale', badge: 'conforme', icon: '✨' };
    default:
      return { label: type || 'Action', badge: 'surveillance', icon: 'ℹ' };
  }
};

const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  return `${d.toLocaleDateString('fr-FR')} à ${d.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

export default function HistoriqueUtilisateurs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState('TOUS');
  const [search, setSearch] = useState('');

  const loadData = async (isManual = false) => {
    if (isManual) setLoading(true);
    setError('');
    try {
      const data = await getHistoriqueAgents();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    getHistoriqueAgents()
      .then((data) => {
        if (isMounted) setLogs(Array.isArray(data) ? data : []);
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
  }, []);

  const counts = useMemo(() => {
    return logs.reduce((acc, item) => {
      acc[item.type_action] = (acc[item.type_action] || 0) + 1;
      return acc;
    }, {});
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((log) => {
      if (typeFilter !== 'TOUS' && log.type_action !== typeFilter) return false;
      if (!q) return true;
      return [
        log.nom_auteur,
        log.cible_nom,
        log.cible_email,
        log.description,
        log.type_action,
      ].some((val) => String(val || '').toLowerCase().includes(q));
    });
  }, [logs, typeFilter, search]);

  return (
    <div className="historique-utilisateurs-container">
      <div className="flex justify-between items-center flex-wrap gap-3 mb-4">
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Journal d'audit des modifications</h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted, #666)', fontSize: '0.9rem' }}>
            Traçabilité chronologique de toutes les actions administratives réalisées sur les comptes utilisateurs.
          </p>
        </div>
        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="admin-secondary-button"
          style={{ padding: '0.4rem 0.85rem' }}
        >
          {loading ? 'Chargement...' : '🔄 Actualiser le journal'}
        </button>
      </div>

      <div className="categorie-tabs" style={{ marginBottom: '1rem' }}>
        {TYPES_ACTION.map((t) => {
          const count = t.id === 'TOUS' ? logs.length : (counts[t.id] || 0);
          return (
            <button
              key={t.id}
              type="button"
              className={`categorie-tab${typeFilter === t.id ? ' active' : ''}`}
              onClick={() => setTypeFilter(t.id)}
            >
              {t.label} ({count})
            </button>
          );
        })}
      </div>

      <div className="datatable-toolbar contribuables-toolbar flex-wrap gap-2" style={{ marginBottom: '1rem' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par auteur, utilisateur ciblé, e-mail, motif..."
          style={{ minWidth: '320px', flex: 1 }}
        />
        <span>{filteredLogs.length} entrée(s) trouvée(s)</span>
      </div>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p className="status">Chargement du journal d'audit...</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: '170px' }}>Date & Heure</th>
                <th style={{ width: '150px' }}>Action</th>
                <th>Utilisateur ciblé</th>
                <th>Détails & Modifications</th>
                <th style={{ width: '180px' }}>Auteur de l'action</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((item) => {
                const action = getActionInfo(item.type_action);
                const anciennes = item.anciennes_valeurs;
                const nouvelles = item.nouvelles_valeurs;

                return (
                  <tr key={item.id_historique} className="admin-row">
                    <td>
                      <small style={{ fontWeight: 600, color: 'var(--text-color, #222)' }}>
                        {formatDate(item.date_action)}
                      </small>
                    </td>
                    <td>
                      <span className={`badge ${action.badge}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span>{action.icon}</span>
                        <span>{action.label}</span>
                      </span>
                    </td>
                    <td>
                      <strong>{item.cible_nom || 'Utilisateur'}</strong>
                      {item.cible_email && (
                        <small style={{ display: 'block', color: 'var(--text-muted, #666)' }}>
                          {item.cible_email}
                        </small>
                      )}
                    </td>
                    <td>
                      <div>{item.description}</div>
                      {(anciennes || nouvelles) && (
                        <div
                          style={{
                            marginTop: '0.35rem',
                            fontSize: '0.78rem',
                            background: 'rgba(0,0,0,0.03)',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            display: 'inline-block',
                          }}
                        >
                          {anciennes && (
                            <span style={{ color: '#b42318', marginRight: '8px' }}>
                              Avant : {JSON.stringify(anciennes)}
                            </span>
                          )}
                          {nouvelles && (
                            <span style={{ color: '#237a43' }}>
                              Après : {JSON.stringify(nouvelles)}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{ fontWeight: 500 }}>{item.nom_auteur || 'Système'}</span>
                    </td>
                  </tr>
                );
              })}

              {!filteredLogs.length && (
                <tr>
                  <td colSpan="5" className="empty" style={{ textAlign: 'center', padding: '2rem' }}>
                    Aucune action d'audit ne correspond à vos critères de recherche.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
