import { Link, useLocation } from 'react-router-dom';

const NAVIGATION_LINKS = [
  { to: '/accueil', label: 'Accueil', icon: ['M3 10.5 12 3l9 7.5', 'M5.5 9.5V21h13V9.5', 'M9.5 21v-7h5v7'] },
  { to: '/file-de-travail', label: 'File de travail', icon: ['M3 7h18v14H3z', 'M8 7V4h8v3', 'M3 12h18'] },
  { to: '/decisionnel', label: 'Statistique', icon: ['M4 20V4', 'M4 20h17', 'm8 16 4-5 3 2 5-7'] },
  { to: '/suivi', label: 'Dossier fiscal', icon: ['M3 4.5h5.5l1.8 2.2H21V20.5H3z', 'M8 13h8'] },
  { to: '/contribuables', label: 'Contribuables', icon: ['M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2', 'M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8', 'M20 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'] },
  { to: '/centres-fiscaux', label: 'Centres fiscaux', icon: ['M3 21h18', 'M5 21V7l7-4 7 4v14', 'M9 10h.01', 'M15 10h.01', 'M9 14h.01', 'M15 14h.01', 'M10 21v-4h4v4'] },
  { to: '/register', label: 'Registre', icon: ['M4.5 5h.01', 'M4.5 12h.01', 'M4.5 19h.01', 'M9 5h11', 'M9 12h11', 'M9 19h7'] },
];

const LIEN_EQUIPE_CENTRE = {
  to: '/admin/utilisateurs',
  label: 'Mon équipe',
  icon: ['M3.5 5h17v14h-17z', 'M9 11.1a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6', 'M6 16.6c0-1.66 1.34-3 3-3s3 1.34 3 3', 'M15 8.5h3.5', 'M15 11.5h3.5'],
};

const pickActivePath = (pathname, links) =>
  links.reduce((longest, link) => {
    const matches = pathname === link.to || pathname.startsWith(`${link.to}/`);
    return matches && link.to.length > longest.length ? link.to : longest;
  }, '');

export default function AgentSidebar({ isChefCentre = false }) {
  const { pathname } = useLocation();
  const links = isChefCentre ? [...NAVIGATION_LINKS, LIEN_EQUIPE_CENTRE] : NAVIGATION_LINKS;
  const activePath = pickActivePath(pathname, links);

  return (
    <aside id="agent-navigation" className="agent-sidebar" aria-label="Navigation de l’espace agent">
      <div className="agent-sidebar-heading">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
        </svg>
        <strong>Modules fiscaux</strong>
      </div>
      <nav aria-label="Modules du frontoffice agent">
        {links.map((link) => {
          const actif = link.to === activePath;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={actif ? 'active' : ''}
              aria-current={actif ? 'page' : undefined}
              aria-label={link.label}
              title={link.label}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                {link.icon.map((path) => <path key={path} d={path} />)}
              </svg>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
