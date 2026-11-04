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
          <strong className="brand-project-name">
            <span>DGI</span>
            <span className="brand-dot" aria-hidden="true">·</span>
            <span>SPSCF</span>
          </strong>
          <small className="brand-project-description">
            Système de pilotage du suivi de la conformité fiscale
          </small>
        </div>
      </Link>

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
