import { Link, useLocation } from 'react-router-dom';
import { ongletsDeSection } from '@/data/navigationAgent.data';

/**
 * Onglets d'un domaine fiscal, construits depuis le registre de navigation :
 * l'onglet et la barre latérale affichent le même nom pour le même écran, et le
 * groupe « Dossier fiscal » entraîne avec lui l'écran qui le prolonge
 * (`Relance fiscale`).
 *
 * Prop `section` : id du groupe du registre (`suivi` par défaut, `contribuables`
 * pour le registre des redevables).
 */
export default function DossierFiscalNavigation({ section = 'suivi' }) {
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
