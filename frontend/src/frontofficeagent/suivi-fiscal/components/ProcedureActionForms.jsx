import { formatAriary, toNumber } from '@/utils';
import RefLegal from '@/components/common/RefLegal';
import { REFERENCES } from '@/data/textesFiscaux.data';

/**
 * Boutons d'actions et formulaires pliables pour la procédure contradictoire :
 * 1. Demande d'Éclaircissements et de Justifications (code des procédures
 *    fiscales, art. V-02 — étape facultative)
 * 2. Émission Notification Primitive (délai 30 j, art. V-04)
 * 3. Validation & Émission Notification Définitive (art. V-07)
 * 4. Imputation du Crédit d'Impôt (code des impôts, art. 01.01.15 et 01.02.06)
 *
 * Les articles sont ceux de l'édition consolidée 2025 du Code des procédures
 * fiscales relue le 1er novembre 2026. Les puces posées sous chaque formulaire
 * ouvrent le PDF de l'éditeur à la page imprimée de l'article.
 */
export default function ProcedureActionForms({
  principalRedressement,
  isPrimitiveEnvoyee,
  isDefinitiveEnvoyee,
  actionLoading,
  showPrimitiveForm,
  setShowPrimitiveForm,
  showDefinitiveForm,
  setShowDefinitiveForm,
  showEclaircissementForm,
  setShowEclaircissementForm,
  showImputationForm,
  setShowImputationForm,
  isEclaircissementEmis,
  eclaircissementQuestions,
  setEclaircissementQuestions,
  prorogationJours,
  setProrogationJours,
  creditDisponible,
  setCreditDisponible,
  montantAImputer,
  setMontantAImputer,
  observations,
  setObservations,
  onEmettrePrimitive,
  onEmettreDefinitive,
  onEmettreEclaircissement,
  onImputerCredit,
}) {
  const creditDisponibleNum = toNumber(creditDisponible);
  // Borne alignée sur celle du serveur (`imputerCreditImpot` plafonne au principal du redressement).
  const imputableMax = Math.max(0, Math.min(creditDisponibleNum, toNumber(principalRedressement)));
  const depasseCredit = toNumber(montantAImputer) > imputableMax;

  const canPrimitive = !isPrimitiveEnvoyee && !isDefinitiveEnvoyee;
  const canDefinitive = !isDefinitiveEnvoyee;
  const canEclaircissement = !isEclaircissementEmis && !isDefinitiveEnvoyee;
  const canImputation = isDefinitiveEnvoyee;

  // Actions classées dans l'ordre légal de la procédure contradictoire : l'étape
  // facultative d'éclaircissements (CPF art. V-02) est proposée avant le choix
  // primitive / définitive.
  const actions = [
    canEclaircissement && {
      cle: 'eclaircissement',
      label: 'Demander des éclaircissements',
      className: 'primary btn-teal',
      open: () => setShowEclaircissementForm((prev) => !prev),
    },
    canPrimitive && {
      cle: 'primitive',
      label: 'Émettre la Notification Primitive',
      className: 'primary',
      open: () => setShowPrimitiveForm((prev) => !prev),
    },
    canDefinitive && {
      cle: 'definitive',
      label: 'Émettre la Notification Définitive',
      className: 'primary btn-violet',
      open: () => setShowDefinitiveForm((prev) => !prev),
    },
    canImputation && {
      cle: 'imputation',
      label: "Imputer le Crédit d'Impôt",
      className: 'primary btn-green',
      open: () => setShowImputationForm((prev) => !prev),
    },
  ].filter(Boolean);

  // Une seule action mise en avant : la première du déroulé légal encore ouverte.
  const [principale, ...autres] = actions;
  const suivante = autres[0] ?? null;
  const repliees = autres.slice(1);

  const prochaineEtape = {
    eclaircissement: isPrimitiveEnvoyee
      ? 'La notification primitive court : une demande d’éclaircissements (art. V-02) reste possible avant de fixer la dette.'
      : 'Le contrôle a relevé un écart : demandez d’abord les éclaircissements du contribuable (art. V-02), puis engagez la notification primitive.',
    primitive: isEclaircissementEmis
      ? 'Les éclaircissements sont demandés : la notification primitive ouvre 30 jours de réponse au contribuable.'
      : 'La procédure n’est pas encore engagée : une notification primitive ouvre 30 jours de réponse au contribuable.',
    definitive:
      'La notification primitive est émise ; la notification définitive fixe définitivement la dette.',
    imputation:
      'La dette est arrêtée ; un crédit d’impôt antérieur peut être imputé sur le principal.',
  }[principale?.cle];

  return (
    <>
      {/* Prochaine étape : une action principale, le reste étant replié */}
      <div className="procedure-next">
        <div>
          <span className="procedure-tag">Prochaine étape</span>
          <p>{prochaineEtape}</p>
        </div>
        {principale && (
          <div className="procedure-next-actions">
            <button
              type="button"
              className={principale.className}
              onClick={principale.open}
              disabled={actionLoading}
            >
              {principale.label}
            </button>
            {suivante && (
              <button
                type="button"
                className="secondary"
                onClick={suivante.open}
                disabled={actionLoading}
              >
                {suivante.label}
              </button>
            )}
          </div>
        )}
      </div>

      {(repliees.length > 0 || !canImputation) && (
        <details className="procedure-more">
          <summary>Autres actions du dossier</summary>
          <div className="procedure-buttons">
            {repliees.map((action) => (
              <button
                key={action.cle}
                type="button"
                className={action.className}
                onClick={action.open}
                disabled={actionLoading}
              >
                {action.label}
              </button>
            ))}
            {!canImputation && (
              <span className="procedure-locked">
                Imputation du crédit d’impôt : disponible après la notification définitive.
              </span>
            )}
          </div>
        </details>
      )}

      {/* ── Formulaire 1 : Demande d'Éclaircissements et de Justifications ── */}
      {showEclaircissementForm && !isEclaircissementEmis && !isDefinitiveEnvoyee && (
        <form
          onSubmit={onEmettreEclaircissement}
          className="procedure-form procedure-form-eclaircissement"
        >
          <h3>Demande d'Éclaircissements et de Justifications (art. V-02)</h3>
          <p>
            Invite le contribuable à fournir les éclaircissements ou justifications sur les éléments du calcul
            non contrôlés. L’acte ne liquide aucun droit : à défaut de réponse, ou si la réponse parvient hors
            délai, l’article V-38 expose le contribuable à une imposition d’office.
          </p>
          <div className="procedure-tags">
            <RefLegal source={REFERENCES.eclaircissements} detail />
            <RefLegal source={REFERENCES.sanction_eclaircissements} compact />
          </div>

          <label className="field" style={{ marginBottom: '1rem' }}>
            <span>Points appelant vos éclaircissements</span>
            <textarea
              rows="4"
              required
              value={eclaircissementQuestions}
              onChange={(e) => setEclaircissementQuestions(e.target.value)}
              placeholder="Ex: justifier l'écart entre la TVA collectée déclarée et le chiffre d'affaires encaissé..."
            />
          </label>

          <div className="procedure-form-actions">
            <button type="button" onClick={() => setShowEclaircissementForm(false)}>
              Annuler
            </button>
            <button className="primary btn-teal" type="submit" disabled={actionLoading}>
              {actionLoading ? 'Émission en cours...' : 'Émettre la Demande d’Éclaircissements →'}
            </button>
          </div>
        </form>
      )}

      {/* ── Formulaire 2 : Émission Notification Primitive ── */}
      {showPrimitiveForm && !isPrimitiveEnvoyee && (
        <form onSubmit={onEmettrePrimitive} className="procedure-form">
          <h3>Émission de la Notification Primitive (Proposition temporaire)</h3>
          <p>
            Ouvre un délai légal de réponse de 30 jours à compter de la réception de l’acte. Stocke la date
            d'émission et bascule le statut à <strong>'PRIMITIVE_ENVOYÉE'</strong>.
          </p>
          <div className="procedure-tags">
            <RefLegal source={REFERENCES.proposition_rectification} compact />
            <RefLegal source={REFERENCES.notification_primitive} compact />
          </div>

          <div className="procedure-form-grid">
            <label className="field">
              <span>Montant redressement proposé (Ar)</span>
              <input type="number" value={principalRedressement} disabled readOnly />
            </label>

            <label className="field">
              <span>Prorogation éventuelle DGI (jours)</span>
              <input
                type="number"
                min="0"
                max="60"
                value={prorogationJours}
                onChange={(e) => setProrogationJours(e.target.value)}
                placeholder="0 (par défaut)"
              />
              <span className="procedure-note">
                Les articles VI-04 et VI-05 bornent le nouveau délai accordé à quinze jours : une prorogation
                saisie au-delà est une décision du service, pas une application du texte.
              </span>
            </label>

            <label className="field">
              <span>Crédit d'impôt antérieur déclaré (Ar)</span>
              <input
                type="number"
                min="0"
                value={creditDisponible}
                onChange={(e) => setCreditDisponible(e.target.value)}
                placeholder="Ex: 5000000"
              />
            </label>
          </div>

          <label className="field" style={{ marginBottom: '1rem' }}>
            <span>Motifs &amp; Observations du vérificateur</span>
            <textarea
              rows="3"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Préciser les irrégularités constatées ou la méthode de reconstitution..."
            />
          </label>

          <div className="procedure-form-actions">
            <button type="button" onClick={() => setShowPrimitiveForm(false)}>
              Annuler
            </button>
            <button className="primary" type="submit" disabled={actionLoading}>
              {actionLoading ? 'Traitement...' : 'Confirmer et Envoyer la Notification Primitive →'}
            </button>
          </div>
        </form>
      )}

      {/* ── Formulaire 2 : Émission Notification Définitive ── */}
      {showDefinitiveForm && !isDefinitiveEnvoyee && (
        <form
          onSubmit={onEmettreDefinitive}
          className="procedure-form procedure-form-definitive"
        >
          <h3>Validation des Montants &amp; Notification Définitive (Décision finale)</h3>
          <p>
            Clôture la phase contradictoire. Acte exécutoire fixant définitivement la dette fiscale. Bascule le
            statut à <strong>'DÉFINITIVE_ENVOYÉE'</strong> et{' '}
            <strong>débloque l'imputation du crédit d'impôt</strong>.
          </p>
          <div className="procedure-tags">
            <RefLegal source={REFERENCES.notification_definitive} detail />
          </div>

          <div className="procedure-form-grid procedure-form-grid-2">
            <label className="field">
              <span>Montant définitif en principal validé (Ar)</span>
              <input type="number" value={principalRedressement} disabled readOnly />
            </label>

            <label className="field">
              <span>Crédit d'impôt antérieur disponible (Ar)</span>
              <input
                type="number"
                min="0"
                value={creditDisponible}
                onChange={(e) => setCreditDisponible(e.target.value)}
                placeholder="Ex: 5000000"
              />
            </label>
          </div>

          <label className="field" style={{ marginBottom: '1rem' }}>
            <span>Observations finales de liquidation</span>
            <textarea
              rows="3"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Validation suite à échanges contradictoires..."
            />
          </label>

          <div className="procedure-form-actions">
            <button type="button" onClick={() => setShowDefinitiveForm(false)}>
              Annuler
            </button>
            <button className="primary btn-violet" type="submit" disabled={actionLoading}>
              {actionLoading ? 'Validation en cours...' : 'Valider & Émettre la Notification Définitive →'}
            </button>
          </div>
        </form>
      )}

      {/* ── Formulaire 4 : Imputation du Crédit d'Impôt ── */}
      {showImputationForm && isDefinitiveEnvoyee && (
        <form onSubmit={onImputerCredit} className="procedure-form procedure-form-imputation">
          <h3>Imputation du Crédit d'Impôt (code des impôts, art. 01.01.15 et 01.02.06)</h3>
          <p>
            Le trop-perçu ouvre droit à un crédit d’impôt, imputable sur les règlements ultérieurs de droits de
            même nature et sur une notification définitive de redressement. L’imputation ne dépasse pas le
            principal enregistré au dossier.
          </p>
          <div className="procedure-tags">
            <RefLegal source={REFERENCES.imputation_credit} compact detail />
          </div>

          <div className="procedure-form-grid">
            <label className="field">
              <span>Principal enregistré au dossier (Ar)</span>
              <input type="text" value={formatAriary(principalRedressement)} disabled readOnly />
            </label>

            <label className="field">
              <span>Crédit d'impôt disponible (Ar)</span>
              <input
                type="number"
                min="0"
                value={creditDisponible}
                onChange={(e) => setCreditDisponible(e.target.value)}
                placeholder="Ex: 5000000"
              />
            </label>

            <label className="field">
              <span>Montant à imputer (Ar) <b className="text-red-500">*</b></span>
              <input
                type="number"
                min="0"
                max={imputableMax}
                required
                value={montantAImputer}
                onChange={(e) => setMontantAImputer(e.target.value)}
                placeholder={`Max ${formatAriary(imputableMax)}`}
              />
            </label>
          </div>

          {imputableMax <= 0 && !depasseCredit && (
            <p className="form-submit-message error">
              Aucun crédit d'impôt disponible pour ce dossier : renseignez le crédit déclaré ci-dessus
              pour autoriser une imputation.
            </p>
          )}

          {depasseCredit && (
            <p className="form-submit-message error">
              Le montant à imputer dépasse la borne applicable : {formatAriary(imputableMax)} maximum,
              plafonné par le crédit déclaré ({formatAriary(creditDisponibleNum)}) et par le principal du
              redressement ({formatAriary(principalRedressement)}).
            </p>
          )}

          <div className="procedure-form-actions">
            <button type="button" onClick={() => setShowImputationForm(false)}>
              Annuler
            </button>
            <button
              className="primary btn-green"
              type="submit"
              disabled={actionLoading || depasseCredit || imputableMax <= 0}
            >
              {actionLoading
                ? 'Imputation...'
                : "Appliquer l'Imputation du Crédit d'Impôt →"}
            </button>
          </div>
        </form>
      )}
    </>
  );
}
