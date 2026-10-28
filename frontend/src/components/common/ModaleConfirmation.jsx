import { useModalA11y } from '@/hooks';

/**
 * Boîte de dialogue de confirmation : aucune modification du back-office n'est
 * envoyée avant le clic sur « Valider ». Elle liste les changements qui seront
 * appliqués (`avant` → `après`) et refuse toute exécution implicite.
 *
 * `variante="danger"` (blocage, suppression) remplace le liseré vert par un
 * liseré rouge et le bouton bleu par le bouton de suppression existant.
 * Omettre `onValider` transforme la dialogue en simple accusé de réception :
 * le pied ne montre plus que « Fermer ».
 */
export default function ModaleConfirmation({
  ouvert = false,
  etiquette,
  titre,
  intro,
  modifications = [],
  messageErreur,
  messageSucces,
  variante = 'normale',
  texteValider = 'Valider',
  enCours = false,
  onValider,
  onFermer,
  children,
}) {
  const dialogRef = useModalA11y(ouvert, onFermer);

  if (!ouvert) return null;

  const danger = variante === 'danger';
  const libelleEtiquette = etiquette || (danger ? 'Action délicate' : 'À confirmer');

  return (
    <div className="rappel-modal-overlay modale-confirmation-overlay" onClick={onFermer}>
      <div
        className={`modale-confirmation${danger ? ' danger' : ''}`}
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={titre}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modale-confirmation-head">
          <span className={`badge ${danger ? 'critique' : 'surveillance'}`}>{libelleEtiquette}</span>
          <button
            type="button"
            className="agent-profile-fermer"
            aria-label="Fermer sans appliquer"
            title="Fermer sans appliquer"
            onClick={onFermer}
          >
            ✕
          </button>
        </div>

        <div className="modale-confirmation-corps">
          <h2>{titre}</h2>
          {intro && <p className="modale-confirmation-intro">{intro}</p>}

          {modifications.length > 0 && (
            <ul className="modale-confirmation-liste">
              {modifications.map((modification) => (
                <li key={modification.label}>
                  <span className="modale-confirmation-champ">{modification.label}</span>
                  <span className="modale-confirmation-valeur">
                    <span className="modale-confirmation-avant">{modification.avant}</span>
                    <span className="modale-confirmation-fleche" aria-hidden="true">
                      →
                    </span>
                    <strong className="modale-confirmation-apres">{modification.apres}</strong>
                  </span>
                </li>
              ))}
            </ul>
          )}

          {children}

          {messageErreur && (
            <p className="modale-confirmation-erreur" role="alert">
              {messageErreur}
            </p>
          )}
          {messageSucces && (
            <p className="modale-confirmation-succes" role="status">
              {messageSucces}
            </p>
          )}
        </div>

        <div className="modale-confirmation-pied admin-inline-actions">
          {onValider ? (
            <>
              <button type="button" className="modale-confirmation-annuler" onClick={onFermer} disabled={enCours}>
                Annuler
              </button>
              <button
                type="button"
                className={danger ? 'admin-danger-button' : 'primary'}
                onClick={onValider}
                disabled={enCours}
              >
                {enCours ? 'Enregistrement...' : texteValider}
              </button>
            </>
          ) : (
            <button type="button" className="primary" onClick={onFermer}>
              Fermer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
