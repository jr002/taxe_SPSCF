import { Link, useLocation } from 'react-router-dom';
import logoDgi from '@/assets/logodgi.jpg';
import UserProfile from './UserProfile';

const NAVIGATION_LINKS = [
  { to: '/acceuil', label: 'Accueil' },
  { to: '/decisionnel', label: 'Statistique' },
  { to: '/suivi', label: 'Dossier fiscal' },
  { to: '/contribuables', label: 'Contribuables' },
  { to: '/centres-fiscaux', label: 'Centres' },
  { to: '/register', label: 'Registre' },
];

/**
 * Espace administrateur : la navigation du backoffice est bornée aux cinq écrans
 * d'administration. Elle ne propose aucun module fiscal — un administrateur n'a
 * pas accès aux dossiers fiscaux — et l'espace agent ne propose en retour aucun
 * lien de gestion des utilisateurs.
 */
const ADMIN_LINKS = [
  { to: '/admin', label: 'Tableau de bord' },
  { to: '/admin/utilisateurs', label: 'Utilisateurs' },
  { to: '/admin/roles', label: 'Rôles' },
  { to: '/admin/verification-nif', label: 'Vérification NIF' },
  { to: '/admin/historique', label: 'Historique & Audit' },
];

/**
 * Le lien actif est celui dont le chemin est le préfixe le plus long de l'URL
 * courante : `/contribuables/51/declarations` surligne « Contribuables » et
 * `/admin/verification-nif/sql` surligne « Vérification NIF », ce que la
 * comparaison exacte ne faisait pas pour les autres entrées.
 */
const pickActivePath = (pathname, links) =>
  links.reduce((longest, link) => {
    const matches = pathname === link.to || pathname.startsWith(`${link.to}/`);
    return matches && link.to.length > longest.length ? link.to : longest;
  }, '');

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
  user = null,
  isAdmin = false,
}) {
  const { pathname } = useLocation();

  const links = isAdmin ? ADMIN_LINKS : NAVIGATION_LINKS;
  const homePath = isAdmin ? ADMIN_LINKS[0].to : '/acceuil';
  const activePath = pickActivePath(pathname, links);

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
              className={link.to === activePath ? 'active' : ''}
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
      </nav>

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
