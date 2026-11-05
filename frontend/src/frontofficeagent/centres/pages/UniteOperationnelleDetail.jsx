import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getCentres, getContribuables, getErrorMessage } from '@/api';
import { useFiltresUrl } from '@/hooks';
import { trouverUnite } from '@/frontofficeagent/centres/utils/uniteOperationnelle.utils';

const PAGE_SIZE = 10;

/**
 * Fiche d'une unité opérationnelle : ce que dit le registre administré
 * (`centres`), ce que dit la cartographie institutionnelle
 * (`unitefiscal.json`) et les dossiers fiscaux rattachés.
 */
export default function UniteOperationnelleDetail() {
  const { type: cle, nom } = useParams();
  const navigate = useNavigate();
  const { lire, patch, page } = useFiltresUrl();
  const search = lire('q', '');
  const [centres, setCentres] = useState(null);
  const [dossiers, setDossiers] = useState(null);
  const [erreurRegistre, setErreurRegistre] = useState('');
  const [erreurDossiers, setErreurDossiers] = useState('');

  const ligne = useMemo(
    () => (centres ? trouverUnite({ cle, nom, centres }) : null),
    [centres, cle, nom],
  );

  useEffect(() => {
    let annule = false;
    getCentres()
      .then((resultat) => {
        if (!annule) setCentres(resultat);
      })
      .catch((requestError) => {
        if (annule) return;
        // Une liste vide vaut « rien à afficher » : l'écran ne reste pas bloqué
        // sur « chargement » quand la requête a échoué.
        setCentres([]);
        setErreurRegistre(getErrorMessage(requestError));
      });

    return () => {
      annule = true;
    };
  }, []);

  useEffect(() => {
    if (!ligne) return undefined;

    let annule = false;
    // Le référentiel connaît l'unité : le serveur filtre sur sa référence de
    // rattachement. Un centre créé hors référentiel n'a que sa clé interne.
    const params = ligne.unite
      ? { centre_fiscal_ref: ligne.reference, limit: 10000 }
      : { limit: 10000 };

    getContribuables(params)
      .then((resultat) => {
        if (annule) return;
        const rows = Array.isArray(resultat?.data) ? resultat.data : [];
        setDossiers(
          ligne.unite
            ? rows
            : rows.filter((dossier) => String(dossier.id_centre) === String(ligne.id_centre)),
        );
      })
      .catch((requestError) => {
        if (annule) return;
        setDossiers([]);
        setErreurDossiers(getErrorMessage(requestError));
      });

    return () => {
      annule = true;
    };
  }, [ligne]);

  const filtres = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('fr');
    if (!query) return dossiers ?? [];

    return (dossiers ?? []).filter((dossier) =>
      [
        dossier.raison_sociale,
        dossier.nif,
        dossier.secteur_activite,
        dossier.regime_fiscal,
        dossier.email,
        dossier.telephone,
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('fr')
        .includes(query),
    );
  }, [dossiers, search]);

  const pageCount = Math.max(1, Math.ceil(filtres.length / PAGE_SIZE));
  const visiblePage = Math.min(page, pageCount);
  const visibleDossiers = filtres.slice((visiblePage - 1) * PAGE_SIZE, visiblePage * PAGE_SIZE);

  if (!centres) {
    return <p className="page status" role="status">Chargement de l'unité opérationnelle...</p>;
  }

  if (!ligne) {
    return (
      <section className="page error">
        <h1>Unité opérationnelle introuvable</h1>
        <p>
          {erreurRegistre || 'Cette unité n’est ni cartographiée dans unitefiscal.json, ni enregistrée au registre des centres.'}
        </p>
        <Link className="primary detail-back" to="/unites-operationnelles">
          Retour à la liste des unités
        </Link>
      </section>
    );
  }

  const unite = ligne.unite;
  const regions = ligne.regions || 'Non renseignée';
  const chargementDossiers = dossiers === null;

  return (
    <section className="page">
      <div className="page-heading">
        <p className="eyebrow">Fiche de l’unité · {ligne.type}</p>
        <h1>{ligne.nom}</h1>
        <p>Registre administré, cartographie institutionnelle et dossiers rattachés.</p>
      </div>

      <div className="unite-fiscale-summary">
        <div className="unite-fiscale-summary-heading">
          <div>
            <span className="eyebrow">Informations administratives</span>
            <h2>{ligne.nom}</h2>
          </div>
          <span className="unite-fiscale-type">
            {ligne.enregistre ? `${ligne.numero || ligne.type}` : 'Hors registre'}
          </span>
        </div>
        <dl className="unite-fiscale-details">
          <div>
            <dt>Enregistrement au registre</dt>
            <dd>
              {ligne.numero
                ? `${ligne.numero} · ${ligne.type}`
                : <span className="badge absent">Non enregistrée au registre</span>}
            </dd>
          </div>
          <div>
            <dt>Région(s) couverte(s)</dt>
            <dd>{regions}</dd>
          </div>
          <div>
            <dt>{unite?.dri ? 'DRI de rattachement' : 'Rattachement'}</dt>
            <dd>{ligne.dri || 'Non renseigné'}</dd>
          </div>
          <div><dt>Adresse</dt><dd>{ligne.adresse || 'Non renseignée'}</dd></div>
          <div><dt>Téléphone</dt><dd>{ligne.telephone || 'Non disponible'}</dd></div>
          <div><dt>E-mail</dt><dd>{ligne.email || 'Non renseigné'}</dd></div>
          <div>
            <dt>Dossiers rattachés</dt>
            <dd>{ligne.nbContribuables ?? '—'}</dd>
          </div>
          {cle === 'dge' && unite?.role && (
            <>
              <div><dt>Rôle</dt><dd>{unite.role}</dd></div>
              <div><dt>Critère de rattachement</dt><dd>{unite.critere_rattachement}</dd></div>
              {unite.portail && (
                <div><dt>Portail</dt><dd><a href={unite.portail} target="_blank" rel="noreferrer">{unite.portail}</a></dd></div>
              )}
              {unite.teledeclaration && (
                <div><dt>Télédéclaration</dt><dd><a href={unite.teledeclaration} target="_blank" rel="noreferrer">{unite.teledeclaration}</a></dd></div>
              )}
              {unite.dgi_contact && (
                <>
                  <div><dt>Adresse DGI</dt><dd>{unite.dgi_contact.adresse}</dd></div>
                  <div><dt>Téléphone DGI</dt><dd>{unite.dgi_contact.telephone}</dd></div>
                  <div>
                    <dt>E-mail DGI</dt>
                    <dd><a href={`mailto:${unite.dgi_contact.email}`}>{unite.dgi_contact.email}</a></dd>
                  </div>
                </>
              )}
            </>
          )}
        </dl>
      </div>

      <div className="unite-fiscale-contribuables">
        <div className="unite-fiscale-table-heading">
          <div>
            <p className="eyebrow">Rattachement</p>
            <h2>Dossiers fiscaux de l’unité</h2>
            <p>Contribuables dont le rattachement pointe sur cette unité.</p>
          </div>
          <span className="unite-fiscale-count">
            {chargementDossiers ? 'Chargement…' : `${filtres.length} contribuable(s)`}
          </span>
        </div>

        <div className="datatable-toolbar register-toolbar">
          <input
            value={search}
            onChange={(event) => patch({ q: event.target.value, page: '' })}
            placeholder="Rechercher par raison sociale, NIF ou secteur..."
            aria-label="Rechercher un dossier rattaché"
          />
        </div>

        {erreurDossiers && <p className="error" role="alert">{erreurDossiers}</p>}

        {chargementDossiers ? (
          <p className="status" role="status">Chargement des dossiers rattachés...</p>
        ) : (
          <>
            <div className="table-wrap">
              <table aria-label="Dossiers fiscaux de l'unité opérationnelle" className="register-table unite-fiscale-contribuables-table">
                <thead>
                  <tr>
                    <th>Raison sociale</th>
                    <th>NIF</th>
                    <th>Secteur d’activité</th>
                    <th>Nature d’impôt</th>
                    <th>Téléphone</th>
                    <th>E-mail</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleDossiers.map((dossier) => (
                    <tr
                      key={dossier.id_contribuable}
                      className="clickable-row"
                      onClick={() => navigate(`/contribuables/${dossier.id_contribuable}`, {
                        state: { contribuable: dossier },
                      })}
                      title="Ouvrir la fiche du contribuable"
                    >
                      <td><strong>{dossier.raison_sociale}</strong></td>
                      <td>{dossier.nif}</td>
                      <td>{dossier.secteur_activite || '—'}</td>
                      <td>{dossier.regime_fiscal || '—'}</td>
                      <td>{dossier.telephone || '—'}</td>
                      <td>{dossier.email || '—'}</td>
                    </tr>
                  ))}
                  {!visibleDossiers.length && (
                    <tr>
                      <td colSpan="6" className="empty">
                        {dossiers?.length
                          ? 'Aucun contribuable ne correspond à cette recherche.'
                          : 'Aucun contribuable n’est rattaché à cette unité.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {filtres.length > 0 && (
              <div className="datatable-pagination">
                <span>Page {visiblePage} sur {pageCount}</span>
                <div>
                  <button
                    type="button"
                    onClick={() => patch({ page: visiblePage - 1 <= 1 ? '' : visiblePage - 1 })}
                    disabled={visiblePage === 1}
                  >
                    ← Précédent
                  </button>
                  <button
                    type="button"
                    onClick={() => patch({ page: visiblePage + 1 })}
                    disabled={visiblePage === pageCount}
                  >
                    Suivant →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Link className="primary detail-back" to="/unites-operationnelles">
        ← Retour à la liste des unités
      </Link>
    </section>
  );
}
