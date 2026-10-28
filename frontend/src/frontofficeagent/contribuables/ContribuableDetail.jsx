import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

import {
  createRelance,
  getContribuableById,
  getErrorMessage,
  getRelancesByContribuable,
  updateRelance,
} from '@/api';
import { getRegime } from '@/utils/decisionnel.utils';
import { formatDateRelance, relanceType } from '@/utils/relance.utils';
import { toNumber } from '@/utils/formatters';
import { getCategorie, getFicheCategorie } from '@/utils/contribuable.utils';
import DossierFiscalNavigation from '@/components/common/DossierFiscalNavigation';
import RappelOrdreModal from '@/frontofficeagent/relance/components/RappelOrdreModal';
import ClassificationPanel from './components/ClassificationPanel';
import ContribuableHeader from './components/ContribuableHeader';
import ContribuableOverview from './components/ContribuableOverview';
import DeclarationHistory from './components/DeclarationHistory';
import DroitCommunicationPanel from './components/DroitCommunicationPanel';
import RecoupementsPanel from './components/RecoupementsPanel';
import RelancePanel from './components/RelancePanel';
import LienAccesModal from './components/LienAccesModal';
import { countExportRows, exportFicheContribuable } from './utils/exportFicheContribuable';

/** Libellé et infobulle du bouton d'export, selon l'onglet affiché. */
const EXPORT_LABELS = {
  overview: {
    label: '📥 Exporter la synthèse',
    title: 'Exporter la synthèse annuelle (TVA payée, TVA théorique, écart) en fichier Excel',
  },
  classification: {
    label: '📥 Exporter la nature d’impôt',
    title: 'Exporter la fiche réglementaire de la catégorie en fichier Excel',
  },
  declarations: {
    label: '📥 Exporter les déclarations',
    title: 'Exporter la liste des déclarations affichée en fichier Excel',
  },
  relances: {
    label: '📥 Exporter les relances',
    title: "Exporter l'historique des relances de ce contribuable en fichier Excel",
  },
};

function getActiveTab(pathname) {
  if (pathname.endsWith('/classification')) return 'classification';
  if (pathname.endsWith('/declarations')) return 'declarations';
  if (pathname.endsWith('/recoupements')) return 'recoupements';
  if (pathname.endsWith('/droits-communication')) return 'droits';
  if (pathname.endsWith('/relances')) return 'relances';
  return 'overview';
}

