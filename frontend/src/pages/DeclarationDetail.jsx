import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { getDeclarations, getErrorMessage } from '../api/api';
import { formatAriary, toNumber } from '../utils/formatters';

/**
 * Page de consultation détaillée d'une déclaration fiscale
 */
export default function DeclarationDetail() {
  const { id } = useParams();
  const location = useLocation();
  const [declaration, setDeclaration] = useState(location.state?.declaration || null);
  const [loading, setLoading] = useState(!declaration);
  const [error, setError] = useState('');

  useEffect(() => {
    if (declaration?.id_declaration === Number(id)) return;

    const loadDeclaration = async () => {
      setLoading(true);
      try {
        const result = await getDeclarations({ limit: 10000 });
        const list = result.data || result;
        const found = list.find((row) => String(row.id_declaration) === id);

        if (!found) {
          setError('Cette déclaration fiscale est introuvable.');
        }
        setDeclaration(found || null);
      } catch (requestError) {
        setError(getErrorMessage(requestError));
      } finally {
        setLoading(false);
      }
    };

    loadDeclaration();
  }, [declaration, id]);

  if (loading) {
    return <p className="page status">Chargement des données de la déclaration...</p>;
  }

  if (error || !declaration) {
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

  return (
    <section className="page declaration-page">
      <Link className="detail-back-link" to="/suivi">
        ← Retour au suivi fiscal
      </Link>

      <div className="page-heading declaration-page-heading">
        <p className="eyebrow">Détail de la déclaration fiscale</p>
        <h1>{declaration.raison_sociale || 'Contribuable non renseigné'}</h1>
        <p>
          NIF : {declaration.nif || 'N/A'} · Année fiscale : {declaration.annee}
        </p>
      </div>

      <div className="declaration-summary">
        <div>
          <span>Statut de conformité</span>
          <strong>{declaration.statut || 'Conforme'}</strong>
        </div>
        <div>
          <span>Écart constaté</span>
          <strong>{formatAriary(ecart)}</strong>
        </div>
      </div>

      <div className="declaration-detail-grid">
        <div>
          <dt>Chiffre d'affaires</dt>
          <dd>{formatAriary(declaration.ca)}</dd>
        </div>
        <div>
          <dt>Bénéfice déclaré</dt>
          <dd>{formatAriary(declaration.benefice)}</dd>
        </div>
        <div>
          <dt>TVA collectée</dt>
          <dd>{formatAriary(declaration.tva_collectee)}</dd>
        </div>
        <div>
          <dt>TVA déductible</dt>
          <dd>{formatAriary(declaration.tva_deductible)}</dd>
        </div>
        <div>
          <dt>TVA effectivement payée</dt>
          <dd>{formatAriary(declaration.tva_payee)}</dd>
        </div>
        <div>
          <dt>TVA théorique calculée</dt>
          <dd>{formatAriary(declaration.tva_theorique)}</dd>
        </div>
        <div>
          <dt>Numéro d'enregistrement</dt>
          <dd>#{declaration.id_declaration}</dd>
        </div>
        <div>
          <dt>Date de modification</dt>
          <dd>{declaration.date_modification || declaration.date_creation || 'Récente'}</dd>
        </div>
      </div>
    </section>
  );
}
