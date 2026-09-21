import { formatAriary } from '../../../utils/formatters';

/**
 * Boutons d'actions et formulaires pliables pour la procédure contradictoire :
 * 1. Émission Notification Primitive (délai 30j)
 * 2. Validation & Émission Notification Définitive
 * 3. Imputation du Crédit d'Impôt
 */
export default function ProcedureActionForms({
  principalRedressement,
  totalDetteInitiale,
  isPrimitiveEnvoyee,
  isDefinitiveEnvoyee,
  actionLoading,
  showPrimitiveForm,
  setShowPrimitiveForm,
  showDefinitiveForm,
  setShowDefinitiveForm,
  showImputationForm,
  setShowImputationForm,
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
  onImputerCredit,
}) {
  return (
    <>
      {/* Boutons d'actions */}
      <div
        className="procedure-buttons"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginTop: '1.5rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid #e2e8f0',
        }}
      >
        <button
          type="button"
          className="primary"
          onClick={() => setShowPrimitiveForm((prev) => !prev)}
          disabled={actionLoading || isPrimitiveEnvoyee || isDefinitiveEnvoyee}
          style={{
            opacity: isPrimitiveEnvoyee || isDefinitiveEnvoyee ? 0.6 : 1,
            cursor: isPrimitiveEnvoyee || isDefinitiveEnvoyee ? 'not-allowed' : 'pointer',
          }}
        >
          {isPrimitiveEnvoyee
            ? '✓ Notification Primitive Émise'
            : '1. Émettre la Notification Primitive (30j)'}
        </button>

        <button
          type="button"
          className="primary"
          onClick={() => setShowDefinitiveForm((prev) => !prev)}
          disabled={actionLoading || isDefinitiveEnvoyee}
          style={{
            backgroundColor: isDefinitiveEnvoyee ? '#94a3b8' : '#7c3aed',
            opacity: isDefinitiveEnvoyee ? 0.6 : 1,
            cursor: isDefinitiveEnvoyee ? 'not-allowed' : 'pointer',
          }}
        >
          {isDefinitiveEnvoyee
            ? '✓ Notification Définitive Émise'
            : '2. Valider les Montants & Émettre la Notification Définitive'}
        </button>
      </div>

      {/* ── Formulaire 1 : Émission Notification Primitive ── */}
      {showPrimitiveForm && !isPrimitiveEnvoyee && (
        <form
          onSubmit={onEmettrePrimitive}
          style={{
            marginTop: '1.25rem',
            padding: '1.25rem',
            border: '1px solid #bfdbfe',
            borderRadius: '10px',
            backgroundColor: '#eff6ff',
          }}
        >
          <h3 style={{ margin: '0 0 0.5rem', color: '#1e40af', fontSize: '1rem' }}>
            Émission de la Notification Primitive (Proposition temporaire)
          </h3>
          <p style={{ margin: '0 0 1rem', color: '#475569', fontSize: '0.82rem' }}>
            Ouvre un délai légal de réponse de 30 jours à compter de l'envoi. Stocke la date d'émission et
            bascule le statut à <strong>'PRIMITIVE_ENVOYÉE'</strong>.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1rem',
              marginBottom: '1rem',
            }}
          >
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
            </label>

            <label className="field">
              <span>Crédit d'impôt antérieur déclaré (Ar)</span>
              <input
                type="number"
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
              style={{
                width: '100%',
                padding: '0.65rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
              }}
            />
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
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
          style={{
            marginTop: '1.25rem',
            padding: '1.25rem',
            border: '1px solid #ddd6fe',
            borderRadius: '10px',
            backgroundColor: '#f5f3ff',
          }}
        >
          <h3 style={{ margin: '0 0 0.5rem', color: '#5b21b6', fontSize: '1rem' }}>
            Validation des Montants &amp; Notification Définitive (Décision finale)
          </h3>
          <p style={{ margin: '0 0 1rem', color: '#475569', fontSize: '0.82rem' }}>
            Clôture la phase contradictoire. Acte exécutoire fixant définitivement la dette fiscale. Bascule le
            statut à <strong>'DÉFINITIVE_ENVOYÉE'</strong> et{' '}
            <strong>débloque l'imputation du crédit d'impôt</strong>.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '1rem',
              marginBottom: '1rem',
            }}
          >
            <label className="field">
              <span>Montant définitif en principal validé (Ar)</span>
              <input type="number" value={principalRedressement} disabled readOnly />
            </label>

            <label className="field">
              <span>Crédit d'impôt antérieur disponible (Ar)</span>
              <input
                type="number"
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
              style={{
                width: '100%',
                padding: '0.65rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
              }}
            />
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button type="button" onClick={() => setShowDefinitiveForm(false)}>
              Annuler
            </button>
            <button
              className="primary"
              type="submit"
              disabled={actionLoading}
              style={{ backgroundColor: '#7c3aed' }}
            >
              {actionLoading ? 'Validation en cours...' : 'Valider & Émettre la Notification Définitive →'}
            </button>
          </div>
        </form>
      )}

      {/* ── Formulaire 3 : Imputation du Crédit d'Impôt ── */}
      {showImputationForm && isDefinitiveEnvoyee && (
        <form
          onSubmit={onImputerCredit}
          style={{
            marginTop: '1.25rem',
            padding: '1.25rem',
            border: '1px solid #a7f3d0',
            borderRadius: '10px',
            backgroundColor: '#ecfdf5',
          }}
        >
          <h3 style={{ margin: '0 0 0.5rem', color: '#065f46', fontSize: '1rem' }}>
            Imputation légale directe du Crédit d'Impôt (Art. 01.01.15 &amp; 01.02.06 CGI 2026)
          </h3>
          <p style={{ margin: '0 0 1rem', color: '#475569', fontSize: '0.82rem' }}>
            L'excédent de versements ou d'acomptes provisionnels antérieurs peut être imputé de plein droit sur
            le redressement issu de la notification définitive.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1rem',
              marginBottom: '1rem',
            }}
          >
            <label className="field">
              <span>Dette totale exécutoire (Ar)</span>
              <input type="text" value={formatAriary(totalDetteInitiale)} disabled readOnly />
            </label>

            <label className="field">
              <span>Crédit d'impôt disponible (Ar)</span>
              <input
                type="number"
                value={creditDisponible}
                onChange={(e) => setCreditDisponible(e.target.value)}
                placeholder="Ex: 5000000"
              />
            </label>

            <label className="field">
              <span>Montant à imputer (Ar)</span>
              <input
                type="number"
                value={montantAImputer}
                onChange={(e) => setMontantAImputer(e.target.value)}
                placeholder="Ex: 5000000"
              />
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button type="button" onClick={() => setShowImputationForm(false)}>
              Annuler
            </button>
            <button
              className="primary"
              type="submit"
              disabled={actionLoading}
              style={{ backgroundColor: '#059669' }}
            >
              {actionLoading ? 'Imputation...' : "Appliquer l'Imputation du Crédit d'Impôt →"}
            </button>
          </div>
        </form>
      )}
    </>
  );
}
