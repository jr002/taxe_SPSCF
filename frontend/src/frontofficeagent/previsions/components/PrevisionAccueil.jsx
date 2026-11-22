import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Camembert, Histogramme } from '@/components/charts';
import { getErrorMessage, getPrevisions } from '@/api';
import { formatAriary, formatCompact } from '@/utils';
import {
  etatPrevision,
  moisLibelle,
  prevuDe,
  tauxRealisation,
} from '@/frontofficeagent/previsions/utils/prevision.utils';

/**
 * Bloc réservé au chef de centre sur l'accueil : la prévision de recette de
 * l'année courante mise en valeur, sa réalisation à ce jour, puis l'historique
 * des cinq derniers exercices (prévision face à la recette de fin d'année).
 */
export default function PrevisionAccueil() {
  const [donnees, setDonnees] = useState(null);
  const [error, setError] = useState('');
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    let actif = true;
    getPrevisions()
      .then((data) => { if (actif) setDonnees(data); })
      .catch((err) => { if (actif) setError(getErrorMessage(err)); })
      .finally(() => { if (actif) setChargement(false); });
    return () => { actif = false; };
  }, []);

  const anneeCourante = donnees?.annee_courante ?? new Date().getFullYear();
  const moisEcoules = donnees?.mois_ecoules ?? new Date().getMonth() + 1;
  const previsions = donnees?.previsions ?? [];
  const recettes = donnees?.recettes ?? {};
  const annees = donnees?.annees ?? [];
  const prevu = prevuDe(previsions, anneeCourante);
  const recette = recettes[anneeCourante] ?? 0;
  const etat = etatPrevision({ prevu, recette, annee: anneeCourante, anneeCourante, moisEcoules });
  const taux = tauxRealisation(prevu, recette);
  const attendu = prevu > 0 ? prevu * (moisEcoules / 12) : 0;
  const reste = prevu > 0 ? Math.max(prevu - recette, 0) : 0;

  return (
    <section className="workbench-priorites prevision-accueil" aria-labelledby="prevision-accueil-title">
      <header className="workbench-priorites-header">
        <div>
          <p className="eyebrow">Prévision de recette · {donnees?.centre?.nom_centre ?? 'Votre centre'}</p>
          <h2 id="prevision-accueil-title">Objectif de recette {anneeCourante}</h2>
        </div>
        <Link to="/previsions">Gérer les prévisions</Link>
      </header>

      {chargement && <p className="status" role="status">Chargement des prévisions du centre…</p>}
      {error && <p className="status error" role="alert">{error}</p>}

      {!chargement && !error && (
        <>
          <div className="prevision-accueil-grid">
            <article className={`prevision-hero ${etat.niveau}`}>
              <div className="prevision-hero-top">
                <span className={etat.badge}>{etat.label}</span>
                <small>{moisEcoules} mois écoulés sur 12</small>
              </div>
              {prevu > 0 ? (
                <>
                  <p className="prevision-hero-montant">{formatAriary(prevu)}</p>
                  <p className="cf-lead">
                    Recette attendue du centre pour {anneeCourante}, telle que saisie dans les prévisions.
                  </p>
                  <div className="cf-three-columns prevision-hero-champs">
                    <div className="sum-field">
                      <span>Recette encaissée à ce jour</span>
                      <strong>{formatAriary(recette)}</strong>
                    </div>
                    <div className="sum-field">
                      <span>Rythme attendu à fin {moisLibelle(moisEcoules)}</span>
                      <strong>{formatAriary(attendu)}</strong>
                    </div>
                    <div className="sum-field">
                      <span>Reste à encaisser</span>
                      <strong>{formatAriary(reste)}</strong>
                    </div>
                  </div>
                  <div className="prevision-hero-taux">
                    <div className="prevision-jauge" role="img" aria-label={`Taux de réalisation : ${taux} %`}>
                      <i style={{ width: `${Math.min(taux, 100)}%` }} />
                    </div>
                    <strong>{taux} %</strong>
                    <span>de la prévision encaissée</span>
                  </div>
                </>
              ) : (
                <>
                  <p className="prevision-hero-montant">{formatAriary(recette)}</p>
                  <p className="cf-lead">
                    Recette encaissée à ce jour. Aucune prévision n’est encore enregistrée pour {anneeCourante} :
                    saisissez l’objectif du centre pour suivre sa réalisation.
                  </p>
                  <div className="form-actions prevision-hero-actions">
                    <Link className="primary" to="/previsions">Saisir la prévision {anneeCourante}</Link>
                  </div>
                </>
              )}
            </article>

            {prevu > 0 ? (
              <Camembert
                title={`Recette ${anneeCourante} face à la prévision`}
                hint="TVA payée enregistrée sur les déclarations du centre"
                slices={[
                  { label: 'Recette encaissée', valeur: recette, couleur: '#138b79' },
                  { label: 'Reste à encaisser', valeur: reste, couleur: '#f2b84b' },
                ]}
                centerValue={recette}
                centerLabel="Ar encaissés"
                formatValue={formatCompact}
              />
            ) : (
              <article className="panel prevision-camembert-vide">
                <h2>Recette {anneeCourante} face à la prévision</h2>
                <p className="cf-lead">
                  Le diagramme de réalisation apparaîtra dès la prévision {anneeCourante} saisie.
                </p>
              </article>
            )}
          </div>

          <Histogramme
            title="Prévision et recette de fin d’année — 5 derniers exercices"
            hint={`Recette = TVA payée enregistrée sur les déclarations du centre ; ${anneeCourante} : recette à ce jour`}
            xLabel="Exercice"
            groups={annees.map((annee) => ({
              label: String(annee),
              valeurs: {
                prevision: prevuDe(previsions, annee),
                recette: recettes[annee] ?? 0,
              },
            }))}
            series={[
              { key: 'prevision', label: 'Prévision de recette', couleur: '#f2b84b' },
              { key: 'recette', label: 'Recette réelle', couleur: '#1769aa' },
            ]}
            formatTick={formatCompact}
          />
        </>
      )}
    </section>
  );
}