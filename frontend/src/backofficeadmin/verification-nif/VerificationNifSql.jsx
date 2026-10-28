import { useState } from 'react';
import ErreursVerification from './ErreursVerification';
import HistoriqueVerification from './HistoriqueVerification';
import VerificationNifLayout from './VerificationNifLayout';
import {
  executerSelectListe,
  extraireNifDepuisRequete,
  loadHistorique,
  loadReferentiel,
  nouvelleErreur,
  pushHistorique,
  verifierNifSql,
} from './verification.utils';
import { getErrorMessage } from '@/api/api';

/** Une saisie qui commence par `SELECT` et ne désigne aucun NIF est une liste. */
const EST_SELECT = /^\s*select\b/i;

/**
 * Page dédiée du type 1 : vérification d'un NIF sur la base SQL, avec repli sur
 * le référentiel local. La saisie est une zone multigne — un NIF seul, une
 * requête ciblant un NIF ou un `SELECT` qui liste des contribuables (rendu en
 * petit tableau). Chaque échec est consigné dans un journal dédié.
 */
export default function VerificationNifSql({ currentUser }) {
  const [saisie, setSaisie] = useState('');
  const [resultat, setResultat] = useState(null);
  const [liste, setListe] = useState(null);
  const [erreurs, setErreurs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historique, setHistorique] = useState(() => loadHistorique('sql'));

  const journaliser = (titre, message) => setErreurs((suites) => [nouvelleErreur(titre, message), ...suites]);
  const consigner = (label, detail, reussi) =>
    setHistorique(pushHistorique('sql', { label, detail, reussi }));

  const handleVerifier = async (event) => {
    event.preventDefault();
    const requete = saisie.trim();
    if (!requete) return;

    setLoading(true);
    setResultat(null);
    setListe(null);
    setErreurs([]);

    const { nif, erreur, avertissement } = extraireNifDepuisRequete(requete);

    try {
      if (erreur && EST_SELECT.test(requete)) {
        const resultatListe = await executerSelectListe(requete);
        if (resultatListe.erreur) {
          journaliser('SELECT non exécutable', resultatListe.erreur);
          consigner(requete.slice(0, 24), resultatListe.erreur, false);
          return;
        }

        setListe(resultatListe);
        if (resultatListe.avertissement) journaliser('Colonnes ignorées', resultatListe.avertissement);
        if (!resultatListe.lignes.length) {
          journaliser(
            'Aucune ligne retournée',
            `Aucun contribuable ne correspond${
              resultatListe.recherche ? ` au filtre « ${resultatListe.recherche} »` : ''
            } sur la table contribuables.`
          );
        }
        consigner(
          `${resultatListe.lignes.length} ligne(s) · ${resultatListe.colonnes.length} colonne(s)`,
          `SELECT sur contribuables${resultatListe.recherche ? ` · filtre « ${resultatListe.recherche} »` : ''}`,
          true,
        );
        return;
      }

      if (erreur) {
        journaliser('Requête non reconnue', erreur);
        consigner(requete.slice(0, 24), erreur, false);
        return;
      }
      if (avertissement) journaliser('NIF double', avertissement);

      const verifie = await verifierNifSql(nif, loadReferentiel());
      setResultat(verifie);
      if (!verifie.trouve) journaliser('NIF introuvable', verifie.message);
      consigner(
        `NIF ${verifie.nif}`,
        verifie.trouve ? `${verifie.raison_sociale} · ${verifie.source}` : verifie.message,
        verifie.trouve,
      );
    } catch (requestError) {
      const message = getErrorMessage(requestError);
      journaliser('Appel à la base SQL', message);
      consigner(nif ? `NIF ${nif}` : requete.slice(0, 24), message, false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <VerificationNifLayout
      currentUser={currentUser}
      eyebrow="Backoffice Administration · Vérification NIF"
      titre="1 · Vérification par Requête SQL"
      description="Interrogez directement la base de données PostgreSQL pour authentifier un NIF contribuable, avec repli sur le référentiel local."
    >
      <div className="panel" style={{ borderTop: '4px solid #2563eb' }}>
        <form className="verif-saisie" onSubmit={handleVerifier}>
          <label className="field">
            Requête SQL
            <textarea
              value={saisie}
              onChange={(event) => setSaisie(event.target.value)}
              onKeyDown={(event) => {
                if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') handleVerifier(event);
              }}
              rows={7}
              spellCheck={false}
              aria-label="Requête SQL ou NIF à vérifier"
              placeholder={"SELECT raison_sociale, centre_fiscal_ref\nFROM contribuables\nWHERE nif = '1000000001'\n  AND statut = 'actif';"}
            />
          </label>

          <p className="verif-aide">
            Le premier NIF à 10 chiffres de la saisie est vérifié ; un NIF seul fonctionne aussi. Un{' '}
            <code>SELECT … FROM contribuables</code> sans NIF est exécuté comme une liste et rendu dans le tableau
            ci-dessous (<code>WHERE 'text'</code> filtre, <code>LIMIT n</code> borne à 100 lignes maximum).{' '}
            <code>Ctrl</code> + <code>Entrée</code> lance le test.
          </p>

          <div className="verif-saisie-actions">
            <button className="primary" type="submit" disabled={loading}>
              {loading ? 'Test en cours…' : 'Vérifier la requête'}
            </button>
            <button
              type="button"
              className="admin-secondary-button"
              onClick={() => {
                setSaisie('');
                setResultat(null);
                setListe(null);
                setErreurs([]);
              }}
              disabled={!saisie && !resultat && !liste && !erreurs.length}
            >
              ✕ Effacer la saisie
            </button>
          </div>
        </form>

        <ErreursVerification entries={erreurs} onClear={() => setErreurs([])} />

        {resultat && (
          <div className={`verif-resultat${resultat.trouve ? '' : ' verif-resultat-introuvable'}`}>
            {resultat.trouve ? (
              <>
                <h3>✅ NIF CERTIFIÉ ET AUTHENTIFIÉ</h3>
                <p>
                  <strong>Raison sociale :</strong> {resultat.raison_sociale}
                </p>
                <p>
                  <strong>Centre fiscal :</strong> {resultat.centre}
                </p>
                <p>
                  <strong>Régime :</strong> {resultat.regime} · <em>Source : {resultat.source}</em>
                </p>
              </>
            ) : (
              <>
                <h3>❌ NIF INCONNU</h3>
                <p>{resultat.message}</p>
              </>
            )}
          </div>
        )}

        {liste && (
          <div className="verif-liste">
            <div className="verif-liste-head">
              <h3>📋 Résultat de la requête</h3>
              <p className="status">
                {liste.lignes.length} ligne(s) sur {liste.total} · LIMIT {liste.limite}
                {liste.recherche ? ` · filtre « ${liste.recherche} »` : ''}
              </p>
            </div>

            {liste.lignes.length ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      {liste.colonnes.map((colonne) => (
                        <th key={colonne.key} scope="col">
                          {colonne.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {liste.lignes.map((ligne) => (
                      <tr key={ligne.id ?? ligne.nif}>
                        {liste.colonnes.map((colonne) => (
                          <td key={colonne.key}>{ligne.valeur[colonne.key]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="status">Aucun contribuable ne correspond à cette requête.</p>
            )}
          </div>
        )}
      </div>

      <HistoriqueVerification
        entries={historique}
        emptyLabel="Aucune vérification SQL enregistrée sur ce navigateur."
      />
    </VerificationNifLayout>
  );
}
