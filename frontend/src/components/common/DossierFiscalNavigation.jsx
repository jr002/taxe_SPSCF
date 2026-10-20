import { Link, useLocation } from 'react-router-dom';

const DOSSIER_FISCAL_LINKS = [
  { to: '/contribuables', label: 'Contribuables' },
  { to: '/collecte', label: 'Collecte TVA' },
  { to: '/suivi', label: 'Suivi fiscal' },
  { to: '/relance', label: 'Relance fiscale' },
];

const COLLECTE_LINKS = [
  { to: '/collecte', label: 'Collecte TVA' },
  { to: '/contribuables', label: 'Contribuables' },
];

export default function DossierFiscalNavigation({ mode = 'dossier' }) {
  const { pathname } = useLocation();
  const links = mode === 'collecte' ? COLLECTE_LINKS : DOSSIER_FISCAL_LINKS;
  const label = mode === 'collecte'
    ? 'Navigation collecte et contribuables'
    : 'Pages du dossier fiscal';

  return (
    <nav className="domain-page-switch" aria-label={label}>
      {links.map((link) => {
        const isActive = pathname.startsWith(link.to);

        return (
          <Link
            key={link.to}
            to={link.to}
            className={isActive ? 'active' : ''}
            aria-current={isActive ? 'page' : undefined}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}