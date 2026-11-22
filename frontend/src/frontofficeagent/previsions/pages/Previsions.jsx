import { useEffect, useMemo, useRef, useState } from 'react';
import { AccesRefuse, DataTable, ModaleConfirmation } from '@/components/common';
import { useTablePagination } from '@/hooks';
import {
  createPrevision,
  deletePrevision,
  getErrorMessage,
  getPrevisions,
  updatePrevision,
} from '@/api';
import { formatAriary, toNumber } from '@/utils';
import { formatEcart } from '@/frontofficeagent/confrontation/utils/confrontation.utils';
import {
  etatPrevision,
  prevuDe,
  tauxRealisation,
} from '@/frontofficeagent/previsions/utils/prevision.utils';

const formulaireVide = (anneeCourante) => ({
  annee: String(anneeCourante ?? new Date().getFullYear()),
  montant_prevu: '',
  observation: '',
});

/**
 * Prévisions de recette du centre : écran réservé au chef de centre. Une
 * prévision par année civile, confrontée à la recette réellement enregistrée
 * sur les déclarations des contribuables du centre.
 */
export default function Previsions({ currentUser = null }) {
  if (currentUser?.role !== 'chef_centre') {
    return (
      <AccesRefuse
        currentUser={currentUser}
        eyebrow="Espace de travail"
        titre="Prévisions de recette"
        message="Cet écran est réservé au chef de centre : il porte les objectifs de recette de son centre."
      />
    );
  }
  return <PrevisionsEcran />;
}

