import { Link } from 'react-router-dom';

const STRUCTURES_FISCALES = [
  {
    value: 'centre_fiscal',
    label: 'Centre Fiscal',
    threshold: 'CA inférieur à 2 milliards Ar',
    tone: 'centre',
    number: '01',
  },
  {
    value: 'sre',
    label: 'SRE (Service Régional des Entreprises)',
    threshold: 'CA entre 2 et 4 milliards Ar',
    tone: 'sre',
    number: '02',
  },
  {
    value: 'dge',
    label: 'DGE (Direction des Grandes Entreprises)',
    threshold: 'CA supérieur à 4 milliards Ar',
    tone: 'dge',
    number: '03',
  },
];

/**
 * Étape 1 : Choix de la structure fiscale de rattachement du contribuable
 */
export default function PhaseClassement() {
  return (
    <section className="page classification-page">
      <div className="page-heading">
        <p className="eyebrow">Nouveau contribuable</p>
        <h1>Choisir la structure fiscale</h1>
        <p>
          Sélectionnez le centre de gestion compétent en fonction du seuil de chiffre d'affaires.
        </p>
      </div>

      <div className="classification-options" aria-label="Structures fiscales">
        {STRUCTURES_FISCALES.map((structure) => (
          <Link
            key={structure.value}
            to={`/entreprises/nouveau/form?structure=${structure.value}`}
            className={`classification-option classification-${structure.tone}`}
          >
            <span className="classification-number">{structure.number}</span>
            <span className="classification-arrow" aria-hidden="true">
              →
            </span>
            <strong>{structure.label}</strong>
            <span>{structure.threshold}</span>
            <small>Continuer vers le formulaire d'inscription</small>
          </Link>
        ))}
      </div>
    </section>
  );
}
