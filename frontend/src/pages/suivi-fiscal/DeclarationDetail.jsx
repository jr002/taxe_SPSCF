import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
  getDeclarationById,
  emettreNotificationPrimitive,
  emettreNotificationDefinitive,
  imputerCreditImpot,
  getErrorMessage,
} from '../../api/api';
import { toNumber } from '../../utils/formatters';
import NotificationModal from '../../components/common/NotificationModal';
import DeclarationSummaryCards from './components/DeclarationSummaryCards';
import ProcedureContradictoireTimeline from './components/ProcedureContradictoireTimeline';
import ProcedureActionForms from './components/ProcedureActionForms';

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

  // Calculs financiers associés au redressement
  const principalRedressement = Number(declaration.montant_redressement) || Math.max(0, ecart);
  const amendeFiscale = principalRedressement * 0.4;
  const totalDetteInitiale = principalRedressement + amendeFiscale;

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

  const handleOpenModal = (type) => {
    setModalType(type);
    setModalOpen(true);
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
          NIF : <strong>{declaration.nif || 'N/A'}</strong> · Exercice fiscal :{' '}
          <strong>{declaration.annee}</strong> · Secteur : {declaration.secteur_activite || 'Général'}
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

      {/* Cartes de synthèse financière et déclarative */}
      <DeclarationSummaryCards
        declaration={declaration}
        ecart={ecart}
        isPrimitiveEnvoyee={isPrimitiveEnvoyee}
        isDefinitiveEnvoyee={isDefinitiveEnvoyee}
      />

      {/* Procédure contradictoire & redressements (CGI LFI 2026) */}
      <div className="procedure-card" style={{ marginTop: '2rem' }}>
        <ProcedureContradictoireTimeline
          declaration={declaration}
          ecart={ecart}
          isPrimitiveEnvoyee={isPrimitiveEnvoyee}
          isDefinitiveEnvoyee={isDefinitiveEnvoyee}
          joursRestants={joursRestants}
          principalRedressement={principalRedressement}
          amendeFiscale={amendeFiscale}
          onOpenModal={handleOpenModal}
        />

        <ProcedureActionForms
          principalRedressement={principalRedressement}
          totalDetteInitiale={totalDetteInitiale}
          isPrimitiveEnvoyee={isPrimitiveEnvoyee}
          isDefinitiveEnvoyee={isDefinitiveEnvoyee}
          actionLoading={actionLoading}
          showPrimitiveForm={showPrimitiveForm}
          setShowPrimitiveForm={setShowPrimitiveForm}
          showDefinitiveForm={showDefinitiveForm}
          setShowDefinitiveForm={setShowDefinitiveForm}
          showImputationForm={showImputationForm}
          setShowImputationForm={setShowImputationForm}
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
          onImputerCredit={handleImputerCredit}
        />
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
