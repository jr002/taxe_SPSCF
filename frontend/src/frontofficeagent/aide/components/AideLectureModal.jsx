import { useModalA11y } from '@/hooks';
import { aideEcran, terme } from '@/frontofficeagent/aide/data/aideAgent.data.js';

/**
 * Modale « Aide à la lecture » du front-office : elle explique l'écran où
 * l'agent se trouve, jamais un écran générique.
 *
 * Le conteneur reprend la coquille de `ModaleConfirmation` (superposition,
 * en-tête avec croix, pied « Fermer », focus piégé au clavier) : aucune
 * nouvelle écriture de dialogue, aucune nouvelle couleur. Le contenu, lui,
 * vient intégralement de `data/aideAgent.data.js` — rubrique par rubrique,
 * puis un glossaire des termes cités, eux aussi issus du registre. Les survols
 * `AideTerme` posés dans l'écran et les définitions de la modale portent donc
 * exactement le même texte.
 *
 * Un écran absent du registre (ou un onglet sans aide écrite) ne rend rien :
 * le bouton d'aide n'est pas posé là où il n'aurait rien à dire.
 */
export default function AideLectureModal({ ouvert = false, ecran, onFermer }) {
  const dialogRef = useModalA11y(ouvert, onFermer);
  const aide = aideEcran(ecran);

  if (!ouvert || !aide) return null;

  // Glossaire : les termes cités par les rubriques, dans l'ordre de lecture,
  // dédoublonnés — la même phrase ne doit pas apparaître deux fois.
  const idsVus = new Set();
  const glossaire = [];
  aide.rubriques.forEach((rubrique) => {
    (rubrique.termes || []).forEach((id) => {
      if (idsVus.has(id)) return;
      idsVus.add(id);
      const entree = terme(id);
      if (entree) glossaire.push({ id, ...entree });
    });
  });

  return (
    <div className="rappel-modal-overlay modale-confirmation-overlay" onClick={onFermer}>
      <div
        className="modale-confirmation aide-lecture"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={aide.titre}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modale-confirmation-head">
          <span className="badge surveillance">Aide à la lecture</span>
          <button
            type="button"
            className="agent-profile-fermer"
            aria-label="Fermer l’aide"
            title="Fermer l’aide"
            onClick={onFermer}
          >
            ✕
          </button>
        </div>

        <div className="modale-confirmation-corps">
          <h2>{aide.titre}</h2>
          <p className="modale-confirmation-intro">{aide.intro}</p>

          {aide.rubriques.map((rubrique) => (
            <section className="aide-lecture-rubrique" key={rubrique.titre}>
              <h3>{rubrique.titre}</h3>
              <p>{rubrique.texte}</p>
            </section>
          ))}

          {glossaire.length > 0 && (
            <section className="aide-lecture-rubrique">
              <h3>Les mots de cet écran</h3>
              <dl className="aide-lecture-glossaire">
                {glossaire.map((entree) => (
                  <div key={entree.id}>
                    <dt>{entree.terme}</dt>
                    <dd>{entree.sens}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>

        <div className="modale-confirmation-pied admin-inline-actions">
          <button type="button" className="primary" onClick={onFermer}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
