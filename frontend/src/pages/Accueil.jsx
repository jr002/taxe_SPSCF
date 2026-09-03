import { Link } from 'react-router-dom';
import useDecisionnelData from '../hooks/useDecisionnelData';
import { formatAriary, toNumber } from '../utils/formatters';

const ACTIONS_RAPIDES = [
  {
    number: '01',
    title: 'Lancer une collecte',
    description: 'Saisissez les opérations et obtenez le montant de TVA à payer.',
    to: '/collecte',
    primary: true,
  },
  {
    number: '02',
    title: 'Ajouter un contribuable',
    description: "Créez la fiche d'un nouveau contribuable assujetti à la TVA.",
    to: '/entreprises/nouveau',
  },
  {
    number: '03',
    title: 'Consulter le suivi fiscal',
    description: 'Analysez les déclarations, les écarts et les points à surveiller.',
    to: '/suivi',
  },
];

/**
 * Page d'accueil (Dashboard de bienvenue de l'administration fiscale DGI)
 */
export default function Accueil() {
  const { stats, loading } = useDecisionnelData();
  const tvaTheoriqueTotale = toNumber(stats?.tva_theorique_totale);

  return (
    <div className="home-page">
      {/* Section Hero */}
      <section className="home-hero">
        <div className="home-hero-copy">
          <p className="eyebrow">
            Système de pilotage du contrôle et de la conformité fiscale (SP2CF)
          </p>
          <h1>La TVA, claire dès le premier regard.</h1>
          <p className="home-lead">
            Simulez, contrôlez et enregistrez vos déclarations fiscales en toute conformité.
          </p>
          <div className="home-hero-actions">
            <Link className="primary home-cta" to="/collecte">
              Commencer une collecte <span aria-hidden="true">→</span>
            </Link>
            <Link className="home-text-link" to="/decisionnel">
              Voir le tableau décisionnel <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>

        <div className="home-hero-visual" aria-label="Résumé de l'activité fiscale">
          <div className="home-orbit orbit-one" />
          <div className="home-orbit orbit-two" />

          <div className="home-visual-container">
            <img
              className="home-minister-logo"
              src="/imgministeradgi.jpg"
              alt="Logo du Ministère de l'Économie et des Finances"
            />
            <img
              className="home-republic-badge"
              src="/imgrepublique.jpg"
              alt="Emblème de la République de Madagascar"
            />

            <div className="home-status-card">
              <span className="status-dot" />
              <span>Situation fiscale</span>
              <strong>Maîtrisée</strong>
              <small>Dernière mise à jour · aujourd'hui</small>
            </div>

            <div className="home-metric-card">
              <small>TVA théorique estimée · base annuelle</small>
              <strong>{loading ? 'Chargement...' : formatAriary(tvaTheoriqueTotale)}</strong>
              <span>Données consolidées des déclarations</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section Actions */}
      <section className="home-section-heading">
        <div>
          <p className="eyebrow">Votre espace de travail</p>
          <h2>Que souhaitez-vous faire ?</h2>
        </div>
        <p>Un accès direct aux procédures et contrôles les plus fréquents.</p>
      </section>

      <section className="home-actions" aria-label="Actions principales">
        {ACTIONS_RAPIDES.map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className={`home-action${action.primary ? ' home-action-primary' : ''}`}
          >
            <span className="home-action-number">{action.number}</span>
            <span className="home-action-arrow" aria-hidden="true">
              ↗
            </span>
            <h3>{action.title}</h3>
            <p>{action.description}</p>
          </Link>
        ))}
        <Link to="/register" className="home-action">
          <span className="home-action-number">04</span>
          <span className="home-action-arrow" aria-hidden="true">
            ↗
          </span>
          <h3>Consulter le registre</h3>
          <p>Explorez les contribuables classés par centre de rattachement fiscal.</p>
        </Link>
      </section>

      <section className="home-footer-note">
        <span className="home-footer-mark">T</span>
        <p>
          <strong>
            TVA<span className="brand-dot">•</span>SSIF
          </strong>{' '}
          · Un pilotage fiscal plus simple, plus lisible et automatisé.
        </p>
        <Link to="/decisionnel">
          Accéder aux indicateurs <span aria-hidden="true">→</span>
        </Link>
      </section>
    </div>
  );
}
