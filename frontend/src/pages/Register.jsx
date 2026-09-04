import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useDecisionnelData from '../hooks/useDecisionnelData';
import { formatAriary, toNumber } from '../utils/formatters';

const STRUCTURES = [
  {
    key: 'centre',
    label: 'Centre Fiscal',
    description: 'CA inférieur à 2 milliards Ar',
  },
  {
    key: 'sre',
    label: 'SRE (Service Régional des Entreprises)',
    description: 'CA de 2 à 4 milliards Ar',
  },
  {
    key: 'dge',
    label: 'DGE (Direction des Grandes Entreprises)',
    description: 'CA supérieur à 4 milliards Ar',
  },
];

/**
 * Détermine la structure fiscale selon le CA
 */
const getStructure = (ca) => {
  if (ca < 2000000000) return 'centre';
  if (ca <= 4000000000) return 'sre';
  return 'dge';
};

/**
 * Registre des impôts : Classement des contribuables par centre de gestion
 */
export default function Register() {
  const navigate = useNavigate();
  const { declarations, error, loading } = useDecisionnelData();

  const registre = useMemo(() => {
    const latestByCompany = new Map();

    declarations.forEach((declaration) => {
      const companyKey =
        declaration.id_contribuable || declaration.nif || declaration.raison_sociale;
      const previous = latestByCompany.get(companyKey);

      if (!previous || Number(declaration.annee) > Number(previous.annee)) {
        latestByCompany.set(companyKey, declaration);
      }
    });

    return STRUCTURES.reduce((groups, structure) => {
      groups[structure.key] = [...latestByCompany.values()].filter(
        (declaration) => getStructure(toNumber(declaration.ca)) === structure.key
      );
      return groups;
    }, {});
  }, [declarations]);

  return (
    <div className="page">
      <div className="page-heading">
        <p className="eyebrow">Registre des impôts</p>
        <h1>Contribuables par centre</h1>
        <p>Répartition des entreprises selon leur chiffre d'affaires annuel déclaré.</p>
      </div>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p className="status">Chargement du registre...</p>
      ) : (
        <div className="registry-grid">
          {STRUCTURES.map((structure) => {
            const items = registre[structure.key] || [];

            return (
              <article
                className={`registry-column registry-${structure.key}`}
                key={structure.key}
              >
                <div className="registry-title">
                  <div>
                    <h3>{structure.label}</h3>
                    <p>{structure.description}</p>
                  </div>
                  <strong>{items.length}</strong>
                </div>

                {items.length ? (
                  <div className="registry-list">
                    {items.map((declaration) => (
                      <div
                        className="registry-row"
                        key={`${declaration.id_contribuable || declaration.nif}-${declaration.annee}`}
                      >
                        <span>
                          <strong>
                            {declaration.raison_sociale || 'Contribuable non renseigné'}
                          </strong>
                          <small>
                            {declaration.nif || 'NIF non renseigné'} · {declaration.annee}
                          </small>
                        </span>
                        <b>{formatAriary(declaration.ca)}</b>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="empty">Aucun contribuable dans ce centre.</p>
                )}
              </article>
            );
          })}
        </div>
      )}

      <div className="home-footer-note" style={{ marginTop: '3rem' }}>
        <button
          className="detail-close"
          onClick={() => navigate('/')}
          style={{ alignSelf: 'center', cursor: 'pointer' }}
          title="Retourner à l'accueil"
        >
          ←
        </button>
        <p>
          <strong>Retourner</strong> à la page d'accueil
        </p>
      </div>
    </div>
  );
}
