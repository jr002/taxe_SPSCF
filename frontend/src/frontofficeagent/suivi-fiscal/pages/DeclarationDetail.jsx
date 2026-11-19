import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
  getDeclarationById,
  emettreNotificationPrimitive,
  emettreNotificationDefinitive,
  imputerCreditImpot,
  getRelances,
  createRelance,
  getErrorMessage,
} from '@/api';
import { formatAriary, ouAbsent, toNumber } from '@/utils';
import { NotificationModal, DemandeEclaircissementModal } from '@/components/common';
import DeclarationSummaryCards from '@/frontofficeagent/suivi-fiscal/components/DeclarationSummaryCards';
import ProcedureContradictoireTimeline from '@/frontofficeagent/suivi-fiscal/components/ProcedureContradictoireTimeline';
import ProcedureActionForms from '@/frontofficeagent/suivi-fiscal/components/ProcedureActionForms';

/**
 * Libellés lisibles des statuts stockés dans `declarations.statut` : la base
 * contient des codes (`non_conforme`, `PRIMITIVE_ENVOYÉE`…) qui ne doivent pas
 * apparaître tels quels dans l'interface.
 */
const STATUT_DOSSIER = {
  conforme: {
    label: 'Conforme',
    className: 'conforme',
    hint: 'Aucun écart de TVA relevé sur cette déclaration.',
  },
  non_conforme: {
    label: 'Écart constaté',
    className: 'surveillance',
    hint: 'Un écart a été relevé ; la procédure contradictoire n’est pas encore engagée.',
  },
  'primitive_envoyée': {
    label: 'Notification primitive envoyée',
    className: 'primitive',
    hint: 'Phase contradictoire en cours : le contribuable dispose de 30 jours pour répondre.',
  },
  'définitive_envoyée': {
    label: 'Notification définitive envoyée',
    className: 'definitive',
    hint: 'La dette est arrêtée et la procédure contradictoire est clôturée.',
  },
};

const formatPct = (value) =>
  `${Number(value || 0).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`;

/**
 * Page de consultation et de gestion détaillée d'une déclaration fiscale
 * Intègre la procédure contradictoire de redressement (code des procédures
 * fiscales, art. V-02 à V-07 ; imputation du crédit : code des impôts,
 * art. 01.01.15 IR et 01.02.06 IS) :
 * - Notification Primitive (délai de réponse 30 jours, art. V-04)
 * - Statut PRIMITIVE_ENVOYÉE
 * - Notification Définitive (validation agent, art. V-07)
 * - Statut DÉFINITIVE_ENVOYÉE
 * - Déblocage de l'imputation du crédit d'impôt (Art. 01.01.15 IR & 01.02.06 IS)
 * - Demande d'Éclaircissements et de Justifications (art. V-02), stockée dans `relances`
 */
