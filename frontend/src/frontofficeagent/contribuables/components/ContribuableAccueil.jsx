import { Link } from 'react-router-dom';

import ContribuableSituation from '@/frontofficeagent/contribuables/components/ContribuableSituation';
import ContribuableConformite from '@/frontofficeagent/contribuables/components/ContribuableConformite';

const rubriques = [
  {
    suffix: '/synthese',
    titre: 'Synthèse',
    description: 'Consulter les montants de TVA et leur évolution par exercice.',
    action: 'Voir la synthèse',
  },
  {
    suffix: '/classification',
    titre: 'Nature d’impôt',
    description: 'Retrouver le régime déclaré, la catégorie et les repères fiscaux.',
    action: 'Voir la nature d’impôt',
  },
  {
    suffix: '/declarations',
    titre: 'Déclarations',
    description: 'Parcourir les déclarations, exercices et statuts enregistrés.',
    action: 'Voir les déclarations',
  },
  {
    suffix: '/recoupements',
    titre: 'Recoupements',
    description: 'Examiner les informations rapprochées et les écarts à vérifier.',
    action: 'Voir les recoupements',
  },
  {
    suffix: '/droits-communication',
    titre: 'Droits de communication',
    description: 'Suivre les demandes de pièces et les réponses associées.',
    action: 'Voir les demandes',
  },
  {
    suffix: '/relances',
    titre: 'Relances',
    description: 'Consulter les relances émises et leur état de suivi.',
    action: 'Voir les relances',
  },
];

export default function ContribuableAccueil({
  declarations,
  fiche,
  idContribuable,
  reference,
  relances,
  confrontation,
}) {
  return (
    <div className="contribuable-accueil">
      <ContribuableConformite
        idContribuable={idContribuable}
        stats={confrontation?.stats}
        apercu={confrontation?.apercu}
        loading={confrontation?.loading}
        error={confrontation?.error}
      />

      <ContribuableSituation
        declarations={declarations}
        fiche={fiche}
        reference={reference}
        relances={relances}
      />

      <section className="contribuable-accueil-navigation" aria-labelledby="contribuable-accueil-navigation-title">
        <div className="contribuable-accueil-section-heading">
          <div>
            <p className="eyebrow">Navigation du dossier</p>
            <h2 id="contribuable-accueil-navigation-title">Que souhaitez-vous consulter ?</h2>
          </div>
          <span>{rubriques.length} rubriques</span>
        </div>
        <nav className="contribuable-accueil-grid" aria-label="Rubriques du dossier contribuable">
          {rubriques.map((rubrique, index) => (
            <Link
              className="contribuable-accueil-card"
              key={rubrique.suffix}
              to={`/contribuables/${idContribuable}${rubrique.suffix}`}
            >
              <span className="contribuable-accueil-card-number" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3>{rubrique.titre}</h3>
              <p>{rubrique.description}</p>
              <span className="contribuable-accueil-card-action">
                {rubrique.action}<span aria-hidden="true"> →</span>
              </span>
            </Link>
          ))}
        </nav>
      </section>
    </div>
  );
}
