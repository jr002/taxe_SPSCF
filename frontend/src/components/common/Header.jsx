import { Link, useLocation } from 'react-router-dom';
import logoDgi from '@/assets/logodgi.jpg';
import UserProfile from '@/components/common/UserProfile';

/**
 * Espace administrateur : la navigation du backoffice est bornée aux cinq écrans
 * d'administration. Elle ne propose aucun module fiscal — un administrateur n'a
 * pas accès aux dossiers fiscaux.
 */
const ADMIN_LINKS = [
  { to: '/admin', label: 'Tableau de bord' },
  { to: '/admin/utilisateurs', label: 'Utilisateurs' },
  { to: '/admin/roles', label: 'Rôles' },
  { to: '/admin/verification-nif', label: 'Vérification NIF' },
  { to: '/admin/historique', label: 'Historique & Audit' },
];

/**
 * Le préfixe le plus long conserve « Vérification NIF » actif sur ses sous-routes.
 */
const pickActivePath = (pathname, links) =>
  links.reduce((longest, link) => {
    const matches = pathname === link.to || pathname.startsWith(`${link.to}/`);
    return matches && link.to.length > longest.length ? link.to : longest;
  }, '');

/**
 * Barre supérieure : navigation admin, commandes de l'espace agent et profil.
 */
export default function Header({
  modules = [],
  currentModule,
  onSelectModule,
  isDarkMode,
  onToggleTheme,
  onLogout,
  user = null,
  isAdmin = false,
  agentNavigationOpen = false,
  onToggleAgentNavigation,
}) {
  const { pathname } = useLocation();

  const homePath = isAdmin ? ADMIN_LINKS[0].to : '/accueil';
  const activePath = pickActivePath(pathname, ADMIN_LINKS);
  const showModuleTabs = pathname === '/collecte' && modules.length > 0;

  return (
    <header className={`topbar${isAdmin ? '' : ' agent-topbar'}`}>
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

      {!isAdmin && (
        <button
          id="agent-navigation-toggle"
          type="button"
          className="agent-navigation-toggle"
          aria-label={agentNavigationOpen ? 'Réduire la navigation' : 'Ouvrir la navigation'}
          aria-expanded={agentNavigationOpen}
          aria-controls="agent-navigation"
          onClick={onToggleAgentNavigation}
        >
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M3 5h14M3 10h14M3 15h14" />
          </svg>
          <span>Modules</span>
        </button>
      )}

      {(isAdmin || showModuleTabs) && (
        <nav aria-label={isAdmin ? 'Navigation principale' : 'Modules de collecte'}>
          {isAdmin && ADMIN_LINKS.map((link) => {
            const actif = link.to === activePath;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={actif ? 'active' : ''}
                aria-current={actif ? 'page' : undefined}
              >
                {link.label}
              </Link>
            );
          })}

          {/* Onglets de sous-modules lors de la saisie de collecte */}
          {showModuleTabs && (
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
        </nav>
      )}

      {/* Profil de l'agent connecté : ancré au coin supérieur droit de la barre,
          hors du flux de la navigation pour ne jamais suivre ses retours à la ligne. */}
      <UserProfile
        user={user}
        onLogout={onLogout}
        isDarkMode={isDarkMode}
        onToggleTheme={onToggleTheme}
      />
    </header>
  );
}
