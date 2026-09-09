import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
  getDeclarationById,
  emettreNotificationPrimitive,
  emettreNotificationDefinitive,
  imputerCreditImpot,
  getErrorMessage,
} from '../api/api';
import { formatAriary, toNumber } from '../utils/formatters';
import NotificationModal from '../components/common/NotificationModal';

/**
 * Page de consultation et de gestion détaillée d'une déclaration fiscale
 * Intègre la procédure contradictoire de redressement (CGI LFI 2026 / CPF V-19) :
 * - Notification Primitive (délai de réponse 30 jours)
 * - Statut PRIMITIVE_ENVOYÉE
 * - Notification Définitive (validation agent)
 * - Statut DÉFINITIVE_ENVOYÉE
 * - Déblocage de l'imputation du crédit d'impôt (Art. 01.01.15 IR & 01.02.06 IS)
 */
export default function DeclarationDetail() {
  const { id } = useParams();
  const location = useLocation();
  const [declaration, setDeclaration] = useState(location.state?.declaration || null);
  const [loading, setLoading] = useState(!declaration);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // États pour les formulaires d'actions
  const [showPrimitiveForm, setShowPrimitiveForm] = useState(false);
  const [showDefinitiveForm, setShowDefinitiveForm] = useState(false);
  const [showImputationForm, setShowImputationForm] = useState(false);

  // Modal d'aperçu officiel
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('primitive');

  // Champs de saisie
  const [observations, setObservations] = useState('');
  const [prorogationJours, setProrogationJours] = useState(0);
  const [creditDisponible, setCreditDisponible] = useState('');
  const [montantAImputer, setMontantAImputer] = useState('');

  const loadDeclaration = async () => {
    setLoading(true);
    try {
      const result = await getDeclarationById(id);
      setDeclaration(result);
      if (result?.credit_impot) {
        setCreditDisponible(String(result.credit_impot));
      }
      if (result?.observations_agent) {
        setObservations(result.observations_agent);
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeclaration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading && !declaration) {
    return <p className="page status">Chargement des données de la déclaration...</p>;
  }

  if (error && !declaration) {
    return (
      <section className="page error">
        <h1>Déclaration indisponible</h1>
        <p>{error || 'Cette déclaration est introuvable.'}</p>
        <Link className="primary detail-back" to="/suivi">
          Retour au suivi fiscal
        </Link>
      </section>
    );
  }

  const tvaPayee = toNumber(declaration.tva_payee);
  const tvaTheorique = toNumber(declaration.tva_theorique);
  const ecart = tvaTheorique - tvaPayee;
  const redressementApplicable = ecart > 0;

  // Calculs financiers associés au redressement
  const principalRedressement = Number(declaration.montant_redressement) || Math.max(0, ecart);
  const amendeFiscale = principalRedressement * 0.4;
  const totalDetteInitiale = principalRedressement + amendeFiscale;
  const creditImpute = Number(declaration.montant_impute) || 0;
  const netAPayer = Number(declaration.montant_net_a_payer) || (totalDetteInitiale - creditImpute);

  const statut = String(declaration.statut || '').toUpperCase();
  const isPrimitiveEnvoyee = statut === 'PRIMITIVE_ENVOYÉE';
  const isDefinitiveEnvoyee = statut === 'DÉFINITIVE_ENVOYÉE';

  // Calcul du délai restant pour la notification primitive
  let joursRestants = null;
  if (declaration.date_limite_reponse) {
    const now = new Date();
    const deadline = new Date(declaration.date_limite_reponse);
    const diffTime = deadline - now;
    joursRestants = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Action : Émettre Notification Primitive
  const handleEmettrePrimitive = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setActionSuccess('');
    setError('');

    try {
      const res = await emettreNotificationPrimitive(id, {
        date_emission: new Date(),
        prorogation_jours: Number(prorogationJours) || 0,
        montant_redressement: principalRedressement,
        credit_impot: Number(creditDisponible) || 0,
        observations_agent: observations,
      });
      setDeclaration(res);
      setActionSuccess('Notification Primitive émise avec succès. Délai légal de réponse fixé à 30 jours.');
      setShowPrimitiveForm(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  // Action : Émettre Notification Définitive
  const handleEmettreDefinitive = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setActionSuccess('');
    setError('');

    try {
      const res = await emettreNotificationDefinitive(id, {
        date_emission: new Date(),
        montant_valide: principalRedressement,
        credit_impot: Number(creditDisponible) || Number(declaration.credit_impot) || 0,
        observations_agent: observations,
      });
      setDeclaration(res);
      setActionSuccess('Notification Définitive validée et émise. Le bouton d’imputation du crédit d’impôt est désormais débloqué.');
      setShowDefinitiveForm(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  // Action : Imputer le Crédit d'Impôt
  const handleImputerCredit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setActionSuccess('');
    setError('');

    try {
      const res = await imputerCreditImpot(id, {
        credit_impot: Number(creditDisponible) || Number(declaration.credit_impot) || 0,
        montant_a_imputer: Number(montantAImputer) || Number(creditDisponible) || 0,
        observations_agent: observations,
      });
      setDeclaration(res);
      setActionSuccess("Crédit d'impôt imputé avec succès sur la notification définitive.");
      setShowImputationForm(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <section className="page declaration-page">
      <Link className="detail-back-link" to="/suivi">
        ← Retour au suivi fiscal
      </Link>

      <div className="page-heading declaration-page-heading">
        <p className="eyebrow">Dossier de Contrôle Fiscal</p>
        <h1>{declaration.raison_sociale || 'Contribuable non renseigné'}</h1>
        <p>
          NIF : <strong>{declaration.nif || 'N/A'}</strong> · Exercice fiscal : <strong>{declaration.annee}</strong> · Secteur : {declaration.secteur_activite || 'Général'}
        </p>
      </div>

      {actionSuccess && (
        <div className="form-submit-message success" style={{ marginBottom: '1.25rem' }}>
          ✓ {actionSuccess}
        </div>
      )}
      {error && (
        <div className="form-submit-message error" style={{ marginBottom: '1.25rem' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Synthèse générale */}
      <div className="declaration-summary">
        <div>
          <span>Statut juridique du dossier</span>
          <strong
            style={{
              color: isDefinitiveEnvoyee
                ? '#7c3aed'
                : isPrimitiveEnvoyee
                  ? '#1d4ed8'
                  : ecart > 0
                    ? '#b45309'
                    : '#15803d',
            }}
          >
            {isDefinitiveEnvoyee
              ? 'DÉFINITIVE ENVOYÉE (Dette arrêtée)'
              : isPrimitiveEnvoyee
                ? 'PRIMITIVE ENVOYÉE (Phase contradictoire)'
                : declaration.statut || 'Conforme'}
          </strong>
        </div>
        <div>
          <span>Écart de TVA constaté</span>
          <strong style={{ color: ecart > 0 ? '#b91c1c' : '#15803d' }}>
            {formatAriary(ecart)}
          </strong>
        </div>
      </div>

      {/* Détails déclaratifs */}
      <div className="declaration-detail-grid">
        <div>
          <dt>Chiffre d'affaires</dt>
          <dd>{formatAriary(declaration.ca)}</dd>
        </div>
        <div>
          <dt>Bénéfice déclaré</dt>
          <dd>{formatAriary(declaration.benefice)}</dd>
        </div>
        <div>
          <dt>TVA collectée</dt>
          <dd>{formatAriary(declaration.tva_collectee)}</dd>
        </div>
        <div>
          <dt>TVA déductible</dt>
          <dd>{formatAriary(declaration.tva_deductible)}</dd>
        </div>
        <div>
          <dt>TVA effectivement payée</dt>
          <dd>{formatAriary(declaration.tva_payee)}</dd>
        </div>
        <div>
          <dt>TVA théorique calculée</dt>
          <dd>{formatAriary(declaration.tva_theorique)}</dd>
        </div>
        <div>
          <dt>N° Enregistrement</dt>
          <dd>#{declaration.id_declaration}</dd>
        </div>
        <div>
          <dt>Dernière mise à jour</dt>
          <dd>{new Date(declaration.date_modification || declaration.date_creation).toLocaleDateString('fr-FR')}</dd>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 🏛️ SECTION PROCÉDURE CONTRADICTOIRE & REDRESSEMENTS (CGI LFI 2026)    */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div className="procedure-card" style={{ marginTop: '2rem' }}>
        <div className="procedure-header">
          <div>
            <span className="procedure-tag">CGI LFI 2026 · Procédure Contradictoire</span>
            <h2>Gestion des Notifications Primitives et Définitives</h2>
            <p>
              Réglementation fiscale malgache (CPF Art. V-19 et suivants, CGI Art. 01.01.15 et 01.02.06).
            </p>
          </div>
          <div className="procedure-actions">
            {isPrimitiveEnvoyee && (
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setModalType('primitive');
                  setModalOpen(true);
                }}
              >
                📄 Voir Notification Primitive
              </button>
            )}
            {isDefinitiveEnvoyee && (
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setModalType('definitive');
                  setModalOpen(true);
                }}
              >
                📜 Voir Notification Définitive
              </button>
            )}
          </div>
        </div>

        {/* Stepper à 4 étapes */}
        <div className="stepper-wrap">
          <div className={`step-item ${ecart > 0 ? 'completed' : 'active'}`}>
            <span className="step-circle">1</span>
            <div className="step-content">
              <strong>Contrôle & Écart</strong>
              <small>{ecart > 0 ? `Écart ${formatAriary(ecart)}` : 'Conforme'}</small>
            </div>
          </div>
          <div className={`step-item ${isPrimitiveEnvoyee || isDefinitiveEnvoyee ? 'completed' : ecart > 0 ? 'active' : ''}`}>
            <span className="step-circle">2</span>
            <div className="step-content">
              <strong>Notification Primitive</strong>
              <small>
                {declaration.date_notification_primitive
                  ? new Date(declaration.date_notification_primitive).toLocaleDateString('fr-FR')
                  : 'Délai 30 jours (CPF V-19)'}
              </small>
            </div>
          </div>
          <div className={`step-item ${isDefinitiveEnvoyee ? 'completed' : isPrimitiveEnvoyee ? 'active' : ''}`}>
            <span className="step-circle">3</span>
            <div className="step-content">
              <strong>Notification Définitive</strong>
              <small>
                {declaration.date_notification_definitive
                  ? new Date(declaration.date_notification_definitive).toLocaleDateString('fr-FR')
                  : 'Validation agent'}
              </small>
            </div>
          </div>
          <div className={`step-item ${creditImpute > 0 ? 'completed' : isDefinitiveEnvoyee ? 'active' : 'locked'}`}>
            <span className="step-circle">4</span>
            <div className="step-content">
              <strong>Imputation Crédit d'Impôt</strong>
              <small>
                {creditImpute > 0
                  ? `Imputé : ${formatAriary(creditImpute)}`
                  : isDefinitiveEnvoyee
                    ? 'Débloqué (Art. 01.01.15)'
                    : 'Verrouillé'}
              </small>
            </div>
          </div>
        </div>

        {/* Détail du suivi temporel en phase primitive */}
        {isPrimitiveEnvoyee && (
          <div
            className="countdown-banner"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 1.25rem',
              borderRadius: '10px',
              backgroundColor: joursRestants <= 5 ? '#fef2f2' : '#eff6ff',
              border: `1px solid ${joursRestants <= 5 ? '#fca5a5' : '#bfdbfe'}`,
              margin: '1.25rem 0',
            }}
          >
            <div>
              <strong style={{ color: joursRestants <= 5 ? '#991b1b' : '#1e40af', fontSize: '1rem' }}>
                ⏳ Délai contradictoire en cours : {joursRestants !== null ? `${joursRestants} jour(s) restant(s)` : 'En attente'}
              </strong>
              <p style={{ margin: '0.25rem 0 0', color: '#4b5563', fontSize: '0.82rem' }}>
                Émise le : <strong>{new Date(declaration.date_notification_primitive).toLocaleDateString('fr-FR')}</strong> · Date limite de réponse :{' '}
                <strong>{new Date(declaration.date_limite_reponse).toLocaleDateString('fr-FR')}</strong>
                {declaration.prorogation_jours > 0 && ` (dont +${declaration.prorogation_jours}j de prorogation)`}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className="badge surveillance" style={{ fontSize: '0.78rem' }}>
                Compensation de crédits : Non applicable à ce stade
              </span>
            </div>
          </div>
        )}

        {/* Récapitulatif financier du redressement */}
        <div
          className="financial-breakdown"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1rem',
            padding: '1.25rem',
            borderRadius: '10px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            margin: '1.25rem 0',
          }}
        >
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Redressement en principal</span>
            <strong style={{ display: 'block', fontSize: '1.15rem', color: '#0f172a', marginTop: '0.2rem' }}>
              {formatAriary(principalRedressement)}
            </strong>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Amende fiscale (40 %)</span>
            <strong style={{ display: 'block', fontSize: '1.15rem', color: '#b45309', marginTop: '0.2rem' }}>
              {formatAriary(amendeFiscale)}
            </strong>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Crédit d'impôt imputé</span>
            <strong style={{ display: 'block', fontSize: '1.15rem', color: '#16a34a', marginTop: '0.2rem' }}>
              - {formatAriary(creditImpute)}
            </strong>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Montant net exécutoire à payer</span>
            <strong style={{ display: 'block', fontSize: '1.25rem', color: '#1d4ed8', marginTop: '0.2rem' }}>
              {formatAriary(netAPayer)}
            </strong>
          </div>
        </div>

        {/* Boutons d'actions et de progression */}
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
          {/* Bouton 1 : Notification Primitive */}
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
            {isPrimitiveEnvoyee ? '✓ Notification Primitive Émise' : '1. Émettre la Notification Primitive (30j)'}
          </button>

          {/* Bouton 2 : Notification Définitive */}
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

          {/* Bouton 3 : Imputation du Crédit d'Impôt (DÉBLOQUÉ UNIQUEMENT SI DÉFINITIVE_ENVOYÉE) */}
          <button
            type="button"
            className="primary"
            onClick={() => setShowImputationForm((prev) => !prev)}
            disabled={!isDefinitiveEnvoyee || actionLoading}
            title={
              !isDefinitiveEnvoyee
                ? "Ce bouton est verrouillé jusqu'à l'émission de la Notification Définitive (Art. 01.01.15 et 01.02.06 CGI)."
                : "Imputer le crédit d'impôt disponible sur la dette fiscale arrêtée"
            }
            style={{
              backgroundColor: isDefinitiveEnvoyee ? '#059669' : '#cbd5e1',
              color: isDefinitiveEnvoyee ? '#ffffff' : '#64748b',
              cursor: isDefinitiveEnvoyee ? 'pointer' : 'not-allowed',
            }}
          >
            {isDefinitiveEnvoyee ? '🔓 3. Imputer le Crédit d’Impôt' : '🔒 3. Imputation du Crédit d’Impôt (Verrouillé)'}
          </button>
        </div>

        {/* Message d'avertissement légal si imputation encore verrouillée */}
        {!isDefinitiveEnvoyee && (
          <p style={{ marginTop: '0.75rem', color: '#64748b', fontSize: '0.78rem', fontStyle: 'italic' }}>
            ℹ️ Règle CGI LFI 2026 : Le statut du dossier doit obligatoirement basculer à <strong>'PRIMITIVE_ENVOYÉE'</strong>, puis à <strong>'DÉFINITIVE_ENVOYÉE'</strong> lors de la validation des montants par l’agent pour débloquer l’imputation du crédit d’impôt.
          </p>
        )}

        {/* ── Formulaire 1 : Émission Notification Primitive ── */}
        {showPrimitiveForm && !isPrimitiveEnvoyee && (
          <form
            onSubmit={handleEmettrePrimitive}
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
              Ouvre un délai légal de réponse de 30 jours à compter de l'envoi. Stocke la date d'émission et bascule le statut à <strong>'PRIMITIVE_ENVOYÉE'</strong>.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
              <label className="field">
                <span>Montant redressement proposé (Ar)</span>
                <input
                  type="number"
                  value={principalRedressement}
                  disabled
                  readOnly
                />
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
              <span>Motifs & Observations du vérificateur</span>
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
            onSubmit={handleEmettreDefinitive}
            style={{
              marginTop: '1.25rem',
              padding: '1.25rem',
              border: '1px solid #ddd6fe',
              borderRadius: '10px',
              backgroundColor: '#f5f3ff',
            }}
          >
            <h3 style={{ margin: '0 0 0.5rem', color: '#5b21b6', fontSize: '1rem' }}>
              Validation des Montants & Notification Définitive (Décision finale)
            </h3>
            <p style={{ margin: '0 0 1rem', color: '#475569', fontSize: '0.82rem' }}>
              Clôture la phase contradictoire. Acte exécutoire fixant définitivement la dette fiscale. Bascule le statut à <strong>'DÉFINITIVE_ENVOYÉE'</strong> et <strong>débloque l'imputation du crédit d'impôt</strong>.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
              <label className="field">
                <span>Montant définitif en principal validé (Ar)</span>
                <input
                  type="number"
                  value={principalRedressement}
                  disabled
                  readOnly
                />
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
            onSubmit={handleImputerCredit}
            style={{
              marginTop: '1.25rem',
              padding: '1.25rem',
              border: '1px solid #a7f3d0',
              borderRadius: '10px',
              backgroundColor: '#ecfdf5',
            }}
          >
            <h3 style={{ margin: '0 0 0.5rem', color: '#065f46', fontSize: '1rem' }}>
              Imputation légale directe du Crédit d'Impôt (Art. 01.01.15 & 01.02.06 CGI 2026)
            </h3>
            <p style={{ margin: '0 0 1rem', color: '#475569', fontSize: '0.82rem' }}>
              L'excédent de versements ou d'acomptes provisionnels antérieurs peut être imputé de plein droit sur le redressement issu de la notification définitive.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
              <label className="field">
                <span>Dette totale exécutoire (Ar)</span>
                <input
                  type="text"
                  value={formatAriary(totalDetteInitiale)}
                  disabled
                  readOnly
                />
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
      </div>

      {/* Modal d'affichage et d'impression du document officiel */}
      <NotificationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        type={modalType}
        declaration={declaration}
        redressementDetails={{
          principal: principalRedressement,
          amende: amendeFiscale,
          total: totalDetteInitiale,
        }}
      />
    </section>
  );
}