function PrevisionsEcran() {
  const [donnees, setDonnees] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(() => formulaireVide(new Date().getFullYear()));
  const [editionId, setEditionId] = useState(null);
  const [envoi, setEnvoi] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [suppression, setSuppression] = useState(null);
  const [suppressionEnCours, setSuppressionEnCours] = useState(false);
  const [suppressionErreur, setSuppressionErreur] = useState('');
  const [filtreAnnee, setFiltreAnnee] = useState('');
  const feedbackRef = useRef(null);
  const formRef = useRef(null);

  const charger = () => {
    getPrevisions()
      .then((data) => {
        setDonnees(data);
        setError('');
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setChargement(false));
  };

  useEffect(() => { charger(); }, []);

  useEffect(() => {
    if (feedbackRef.current) {
      feedbackRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [feedback]);

  const anneeCourante = donnees?.annee_courante ?? new Date().getFullYear();
  const moisEcoules = donnees?.mois_ecoules ?? new Date().getMonth() + 1;
  const previsions = useMemo(() => donnees?.previsions ?? [], [donnees]);
  const recettes = donnees?.recettes ?? {};
  const centre = donnees?.centre;

  const lignes = useMemo(() => {
    const filtrees = filtreAnnee
      ? previsions.filter((p) => String(p.annee) === filtreAnnee)
      : previsions;
    return [...filtrees].sort((a, b) => b.annee - a.annee);
  }, [previsions, filtreAnnee]);

  const pagination = useTablePagination(lignes, 10);

  const prevuCourant = prevuDe(previsions, anneeCourante);
  const recetteCourante = recettes[anneeCourante] ?? 0;
  const tauxCourant = tauxRealisation(prevuCourant, recetteCourante);
  const etatCourant = etatPrevision({
    prevu: prevuCourant,
    recette: recetteCourante,
    annee: anneeCourante,
    anneeCourante,
    moisEcoules,
  });

  const majChamp = (champ) => (event) => setForm((actuel) => ({ ...actuel, [champ]: event.target.value }));

  const annulerEdition = () => {
    setEditionId(null);
    setForm(formulaireVide(anneeCourante));
  };

  const soumettre = async (event) => {
    event.preventDefault();
    setEnvoi(true);
    setFeedback(null);
    const charge = {
      annee: Number(form.annee),
      montant_prevu: Number(form.montant_prevu),
      observation: form.observation.trim() || undefined,
    };
    try {
      if (editionId) {
        await updatePrevision(editionId, charge);
        setFeedback({ type: 'success', message: `Prévision ${charge.annee} mise à jour.` });
      } else {
        await createPrevision(charge);
        setFeedback({ type: 'success', message: `Prévision ${charge.annee} enregistrée pour le centre.` });
      }
      annulerEdition();
      charger();
    } catch (err) {
      setFeedback({ type: 'error', message: getErrorMessage(err) });
    } finally {
      setEnvoi(false);
    }
  };

  const ouvrirEdition = (ligne) => {
    setEditionId(ligne.id_prevision);
    setForm({
      annee: String(ligne.annee),
      montant_prevu: String(toNumber(ligne.montant_prevu)),
      observation: ligne.observation ?? '',
    });
    setFeedback(null);
    if (formRef.current) formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const confirmerSuppression = async () => {
    if (!suppression) return;
    setSuppressionEnCours(true);
    setSuppressionErreur('');
    try {
      await deletePrevision(suppression.id_prevision);
      if (editionId === suppression.id_prevision) annulerEdition();
      setSuppression(null);
      setFeedback({ type: 'success', message: `Prévision ${suppression.annee} supprimée.` });
      charger();
    } catch (err) {
      setSuppressionErreur(getErrorMessage(err));
    } finally {
      setSuppressionEnCours(false);
    }
  };

  const columns = [
    {
      key: 'annee',
      label: 'Année',
      render: (ligne) => (
        <>
          <strong>{ligne.annee}</strong>
          {ligne.annee === anneeCourante && <small>Exercice en cours</small>}
        </>
      ),
    },
    {
      key: 'montant_prevu',
      label: 'Montant prévu',
      render: (ligne) => formatAriary(ligne.montant_prevu),
    },
    {
      key: 'recette',
      label: 'Recette réelle',
      render: (ligne) => {
        const recette = recettes[ligne.annee];
        if (recette === undefined) {
          return (
            <>
              —<small>Hors fenêtre des 5 exercices</small>
            </>
          );
        }
        return (
          <>
            {formatAriary(recette)}
            {ligne.annee === anneeCourante && <small>À ce jour</small>}
          </>
        );
      },
    },
    {
      key: 'ecart',
      label: 'Écart recette − prévision',
      render: (ligne) => {
        const recette = recettes[ligne.annee];
        if (recette === undefined) return '—';
        const ecart = recette - toNumber(ligne.montant_prevu);
        return (
          <span className={ecart >= 0 ? 'prevision-ecart-pos' : 'prevision-ecart-neg'}>
            {formatEcart(ecart)}
          </span>
        );
      },
    },
    {
      key: 'etat',
      label: 'État',
      render: (ligne) => {
        const etat = etatPrevision({
          prevu: toNumber(ligne.montant_prevu),
          recette: recettes[ligne.annee] ?? 0,
          annee: ligne.annee,
          anneeCourante,
          moisEcoules,
        });
        return <span className={etat.badge}>{etat.label}</span>;
      },
    },
    {
      key: 'auteur',
      label: 'Saisie par',
      render: (ligne) => (ligne.agents ? `${ligne.agents.prenom} ${ligne.agents.nom}` : '—'),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (ligne) => (
        <div className="prevision-actions">
          <button type="button" onClick={() => ouvrirEdition(ligne)}>Modifier</button>
          <button
            type="button"
            className="danger"
            onClick={() => { setSuppression(ligne); setSuppressionErreur(''); }}
          >
            Supprimer
          </button>
        </div>
      ),
    },
  ];

  const anneesDisponibles = [...new Set(previsions.map((p) => p.annee))].sort((a, b) => b - a);

  return (
    <section className="page prevision-page">
      <div className="page-heading">
        <p className="eyebrow">Chef de centre · {centre?.nom_centre ?? 'Votre centre'}</p>
        <h1>Prévision</h1>
        <p>
          Objectifs de recette du centre, année par année. La recette réelle est la TVA payée
          enregistrée sur les déclarations des contribuables du centre ; l’exercice en cours
          est lu à ce jour, au rythme des mois écoulés.
        </p>
      </div>

      {error && <p className="status error" role="alert">{error}</p>}

      <div className="cf-kpis prevision-kpis">
        <article className="cf-kpi">
          <span>Prévisions enregistrées</span>
          <strong>{previsions.length}</strong>
        </article>
        <article className="cf-kpi">
          <span>Objectif {anneeCourante}</span>
          <strong>{prevuCourant > 0 ? formatAriary(prevuCourant) : 'Non renseigné'}</strong>
        </article>
        <article className="cf-kpi">
          <span>Recette {anneeCourante} à ce jour</span>
          <strong>{formatAriary(recetteCourante)}</strong>
        </article>
        <article className="cf-kpi">
          <span>Réalisation {anneeCourante}</span>
          <strong>{tauxCourant === null ? '—' : `${tauxCourant} %`}</strong>
          <small className={etatCourant.badge}>{etatCourant.label}</small>
        </article>
      </div>

      <form className="cf-ccard prevision-form-card" onSubmit={soumettre} ref={formRef}>
        <p className="eyebrow">{editionId ? 'Modification' : 'Nouvelle prévision'}</p>
        <h2>{editionId ? `Modifier la prévision ${form.annee}` : 'Ajouter une prévision de recette'}</h2>
        <p className="cf-lead">
          Une seule prévision par année civile et par centre. Le montant est l’objectif de
          recette attendu pour l’exercice complet.
        </p>
        <div className="prevision-form">
          <div className="field">
            <label htmlFor="prevision-annee">Année civile</label>
            <input
              id="prevision-annee"
              type="number"
              min="2000"
              max="2100"
              step="1"
              required
              value={form.annee}
              onChange={majChamp('annee')}
            />
          </div>
          <div className="field">
            <label htmlFor="prevision-montant">Montant prévisionnel (Ar)</label>
            <input
              id="prevision-montant"
              type="number"
              min="1"
              step="0.01"
              required
              placeholder="Ex. 1 500 000 000"
              value={form.montant_prevu}
              onChange={majChamp('montant_prevu')}
            />
          </div>
          <div className="field">
            <label htmlFor="prevision-observation">Observation (facultatif)</label>
            <input
              id="prevision-observation"
              type="text"
              maxLength="255"
              placeholder="Contexte de l’objectif, hypothèses…"
              value={form.observation}
              onChange={majChamp('observation')}
            />
          </div>
        </div>
        {feedback && (
          <p
            ref={feedbackRef}
            className={`form-submit-message ${feedback.type === 'success' ? 'success' : 'error'}`}
            role={feedback.type === 'success' ? 'status' : 'alert'}
          >
            {feedback.message}
          </p>
        )}
        <div className="form-actions">
          {editionId && (
            <button type="button" className="prevision-annuler" onClick={annulerEdition} disabled={envoi}>
              Annuler la modification
            </button>
          )}
          <button type="submit" className="primary" disabled={envoi}>
            {envoi ? 'Enregistrement…' : editionId ? 'Mettre à jour la prévision' : 'Enregistrer la prévision'}
          </button>
        </div>
      </form>

      <section className="panel prevision-liste" aria-labelledby="prevision-liste-title">
        <h2 id="prevision-liste-title">Prévisions du centre</h2>
        <div className="datatable-toolbar">
          <select
            value={filtreAnnee}
            onChange={(event) => { setFiltreAnnee(event.target.value); pagination.setCurrentPage(1); }}
            aria-label="Filtrer par année"
          >
            <option value="">Toutes les années</option>
            {anneesDisponibles.map((annee) => (
              <option key={annee} value={String(annee)}>{annee}</option>
            ))}
          </select>
          <span>
            {lignes.length} prévision(s)
            {filtreAnnee && previsions.length !== lignes.length && ` (sur ${previsions.length})`}
          </span>
          {filtreAnnee && (
            <button type="button" onClick={() => { setFiltreAnnee(''); pagination.setCurrentPage(1); }}>
              ✕ Effacer
            </button>
          )}
          <button type="button" onClick={() => { setChargement(true); charger(); }} disabled={chargement}>Actualiser</button>
        </div>
        <DataTable
          columns={columns}
          rows={pagination.pageItems}
          rowKey={(ligne) => ligne.id_prevision}
          loading={chargement}
          loadingMessage="Chargement des prévisions du centre…"
          emptyMessage="Aucune prévision enregistrée : ajoutez l’objectif de recette du centre ci-dessus."
          filteredEmptyMessage="Aucune prévision pour cette année."
          isFiltered={Boolean(filtreAnnee)}
          pagination={{
            page: pagination.currentPage,
            totalPages: pagination.totalPages,
            onPageChange: pagination.setCurrentPage,
          }}
          ariaLabel="Prévisions de recette du centre"
        />
      </section>

      <ModaleConfirmation
        ouvert={Boolean(suppression)}
        etiquette="Suppression"
        variante="danger"
        titre={suppression ? `Supprimer la prévision ${suppression.annee} ?` : ''}
        intro="La prévision sera retirée du centre. La recette réelle enregistrée sur les déclarations n’est pas modifiée."
        modifications={suppression ? [
          {
            label: 'Montant prévu',
            avant: formatAriary(suppression.montant_prevu),
            apres: 'Supprimé',
          },
        ] : []}
        messageErreur={suppressionErreur}
        texteValider="Supprimer"
        enCours={suppressionEnCours}
        onValider={confirmerSuppression}
        onFermer={() => { if (!suppressionEnCours) setSuppression(null); }}
      />
    </section>
  );
}