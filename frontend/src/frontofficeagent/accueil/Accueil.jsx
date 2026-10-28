import { Link } from 'react-router-dom';
import useDecisionnelData from '@/hooks/useDecisionnelData';
import { formatAriary, toNumber } from '@/utils/formatters';

const ACTIONS_RAPIDES = [
  {
    number: '01',
    title: "Déclaration d'impôts et de taxes",
    description: 'Saisissez les opérations et obtenez le montant de TVA à payer.',
    to: '/collecte',
    primary: true,
  },
  {
    number: '02',
    title: 'Enregistrer un contribuable',
    description: "Créez la fiche d'un nouveau contribuable assujetti à la TVA.",
    to: '/entreprises/nouveau',
  },
  {
    number: '03',
    title: 'Suivi des dossiers fiscaux',
    description: 'Analysez les déclarations, les écarts et les points à surveiller.',
    to: '/suivi',
  },
];

/**
 * Page d'accueil (Dashboard de bienvenue de l'administration fiscale DGI)
 *
 * Un chef de centre ne lit que son centre : deux cartes chiffrent donc la TVA
 * théorique — d'abord le total national de la DGI, puis celui de son centre.
 */
export default function Accueil({ currentUser = null }) {
  const { stats, loading } = useDecisionnelData();
  const tvaTheoriqueTotale = toNumber(stats?.tva_theorique_totale);
  const tvaTheoriqueDgi = toNumber(stats?.tva_theorique_dgi);
  const estChefCentre = currentUser?.role === 'chef_centre';
  const nomCentre = currentUser?.nom_centre || 'votre centre';

  return (
    <div className="home-page">
      {/* Section Hero */}
      <section className="home-hero">
        <div className="home-hero-copy">
          <h3 className="eyebrow">
            SYSTEME DE PILOTAGE ET DU SUIVI DE LA CONFORMITE FISCALE (SPSCF)
          </h3>
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

            {estChefCentre ? (
              <div className="home-metric-card home-metric-national">
                <small>TVA théorique · DGI</small>
                <strong>{loading ? 'Chargement...' : formatAriary(tvaTheoriqueDgi)}</strong>
                <span>Total national, toutes déclarations</span>
              </div>
            ) : (
              <div className="home-status-card">
                <span className="status-dot" />
                <span>Situation fiscale</span>
                <strong>Maîtrisée</strong>
                <small>Dernière mise à jour · aujourd'hui</small>
              </div>
            )}

            <div className="home-metric-stack">
              <div className="home-metric-card">
                <small>
                  {estChefCentre
                    ? `TVA théorique · ${nomCentre}`
                    : 'TVA théorique estimée · base annuelle'}
                </small>
                <strong>{loading ? 'Chargement...' : formatAriary(tvaTheoriqueTotale)}</strong>
                <span>
                  {estChefCentre
                    ? 'Déclarations rattachées à votre centre'
                    : 'Données consolidées des déclarations'}
                </span>
              </div>
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
