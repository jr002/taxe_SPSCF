import { NavLink } from 'react-router-dom';

const ADMIN_PAGES = [
  {
    to: '/admin',
    label: 'Tableau de bord & Camembert',
    icon: '📊',
    exact: true,
    description: 'Statistiques & synthèse',
  },
  {
    to: '/admin/utilisateurs',
    label: 'Gestion Utilisateurs',
    icon: '👥',
    description: 'Activation & désactivation',
  },
  {
    to: '/admin/roles',
    label: 'Gestion des Rôles',
    icon: '🛡️',
    description: 'Accès par centre fiscal',
  },
  {
    to: '/admin/verification-nif',
    label: 'Vérification NIF',
    icon: '🔍',
    description: 'JSON, Excel & Requête SQL',
  },
  {
    to: '/admin/historique',
    label: 'Historique des Modifications',
    icon: '📋',
    description: 'Journal d’audit des actions',
  },
];

/**
 * Barre de navigation interne pour les 5 pages du Backoffice Admin
 */
export default function AdminNav() {
  return (
    <nav className="admin-backoffice-nav" aria-label="Navigation Backoffice Admin" style={{ marginBottom: '1.75rem' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.65rem',
          background: 'var(--panel-bg, #ffffff)',
          padding: '0.65rem',
          borderRadius: '12px',
          border: '1px solid var(--border-color, #e5e7eb)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        {ADMIN_PAGES.map((page) => (
          <NavLink
            key={page.to}
            to={page.to}
            end={page.exact}
            style={({ isActive }) => ({
              display: 'flex',
              flexDirection: 'column',
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              textDecoration: 'none',
              color: isActive ? '#ffffff' : 'var(--text-color, #1f2937)',
              background: isActive
                ? 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)'
                : 'var(--card-bg, #f9fafb)',
              border: isActive ? '1px solid #1e40af' : '1px solid var(--border-color, #e5e7eb)',
              transition: 'all 0.15s ease',
              boxShadow: isActive ? '0 2px 6px rgba(37,99,235,0.25)' : 'none',
            })}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.88rem' }}>
              <span style={{ fontSize: '1.15rem' }}>{page.icon}</span>
              <span>{page.label}</span>
            </div>
            <span
              style={{
                fontSize: '0.72rem',
                opacity: 0.85,
                marginTop: '0.2rem',
                fontWeight: 400,
              }}
            >
              {page.description}
            </span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