export default function ContribuableDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const sourceContribuable = location.state?.contribuable;

  const [contribuable, setContribuable] = useState(sourceContribuable || null);
  const [declarations, setDeclarations] = useState(
    sourceContribuable?.declarations || [],
  );
  const [loading, setLoading] = useState(!sourceContribuable);
  const [error, setError] = useState('');
  const [relances, setRelances] = useState([]);
  const [rappelModalOpen, setRappelModalOpen] = useState(false);
  const [rappelModalType, setRappelModalType] = useState('rappel1');
  const [rappelDossier, setRappelDossier] = useState(null);
  const [relanceSubmitting, setRelanceSubmitting] = useState(false);
  const [relanceSuccess, setRelanceSuccess] = useState('');
  const [relanceError, setRelanceError] = useState('');
  const [exportSuccess, setExportSuccess] = useState('');
  const [lienAccesOpen, setLienAccesOpen] = useState(false);
  const [currentTimestamp] = useState(() => Date.now());

  const activeTab = getActiveTab(location.pathname);

  useEffect(() => {
    if (sourceContribuable) return;

    const loadHistory = async () => {
      setLoading(true);

      try {
        const result = await getContribuableById(id);
        setContribuable(result);
        setDeclarations(result.declarations || []);
      } catch (requestError) {
        setError(getErrorMessage(requestError));
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [id, sourceContribuable]);

  // Les relances viennent de la table `relances`, filtrée par le périmètre de l'agent.
  useEffect(() => {
    let isMounted = true;

    const loadRelances = async () => {
      try {
        const result = await getRelancesByContribuable(id);
        if (isMounted) setRelances(result || []);
      } catch (requestError) {
        if (isMounted) setRelanceError(getErrorMessage(requestError));
      }
    };

    void loadRelances();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const currentRegime = contribuable ? getRegime(contribuable) : 'IS';
  const totalPaid = declarations.reduce(
    (total, row) => total + toNumber(row.tva_payee),
    0,
  );
  const fiche = getFicheCategorie(
    contribuable ? getCategorie(contribuable) : 'Petit',
  );

  const chartYears = useMemo(
    () =>
      [...new Set(declarations.map((row) => Number(row.annee)).filter(Boolean))]
        .sort((a, b) => a - b)
        .slice(-5),
    [declarations],
  );

  const annualData = useMemo(
    () =>
      chartYears.map((year) => {
        const yearDeclarations = declarations.filter(
          (row) => Number(row.annee) === year,
        );

        return {
          year,
          tva: yearDeclarations.length,
          regimeCount: yearDeclarations.filter(
            (row) => getRegime(row) === currentRegime,
          ).length,
        };
      }),
    [chartYears, currentRegime, declarations],
  );

  const curveData = useMemo(
    () =>
      chartYears.slice(-2).map((year) => {
        const yearDeclarations = declarations.filter(
          (row) => Number(row.annee) === year,
        );

        return {
          year,
          paid: yearDeclarations.reduce(
            (total, row) => total + toNumber(row.tva_payee),
            0,
          ),
          theoretical: yearDeclarations.reduce(
            (total, row) => total + toNumber(row.tva_theorique),
            0,
          ),
        };
      }),
    [chartYears, declarations],
  );

  const maxBars = Math.max(
    ...annualData.flatMap((item) => [item.tva, item.regimeCount]),
    1,
  );
  const curveMax = Math.max(
    ...curveData.flatMap((item) => [item.paid, item.theoretical]),
    1,
  );

  const lastDeclaration = declarations[0];
  const totalDuRelance = declarations.reduce(
    (total, declaration) =>
      total +
      (toNumber(declaration.montant_net_a_payer) ||
        Math.max(0, toNumber(declaration.tva_theorique) - toNumber(declaration.tva_payee))),
    0,
  );

  const referenceDate =
    lastDeclaration?.date_limite_reponse ||
    lastDeclaration?.date_notification_primitive ||
    lastDeclaration?.date_creation;

  const dossierRelance = contribuable
    ? {
        nif: contribuable.nif,
        raisonSociale: contribuable.raison_sociale,
        secteur: contribuable.secteur_activite,
        annee:
          lastDeclaration?.annee || new Date(currentTimestamp).getFullYear(),
        montantDu: totalDuRelance,
        joursRetard: referenceDate
          ? Math.max(
              0,
              Math.floor(
                (currentTimestamp - new Date(referenceDate).getTime()) /
                  86_400_000,
              ),
            )
          : 0,
      }
    : null;

  const issueRelance = async (type) => {
    if (!dossierRelance) return;

    setRelanceSubmitting(true);
    setRelanceSuccess('');
    setRelanceError('');

    try {
      const created = await createRelance({
        id_contribuable: Number(id),
        id_declaration: lastDeclaration?.id_declaration ?? null,
        type_relance: type,
        statut: 'emise',
        annee: Number(dossierRelance.annee) || new Date().getFullYear(),
        montant_du: dossierRelance.montantDu,
        jours_retard: dossierRelance.joursRetard,
        date_emission: new Date().toISOString(),
      });

      setRelances((previous) => [created, ...previous]);
      setRappelDossier({ ...dossierRelance, dateEmission: created?.date_emission });
      setRappelModalType(type);
      setRappelModalOpen(true);
      setRelanceSuccess(
        `${relanceType(type).label} enregistré le ${formatDateRelance(created?.date_emission)}.`
      );
    } catch (requestError) {
      setRelanceError(getErrorMessage(requestError));
    } finally {
      setRelanceSubmitting(false);
    }
  };

  const regularize = async () => {
    const enCours = relances.find((relance) => relance.statut === 'emise');

    if (!enCours) {
      setRelanceSuccess('');
      setRelanceError('Aucune relance en cours à régulariser pour ce contribuable.');
      return;
    }

    setRelanceSubmitting(true);
    setRelanceSuccess('');
    setRelanceError('');

    try {
      const updated = await updateRelance(enCours.id_relance, {
        statut: 'regularisee',
        date_regularisation: new Date().toISOString(),
      });

      setRelances((previous) =>
        previous.map((relance) => (relance.id_relance === updated.id_relance ? updated : relance))
      );
      setRelanceSuccess(
        `Relance « ${relanceType(enCours.type_relance).label} » régularisée le ` +
          `${formatDateRelance(updated.date_regularisation)}.`
      );
    } catch (requestError) {
      setRelanceError(getErrorMessage(requestError));
    } finally {
      setRelanceSubmitting(false);
    }
  };

  const openHistoryEntry = (relance) => {
    if (!dossierRelance) return;

    setRappelDossier({
      ...dossierRelance,
      annee: relance.annee ?? dossierRelance.annee,
      montantDu: toNumber(relance.montant_du) || dossierRelance.montantDu,
      dateEmission: relance.date_emission,
    });
    setRappelModalType(relance.type_relance);
    setRappelModalOpen(true);
  };

  const exportPayload = {
    activeTab,
    annualData,
    contribuable,
    declarations,
    fiche,
    relances,
  };
  const exportLabels = EXPORT_LABELS[activeTab] || EXPORT_LABELS.overview;
  const exportDisabled = countExportRows(exportPayload) === 0;

  const handleExport = () => {
    const result = exportFicheContribuable(exportPayload);

    setExportSuccess(
      result.count
        ? `${result.count} ligne(s) exportée(s) dans un fichier Excel (feuille « ${result.label} »).`
        : '',
    );
  };

  if (loading) {
    return <p className="page status">Chargement de l'historique du contribuable...</p>;
  }

  if (error || !contribuable) {
    return (
      <section className="page error">
        <h1>Contribuable indisponible</h1>
        <p>{error || 'Aucune donnée disponible pour ce contribuable.'}</p>
        <Link className="primary detail-back" to="/contribuables">
          Retour à la liste des contribuables
        </Link>
      </section>
    );
  }

  return (
    <>
      <section className="page declaration-page contribuable-detail-page">
        <DossierFiscalNavigation mode="collecte" />

        <ContribuableHeader
          activeTab={activeTab}
          contribuable={contribuable}
          declarationsCount={declarations.length}
          exportDisabled={exportDisabled}
          exportLabel={exportLabels.label}
          exportTitle={exportLabels.title}
          fiche={fiche}
          id={id}
          onExport={handleExport}
          onPartager={() => setLienAccesOpen(true)}
        />

        {activeTab === 'overview' && (
          <Link
            className="primary detail-back"
            to={`/contribuables/${id}/confrontation`}
            state={{ contribuable }}
          >
            ⚖️ Ouvrir la confrontation
          </Link>
        )}

        {activeTab === 'declarations' && (
          <div className="register-toolbar">
            <Link
              className="primary add-declaration-button"
              to={`/contribuables/${id}/declarations/nouveau`}
            >
              + Ajouter une déclaration
            </Link>
            <Link
              className="add-declaration-button"
              to={`/contribuables/${id}/confrontation`}
              state={{ contribuable }}
            >
              ⚖️ Retour à la confrontation
            </Link>
          </div>
        )}

        {exportSuccess && (
          <p className="success form-submit-message" role="status">
            {exportSuccess}
          </p>
        )}

        {activeTab === 'overview' && (
          <ContribuableOverview
            annualData={annualData}
            curveData={curveData}
            currentRegime={currentRegime}
            declarations={declarations}
            maxBars={maxBars}
            curveMax={curveMax}
            totalPaid={totalPaid}
          />
        )}

        {activeTab === 'classification' && <ClassificationPanel fiche={fiche} />}

        {activeTab === 'declarations' && (
          <DeclarationHistory
            declarations={declarations}
            onOpenDeclaration={(declaration) =>
              navigate(`/suivi/${declaration.id_declaration}`, {
                state: { declaration },
              })
            }
          />
        )}

        {activeTab === 'recoupements' && <RecoupementsPanel id={id} />}

        {activeTab === 'droits' && <DroitCommunicationPanel id={id} />}

        {activeTab === 'relances' && (
          <RelancePanel
            error={relanceError}
            montantDu={totalDuRelance}
            onIssue={issueRelance}
            onOpenHistoryEntry={openHistoryEntry}
            onRegularize={regularize}
            relances={relances}
            submitting={relanceSubmitting}
            success={relanceSuccess}
          />
        )}
      </section>

      <RappelOrdreModal
        isOpen={rappelModalOpen}
        onClose={() => setRappelModalOpen(false)}
        dossier={rappelDossier}
        type={rappelModalType}
      />
      {lienAccesOpen && (
        <LienAccesModal
          ouvert
          contribuable={contribuable}
          onFermer={() => setLienAccesOpen(false)}
        />
      )}
    </>
  );
}