export default function DeclarationDetail() {
  const { id } = useParams();
  const location = useLocation();
  const [declaration, setDeclaration] = useState(location.state?.declaration || null);
  const [loading, setLoading] = useState(!declaration);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const feedbackRef = useRef(null);

  // Le retour se rend en haut de page, loin des actes de procédure : le ramener à l'écran.
  useEffect(() => {
    if (feedbackRef.current) feedbackRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [error, actionSuccess]);

  // États pour les formulaires d'actions
  const [showPrimitiveForm, setShowPrimitiveForm] = useState(false);
  const [showDefinitiveForm, setShowDefinitiveForm] = useState(false);
  const [showImputationForm, setShowImputationForm] = useState(false);
  const [showEclaircissementForm, setShowEclaircissementForm] = useState(false);

  // Modal d'aperçu officiel
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('primitive');
  const [eclaircissementModalOpen, setEclaircissementModalOpen] = useState(false);

  // Champs de saisie
  const [observations, setObservations] = useState('');
  const [prorogationJours, setProrogationJours] = useState(0);
  const [creditDisponible, setCreditDisponible] = useState('');
  const [montantAImputer, setMontantAImputer] = useState('');
  const [eclaircissementQuestions, setEclaircissementQuestions] = useState('');
  const [eclaircissementRelance, setEclaircissementRelance] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadDeclaration = async () => {
      setLoading(true);
      try {
        const result = await getDeclarationById(id);
        if (isMounted) {
          setDeclaration(result);
          if (result?.credit_impot) {
            setCreditDisponible(String(result.credit_impot));
          }
          if (result?.observations_agent) {
            setObservations(result.observations_agent);
          }
        }
      } catch (requestError) {
        if (isMounted) {
          setError(getErrorMessage(requestError));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadDeclaration();

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Une demande d'éclaircissement déjà émise pour cette déclaration bloque le formulaire
  const idContribuable = declaration?.id_contribuable;
  useEffect(() => {
    if (!idContribuable) return undefined;
    let isMounted = true;

    const loadEclaircissement = async () => {
      try {
        const result = await getRelances({
          id_contribuable: idContribuable,
          type_relance: 'demande_eclaircissement',
          limit: 100,
        });
        const existante = (result.data || []).find(
          (relance) => Number(relance.id_declaration) === Number(id)
        );
        if (isMounted) {
          setEclaircissementRelance(existante || null);
        }
      } catch {
        // la demande est facultative : son indisponibilité ne bloque pas la fiche
      }
    };

    void loadEclaircissement();

    return () => {
      isMounted = false;
    };
  }, [id, idContribuable]);

  // Les actions de procédure renvoient la ligne mise à jour, sans les informations
  // du contribuable (NIF, raison sociale, centre gestionnaire) portées par la fiche.
  // On relit la déclaration complète pour qu'un courrier imprimé n'affiche que des
  // données réellement enregistrées.
  const rafraichirDeclaration = async () => {
    try {
      const result = await getDeclarationById(id);
      setDeclaration(result);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  if (loading && !declaration) {
    return <p className="page status" role="status">Chargement des données de la déclaration...</p>;
  }

  if (error && !declaration) {
    return (
      <section className="page error">
        <h1>Déclaration indisponible</h1>
        <p>{error || 'Cette déclaration est introuvable.'}</p>
        <Link className="primary detail-back" to="/suivi">
          Retour au dossier fiscal
        </Link>
      </section>
    );
  }

  const tvaPayee = toNumber(declaration.tva_payee);
  const tvaTheorique = toNumber(declaration.tva_theorique);
  const ecart = tvaTheorique - tvaPayee;

  // Estimation affichée à l'écran, jamais imprimée : le principal proposé est le
  // plus souvent le montant déjà enregistré au dossier, à défaut l'écart calculé.
  // L'amende de 40 % n'existe dans aucune colonne — elle n'est qu'une indication
  // de ce que l'administration pourra liquider, et le courrier l'affiche « Non
  // liquidé au dossier ».
  const principalEnregistre = Number(declaration.montant_redressement) > 0;
  const principalPropose = Number(declaration.montant_redressement) || Math.max(0, ecart);
  const estimationAmende = principalPropose * 0.4;

  const statut = String(declaration.statut || '').toUpperCase();
  const isPrimitiveEnvoyee = statut === 'PRIMITIVE_ENVOYÉE';
  const isDefinitiveEnvoyee = statut === 'DÉFINITIVE_ENVOYÉE';
  const isEclaircissementEmis = Boolean(eclaircissementRelance);
  const statutInfo = STATUT_DOSSIER[statut.toLocaleLowerCase('fr')] || {
    label: declaration.statut ? String(declaration.statut).replace(/_/g, ' ') : 'Dossier suivi',
    className: '',
    hint: '',
  };

  const tauxCouverture = tvaTheorique > 0 ? (tvaPayee / tvaTheorique) * 100 : null;
  const tauxEcart = tvaTheorique > 0 ? (ecart / tvaTheorique) * 100 : null;
  let lecture;
  if (tvaTheorique <= 0) {
    lecture = 'Aucune TVA théorique n’est renseignée : l’écart ne peut pas être calculé.';
  } else if (ecart <= 0) {
    lecture = `La TVA payée couvre ${formatPct(tauxCouverture)} de la TVA théorique : aucun écart à signaler.`;
  } else {
    const niveau = tauxEcart <= 25
      ? 'sous le seuil de vigilance de 25 %'
      : tauxEcart <= 50
        ? 'dans la zone de risque moyen (25 à 50 %)'
        : 'au-delà du seuil de risque de 50 %';
    lecture = `La TVA payée couvre ${formatPct(tauxCouverture)} de la TVA théorique. L’écart de ${formatAriary(ecart)} (${formatPct(tauxEcart)}) se situe ${niveau}.`;
  }

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
      await emettreNotificationPrimitive(id, {
        date_emission: new Date(),
        prorogation_jours: Number(prorogationJours) || 0,
        montant_redressement: principalPropose,
        credit_impot: Number(creditDisponible) || 0,
        observations_agent: observations,
      });
      await rafraichirDeclaration();
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
      await emettreNotificationDefinitive(id, {
        date_emission: new Date(),
        montant_valide: principalPropose,
        credit_impot: Number(creditDisponible) || Number(declaration.credit_impot) || 0,
        observations_agent: observations,
      });
      await rafraichirDeclaration();
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

    const creditNum = toNumber(creditDisponible) || toNumber(declaration.credit_impot);
    const montantNum = toNumber(montantAImputer) || creditNum;
    const imputableMax = Math.max(0, Math.min(creditNum, principalPropose));

    if (montantNum <= 0 || montantNum > imputableMax) {
      setError(
        `Montant à imputer hors bornes : entre 0 et ${formatAriary(imputableMax)} ` +
          '(limité par le crédit disponible et par le principal du redressement).'
      );
      return;
    }

    setActionLoading(true);
    setActionSuccess('');
    setError('');

    try {
      await imputerCreditImpot(id, {
        credit_impot: creditNum,
        montant_a_imputer: montantNum,
        observations_agent: observations,
      });
      await rafraichirDeclaration();
      setActionSuccess("Crédit d'impôt imputé avec succès sur la notification définitive.");
      setShowImputationForm(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  // Action : Émettre une Demande d'Éclaircissements et de Justifications (CPF art. V-02)
  const handleEmettreEclaircissement = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setActionSuccess('');
    setError('');

    try {
      const res = await createRelance({
        id_contribuable: declaration.id_contribuable,
        id_declaration: Number(id),
        annee: declaration.annee,
        type_relance: 'demande_eclaircissement',
        statut: 'emise',
        montant_du: 0,
        date_emission: new Date(),
        observations: eclaircissementQuestions,
      });
      setEclaircissementRelance(res);
      setActionSuccess(
        "Demande d'Éclaircissements émise. Ouverture du délai de réponse de 30 jours avant la notification primitive."
      );
      setShowEclaircissementForm(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenModal = (type) => {
    if (type === 'eclaircissement') {
      setEclaircissementModalOpen(true);
      return;
    }
    setModalType(type);
    setModalOpen(true);
  };

  return (
    <section className="page declaration-page">
      <Link className="detail-back-link" to="/suivi">
        ← Retour au dossier fiscal
      </Link>

      <div className="page-heading declaration-page-heading">
        <p className="eyebrow">Dossier fiscal · Contrôle</p>
        <div className="contribuable-heading-row">
          <h1>{declaration.raison_sociale || 'Contribuable non renseigné'}</h1>
          <span className={`badge ${statutInfo.className}`}>{statutInfo.label}</span>
        </div>
        <p>
          NIF : <strong>{ouAbsent(declaration.nif)}</strong> · Exercice fiscal :{' '}
          <strong>{declaration.annee}</strong> · Secteur : {ouAbsent(declaration.secteur_activite)} ·
          Déclaration n° <strong>{declaration.id_declaration}</strong>
        </p>
      </div>

      {actionSuccess && (
        <div ref={feedbackRef} className="form-submit-message success" role="status" style={{ marginBottom: '1.25rem' }}>
          ✓ {actionSuccess}
        </div>
      )}
      {error && (
        <div ref={feedbackRef} className="form-submit-message error" role="alert" style={{ marginBottom: '1.25rem' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Cartes de synthèse financière et déclarative */}
      <DeclarationSummaryCards
        declaration={declaration}
        ecart={ecart}
        statut={statutInfo}
        tauxEcart={tauxEcart}
      />

      <p className="dossier-lecture">
        <strong>Lecture rapide.</strong> {lecture}
      </p>

      {/* Procédure contradictoire & redressements (code des procédures fiscales) */}
      <div className="procedure-card" style={{ marginTop: '2rem' }}>
        <ProcedureContradictoireTimeline
          declaration={declaration}
          ecart={ecart}
          isPrimitiveEnvoyee={isPrimitiveEnvoyee}
          isDefinitiveEnvoyee={isDefinitiveEnvoyee}
          isEclaircissementEmis={isEclaircissementEmis}
          dateEclaircissement={eclaircissementRelance?.date_emission}
          questionsEclaircissement={eclaircissementRelance?.observations}
          joursRestants={joursRestants}
          principalRedressement={principalPropose}
          principalEnregistre={principalEnregistre}
          amendeFiscale={estimationAmende}
          onOpenModal={handleOpenModal}
        />

        <ProcedureActionForms
          principalRedressement={principalPropose}
          isPrimitiveEnvoyee={isPrimitiveEnvoyee}
          isDefinitiveEnvoyee={isDefinitiveEnvoyee}
          isEclaircissementEmis={isEclaircissementEmis}
          actionLoading={actionLoading}
          showPrimitiveForm={showPrimitiveForm}
          setShowPrimitiveForm={setShowPrimitiveForm}
          showDefinitiveForm={showDefinitiveForm}
          setShowDefinitiveForm={setShowDefinitiveForm}
          showEclaircissementForm={showEclaircissementForm}
          setShowEclaircissementForm={setShowEclaircissementForm}
          showImputationForm={showImputationForm}
          setShowImputationForm={setShowImputationForm}
          eclaircissementQuestions={eclaircissementQuestions}
          setEclaircissementQuestions={setEclaircissementQuestions}
          prorogationJours={prorogationJours}
          setProrogationJours={setProrogationJours}
          creditDisponible={creditDisponible}
          setCreditDisponible={setCreditDisponible}
          montantAImputer={montantAImputer}
          setMontantAImputer={setMontantAImputer}
          observations={observations}
          setObservations={setObservations}
          onEmettrePrimitive={handleEmettrePrimitive}
          onEmettreDefinitive={handleEmettreDefinitive}
          onEmettreEclaircissement={handleEmettreEclaircissement}
          onImputerCredit={handleImputerCredit}
        />
      </div>

      {/* Modal d'affichage et d'impression du document officiel */}
      <NotificationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        type={modalType}
        declaration={declaration}
      />

      <DemandeEclaircissementModal
        isOpen={eclaircissementModalOpen}
        onClose={() => setEclaircissementModalOpen(false)}
        declaration={declaration}
        questions={eclaircissementRelance?.observations || eclaircissementQuestions}
        dateEmission={eclaircissementRelance?.date_emission}
      />
    </section>
  );
}
