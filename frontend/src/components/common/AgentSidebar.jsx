import { Link, useLocation } from 'react-router-dom';
import { entreesRail, groupeDe, trouveEcran } from '@/data/navigationAgent.data';

/**
 * Barre de navigation du frontoffice agent.
 *
 * Elle n'affiche que les entrées `rail` du registre, mais l'état actif se résout
 * sur tous les écrans enregistrés : `/relance`, `/collecte` ou une fiche
 * contribuable allument le groupe dont ils relèvent. Le libellé accessible de
 * l'entrée active précise l'écran atteint quand celui diffère du nom du groupe.
 */
export default function AgentSidebar({ isChefCentre = false }) {
  const { pathname } = useLocation();
  const ecran = trouveEcran(pathname);
  const groupe = groupeDe(ecran);
  const liens = entreesRail(isChefCentre);

  return (
    <aside id="agent-navigation" className="agent-sidebar" aria-label="Navigation de l’espace agent">
      <div className="agent-sidebar-heading">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
        </svg>
        <strong>Modules fiscaux</strong>
      </div>
      <nav aria-label="Modules du frontoffice agent">
        {liens.map((lien) => {
          const actif = lien.id === groupe?.id;
          const nom = actif && ecran.id !== lien.id ? `${lien.label} — ${ecran.label}` : lien.label;

          return (
            <Link
              key={lien.id}
              to={lien.chemin}
              className={actif ? 'active' : ''}
              aria-current={actif ? 'page' : undefined}
              aria-label={nom}
              title={nom}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                {lien.icone.map((path) => <path key={path} d={path} />)}
              </svg>
              <span>{lien.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
