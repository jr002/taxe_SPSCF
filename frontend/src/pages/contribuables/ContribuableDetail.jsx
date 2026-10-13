import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

import { createDeclaration, getContribuableById, getErrorMessage } from '../../api/api';
import { getRegime } from '../../utils/decisionnel.utils';
import { toNumber } from '../../utils/formatters';
import { getCategorie, getFicheCategorie } from '../../utils/contribuable.utils';
import RappelOrdreModal from '../relance/components/RappelOrdreModal';
import ClassificationPanel from './components/ClassificationPanel';
import ContribuableHeader from './components/ContribuableHeader';
import ContribuableOverview from './components/ContribuableOverview';
import DeclarationForm from './components/DeclarationForm';
import DeclarationHistory from './components/DeclarationHistory';
import RelancePanel from './components/RelancePanel';
import { countExportRows, exportFicheContribuable } from './utils/exportFicheContribuable';

const HISTORY_KEY = 'relance_historique';

/** Libellé et infobulle du bouton d'export, selon l'onglet affiché. */
const EXPORT_LABELS = {
  overview: {
    label: '📥 Exporter la synthèse',
    title: 'Exporter la synthèse annuelle (TVA payée, TVA théorique, écart) en fichier Excel',
  },
  classification: {
    label: '📥 Exporter le régime fiscal',
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

const REQUIRED_DECLARATION_FIELDS = [
  'annee',
  'ca',
  'benefice',
  'tva_collectee',
  'tva_deductible',
  'tva_payee',
];

const initialDeclarationForm = () => ({
  annee: String(new Date().getFullYear()),
  ca: '',
  benefice: '',
  tva_collectee: '',
  tva_deductible: '',
  tva_payee: '',
});

function getActiveTab(pathname) {
  if (pathname.endsWith('/classification')) return 'classification';
  if (pathname.endsWith('/declarations')) return 'declarations';
  if (pathname.endsWith('/relances')) return 'relances';
  return 'overview';
}

function isDeclarationFormValid(form) {
  return (
    !REQUIRED_DECLARATION_FIELDS.some(
      (field) => form[field] === '' || Number(form[field]) < 0,
    ) &&
    Number.isInteger(Number(form.annee)) &&
    Number(form.annee) >= 2000 &&
    Number(form.annee) <= 2100
  );
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
  const [showDeclarationForm, setShowDeclarationForm] = useState(false);
  const [declarationForm, setDeclarationForm] = useState(initialDeclarationForm);
  const [declarationError, setDeclarationError] = useState('');
  const [declarationSuccess, setDeclarationSuccess] = useState('');
  const [declarationSubmitting, setDeclarationSubmitting] = useState(false);
  const [relanceHistory, setRelanceHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    } catch {
      return [];
    }
  });
  const [rappelModalOpen, setRappelModalOpen] = useState(false);
  const [rappelModalType, setRappelModalType] = useState('rappel1');
  const [rappelDossier, setRappelDossier] = useState(null);
  const [relanceSuccess, setRelanceSuccess] = useState('');
  const [exportSuccess, setExportSuccess] = useState('');
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

  const handleDeclarationInputChange = ({ target: { name, value } }) => {
    setDeclarationForm((previous) => ({ ...previous, [name]: value }));
    setDeclarationError('');
    setDeclarationSuccess('');
  };

  const handleDeclarationSubmit = async (event) => {
    event.preventDefault();
    setDeclarationError('');
    setDeclarationSuccess('');

    if (!isDeclarationFormValid(declarationForm)) {
      setDeclarationError(
        'Veuillez renseigner une année entre 2000 et 2100 et des montants positifs.',
      );
      return;
    }

    setDeclarationSubmitting(true);

    try {
      const result = await createDeclaration({
        id_contribuable: Number(id),
        annee: Number(declarationForm.annee),
        ca: Number(declarationForm.ca),
        benefice: Number(declarationForm.benefice),
        tva_collectee: Number(declarationForm.tva_collectee),
        tva_deductible: Number(declarationForm.tva_deductible),
        tva_payee: Number(declarationForm.tva_payee),
        regime_fiscal: contribuable.regime_fiscal || currentRegime,
      });

      const updatedDeclarations = [result.declaration || result, ...declarations].sort(
        (first, second) => Number(second.annee) - Number(first.annee),
      );

      setDeclarations(updatedDeclarations);
      setDeclarationForm(initialDeclarationForm());
      setDeclarationSuccess('La déclaration a été ajoutée au contribuable.');
      setShowDeclarationForm(false);
    } catch (requestError) {
      setDeclarationError(getErrorMessage(requestError));
    } finally {
      setDeclarationSubmitting(false);
    }
  };

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

  const addRelanceHistory = (type, typeLabel, statut) => {
    if (!dossierRelance) return null;

    const entry = {
      id: Date.now(),
      date: new Date().toLocaleDateString('fr-FR'),
      nif: dossierRelance.nif,
      raisonSociale: dossierRelance.raisonSociale,
      annee: dossierRelance.annee,
      type,
      typeLabel,
      montant: dossierRelance.montantDu,
      statut,
    };

    const updatedHistory = [entry, ...relanceHistory];
    setRelanceHistory(updatedHistory);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));

    return entry;
  };

  const issueRelance = (type) => {
    const labels = {
      rappel1: '1er Rappel',
      rappel2: '2e Rappel',
      miseEnDemeure: 'Mise en Demeure',
    };

    const entry = addRelanceHistory(type, labels[type], 'Emis');
    if (!entry) return;

    setRappelDossier(dossierRelance);
    setRappelModalType(type);
    setRappelModalOpen(true);
    setRelanceSuccess(`${entry.typeLabel} émis avec succès le ${entry.date}.`);
  };

  const regularize = () => {
    const entry = addRelanceHistory('regularise', 'Régularisé', 'Régularisé');
    if (entry) {
      setRelanceSuccess(`Dossier marqué comme régularisé le ${entry.date}. ✅`);
    }
  };

  const openHistoryEntry = (entry) => {
    if (!dossierRelance || entry.type === 'regularise') return;

    setRappelDossier({
      ...dossierRelance,
      annee: entry.annee,
      montantDu: entry.montant,
    });
    setRappelModalType(entry.type);
    setRappelModalOpen(true);
  };

  const toggleDeclarationForm = () => {
    setShowDeclarationForm((previous) => !previous);
    setDeclarationError('');
    setDeclarationSuccess('');
  };

  const exportPayload = {
    activeTab,
    annualData,
    contribuable,
    declarations,
    fiche,
    history: relanceHistory,
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
      <section className="page declaration-page">
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
          onToggleDeclarationForm={toggleDeclarationForm}
          showDeclarationForm={showDeclarationForm}
        />

        <Link
          className="primary detail-back"
          to={`/contribuables/${id}/confrontation`}
          state={{ contribuable }}
        >
          ⚖️ Ouvrir la confrontation
        </Link>

        {declarationSuccess && (
          <p className="success form-submit-message" role="status">
            {declarationSuccess}
          </p>
        )}

        {exportSuccess && (
          <p className="success form-submit-message" role="status">
            {exportSuccess}
          </p>
        )}

        {activeTab === 'declarations' && showDeclarationForm && (
          <DeclarationForm
            contribuable={contribuable}
            error={declarationError}
            form={declarationForm}
            onChange={handleDeclarationInputChange}
            onSubmit={handleDeclarationSubmit}
            submitting={declarationSubmitting}
          />
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

        {activeTab === 'relances' && (
          <RelancePanel
            history={relanceHistory}
            montantDu={totalDuRelance}
            nif={contribuable.nif}
            onIssue={issueRelance}
            onOpenHistoryEntry={openHistoryEntry}
            onRegularize={regularize}
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
    </>
  );
}
