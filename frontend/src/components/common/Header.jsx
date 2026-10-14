import { Link, useLocation } from 'react-router-dom';
import logoDgi from '../../assets/logodgi.jpg';

const NAVIGATION_LINKS = [
  { to: '/acceuil', label: 'Accueil' },
  { to: '/collecte', label: 'Collecte TVA' },
  { to: '/decisionnel', label: 'Tableau décisionnel' },
  { to: '/suivi', label: 'Suivi fiscal' },
  { to: '/contribuables', label: 'Contribuables' },
  { to: '/centres-fiscaux', label: 'Centres' },
  { to: '/relance', label: 'Relance fiscale' },
];

/**
 * Espace administrateur : navigation limitée au tableau de bord et à la gestion
 * des comptes. Les modules fiscaux restent réservés aux autres rôles.
 */
const ADMIN_LINKS = [
  { to: '/admin', label: 'Accueil' },
  { to: '/admin/utilisateurs', label: 'Utilisateurs' },
];

/**
 * Barre de navigation principale avec gestion du thème et des onglets de modules
 */
export default function Header({
  modules = [],
  currentModule,
  onSelectModule,
  isDarkMode,
  onToggleTheme,
  onLogout,
  isAdmin = false,
}) {
  const { pathname } = useLocation();

  const links = isAdmin ? ADMIN_LINKS : NAVIGATION_LINKS;
  const homePath = isAdmin ? ADMIN_LINKS[0].to : '/acceuil';

  const isLinkActive = (link) => {
    if (link.to === '/contribuables') {
      return pathname.startsWith('/contribuables');
    }
    if (link.to === '/centres-fiscaux') {
      return pathname.startsWith('/centres-fiscaux');
    }
    if (link.to === '/relance') {
      return pathname.startsWith('/relance');
    }
    return pathname === link.to;
  };

  return (
    <header className="topbar">
      <Link to={homePath} className="brand">
        <img
          className="brand-logo"
          src={logoDgi}
          alt="Logo de la Direction Générale des Impôts"
        />
        <div>
          <strong>
            TVA<span className="brand-dot">•</span>SSIF
          </strong>
          <small>DGI · Système d'information fiscal</small>
        </div>
      </Link>

      <nav aria-label="Navigation principale">
        {links.map((link) => {
          return (
            <Link
              key={link.to}
              to={link.to}
              className={isLinkActive(link) ? 'active' : ''}
            >
              {link.label}
            </Link>
          );
        })}

        {/* Onglets de sous-modules lors de la saisie de collecte */}
        {pathname === '/collecte' && modules.length > 0 && (
          <div className="module-tabs">
            {modules.map((module) => (
              <button
                key={module.id}
                type="button"
                className={currentModule === module.id ? 'active' : ''}
                onClick={() => onSelectModule?.(module.id)}
              >
                {module.label}
              </button>
            ))}
          </div>
        )}

        {/* Bouton de bascule thème clair / thème sombre */}
        <button
          type="button"
          className="theme-toggle"
          onClick={onToggleTheme}
          aria-label={isDarkMode ? 'Activer le mode clair' : 'Activer le mode sombre'}
          title={isDarkMode ? 'Mode clair' : 'Mode sombre'}
        >
          {isDarkMode ? '☀' : '☾'}
        </button>
        <button type="button" className="logout-button" onClick={onLogout}>
          Déconnexion
        </button>
      </nav>
    </header>
  );
}
