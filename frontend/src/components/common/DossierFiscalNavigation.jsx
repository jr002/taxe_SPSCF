import { Link, useLocation } from 'react-router-dom';
import { ongletsDeSection } from '@/data/navigationAgent.data';

/**
 * Accès secondaires du groupe Dossiers, construits depuis le registre de
 * navigation pour conserver un seul nom par écran.
 *
 * Prop `section` : id du groupe du registre (`dossiers` par défaut).
 */
export default function DossierFiscalNavigation({ section = 'dossiers' }) {
  const { pathname } = useLocation();
  const { ariaLabel, liens } = ongletsDeSection(section);

  return (
    <nav className="domain-page-switch" aria-label={ariaLabel}>
      {liens.map((lien) => {
        const actif = pathname === lien.to || pathname.startsWith(`${lien.to}/`);

        return (
          <Link
            key={lien.to}
            to={lien.to}
            className={actif ? 'active' : ''}
            aria-current={actif ? 'page' : undefined}
          >
            {lien.label}
          </Link>
        );
      })}
    </nav>
  );
}
