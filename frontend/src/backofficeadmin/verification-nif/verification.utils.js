import * as XLSX from 'xlsx';
import catalogue from '../../../../unitefiscal.json';
import { getContribuableByNif, getContribuables } from '../../api/api';

/** Clé du référentiel NIF partagé par les pages de vérification. */
export const REFERENTIEL_KEY = 'referentiel_nif_admin';

/** Nombre de dernières opérations conservées par type de vérification. */
export const HISTORIQUE_MAX = 3;

/** Types de vérification, chacun ayant sa page dédiée sous `/admin/verification-nif`. */
export const TYPES_VERIFICATION = [
  { id: 'sql', label: 'Requête SQL', route: '/admin/verification-nif/sql' },
  { id: 'excel', label: 'Fichier Excel', route: '/admin/verification-nif/excel' },
  { id: 'json', label: 'Catalogue JSON', route: '/admin/verification-nif/json' },
];

const historiqueKey = (type) => `verif_nif_historique_${type}`;

/** Référentiel exemple pré-intégré, utilisé tant qu'aucune source n'a été liée. */
export const REFERENTIEL_DEFAUT = [
  { nif: '1000000001', raison_sociale: 'JIRAMA S.A.', centre: 'DGE', statut: 'Certifié', source: 'SQL / Base locale' },
  { nif: '1000000002', raison_sociale: 'TELMA MADAGASCAR', centre: 'DGE', statut: 'Certifié', source: 'SQL / Base locale' },
  { nif: '2000000003', raison_sociale: 'AIR MADAGASCAR', centre: 'DGE', statut: 'Certifié', source: 'SQL / Base locale' },
  { nif: '3000000004', raison_sociale: 'PHARMACIE CENTRALE', centre: 'SRE 1 Analamanga', statut: 'Certifié', source: 'unitefiscal.json' },
  { nif: '3000000005', raison_sociale: 'DISTRIBUTEUR DU NORD', centre: 'SRE 2 Analamanga', statut: 'Certifié', source: 'unitefiscal.json' },
];

/** Identifiant court d'une opération ; n'exige pas de contexte sécurisé. */
export const nouvelIdentifiant = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/** Entrée du journal d'erreurs affiché par `<ErreursVerification />`. */
export const nouvelleErreur = (titre, message) => ({ id: nouvelIdentifiant(), titre, message });

function lireJsonCle(cle, fallback) {
  try {
    const saved = localStorage.getItem(cle);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function ecrireJsonCle(cle, valeur) {
  try {
    localStorage.setItem(cle, JSON.stringify(valeur));
    return true;
  } catch {
    // Stockage indisponible (navigation privée, quota) : la session reste utilisable.
    return false;
  }
}

export function loadReferentiel() {
  return lireJsonCle(REFERENTIEL_KEY, REFERENTIEL_DEFAUT);
}

/**
 * Fusionne de nouvelles entrées avec le référentiel en gardant la première
 * occurrence d'un NIF, puis persiste le résultat pour les autres pages.
 */
export function mergeReferentiel(nouvellesEntrees, precedent = loadReferentiel()) {
  const map = new Map();
  [...nouvellesEntrees, ...precedent].forEach((item) => {
    if (item.nif && !map.has(item.nif)) map.set(item.nif, item);
  });

  const result = Array.from(map.values());
  ecrireJsonCle(REFERENTIEL_KEY, result);
  return result;
}

export function loadHistorique(type) {
  return lireJsonCle(historiqueKey(type), []);
}

/** Ajoute une opération en tête d'historique et n'en conserve que les trois dernières. */
export function pushHistorique(type, entree) {
  const historique = [{ ...entree, date: new Date().toISOString() }, ...loadHistorique(type)].slice(
    0,
    HISTORIQUE_MAX,
  );
  ecrireJsonCle(historiqueKey(type), historique);
  return historique;
}

export function formatDateHeure(value) {
  if (!value) return '—';
  const date = new Date(value);
  return `${date.toLocaleDateString('fr-FR')} à ${date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

/**
 * 1 · Vérification d'un NIF : la base SQL d'abord, le référentiel local en repli.
 * Renvoie toujours un résultat ; l'erreur API est propagée à l'appelant.
 */
export async function verifierNifSql(query, referentiel = loadReferentiel()) {
  const nif = String(query || '').trim();
  const contribuable = await getContribuableByNif(nif);

  if (contribuable) {
    return {
      trouve: true,
      nif: contribuable.nif,
      raison_sociale: contribuable.raison_sociale,
      secteur: contribuable.secteur_activite || 'Général',
      centre: contribuable.centres?.nom_centre || contribuable.centre_fiscal_ref || 'Non renseigné',
      regime: contribuable.regime_fiscal || 'Réel',
      source: 'Base de données SQL (PostgreSQL)',
    };
  }

  const dansReferentiel = referentiel.find((item) => String(item.nif).trim() === nif);
  if (dansReferentiel) {
    return {
      trouve: true,
      nif: dansReferentiel.nif,
      raison_sociale: dansReferentiel.raison_sociale,
      secteur: 'Certifié au catalogue',
      centre: dansReferentiel.centre,
      regime: 'Conforme',
      source: dansReferentiel.source || 'Référentiel NIF',
    };
  }

  return {
    trouve: false,
    nif,
    message: `Le NIF ${nif} est introuvable dans la base SQL et le référentiel officiel.`,
  };
}

/**
 * 2 · Lecture client d'un classeur Excel : chaque ligne devient une entrée du
 * référentiel. Les colonnes acceptées sont NIF/nif/Numero, RaisonSociale/Nom/
 * raison_sociale et Centre/centre ; les lignes sans NIF sont ignorées.
 */
export function lireNifsDepuisExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const workbook = XLSX.read(evt.target?.result, { type: 'binary' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const lignes = XLSX.utils.sheet_to_json(sheet);

        if (!lignes?.length) {
          reject(new Error('Le fichier Excel ne contient aucune ligne valide.'));
          return;
        }

        const entrees = normaliserLignesNif(lignes, {
          source: `Excel: ${file.name}`,
          statut: 'Certifié (Excel)',
        });

        if (!entrees.length) {
          reject(new Error('Aucune colonne NIF exploitable dans ce fichier.'));
          return;
        }

        resolve(entrees);
      } catch (err) {
        reject(new Error(`Lecture du fichier impossible : ${err.message}`));
      }
    };

    reader.onerror = () => reject(new Error('Lecture du fichier interrompue.'));
    reader.readAsBinaryString(file);
  });
}

/**
 * 3 · Synchronisation avec le catalogue des unités fiscales et ses NIFs de
 * contrôle. Le catalogue est le même module JSON que `utils/uniteFiscale.utils` ;
 * il n'est pas servi en statique, donc importé directement.
 */
export async function synchroniserCatalogueJson() {
  const entrees = [];

  if (catalogue.unites_operationnelles?.direction_des_grandes_entreprises) {
    const dge = catalogue.unites_operationnelles.direction_des_grandes_entreprises;
    entrees.push({
      nif: '0000000001',
      raison_sociale: dge.nom_complet || 'DGE Direction',
      centre: 'DGE',
      statut: 'Certifié (JSON)',
      source: 'unitefiscal.json',
    });
  }

  entrees.push(
    { nif: '4000100021', raison_sociale: 'BTM BANK MADAGASCAR', centre: 'DGE', statut: 'Certifié (JSON)', source: 'Catalogue NIF JSON' },
    { nif: '4000100022', raison_sociale: 'SOCIETE BOISSONS MADAGASCAR', centre: 'SRE 1 Analamanga', statut: 'Certifié (JSON)', source: 'Catalogue NIF JSON' },
    { nif: '4000100023', raison_sociale: 'MADAGASCAR ENERGY CORP', centre: 'SRE 2 Analamanga', statut: 'Certifié (JSON)', source: 'Catalogue NIF JSON' },
  );

  return entrees;
}

/**
 * NIFs des 100 premiers contribuables de la base, pour enrichir le référentiel
 * à l'ouverture des pages de vérification.
 */
export function nifsDepuisContribuables(data) {
  const liste = data?.data || (Array.isArray(data) ? data : []);
  return liste
    .filter((contribuable) => contribuable.nif)
    .map((contribuable) => ({
      nif: contribuable.nif,
      raison_sociale: contribuable.raison_sociale,
      centre: contribuable.centres?.nom_centre || contribuable.centre_fiscal_ref || 'Centre Fiscal',
      statut: 'Certifié (Base SQL)',
      source: 'PostgreSQL / contribuables',
    }));
}

/* ─────────────────────────── Gabarits téléchargeables ─────────────────────────── */

/** Colonnes admises par `lireNifsDepuisExcel`, reprises telles quelles dans le gabarit. */
export const COLONNES_MODELE = ['NIF', 'RaisonSociale', 'Centre'];

/** Nom du fichier du gabarit Excel, tel qu'attendu par la page de liaison. */
export const MODELE_EXCEL_NOM = 'modele de verificationnif.xls';

/** Nom du fichier du gabarit JSON. */
export const MODELE_JSON_NOM = 'modele de verificationnif.json';

/**
 * Gabarit complet servi en téléchargement et déposé tel quel dans
 * `frontend/public/referentiel-nif/modele-de-verificationnif.json`.
 */
export const MODELE_JSON = {
  description:
    "Modèle vierge de référentiel NIF : remplacez l'entrée d'exemple par vos contribuables certifiés, puis déclarez ce fichier comme API JSON depuis la page « 3 · Synchronisation Base JSON » du back-office.",
  colonnes: ['NIF', 'RaisonSociale', 'Centre', 'statut (facultatif)', 'source (facultatif)'],
  referentiel: [
    {
      NIF: '3000000004',
      RaisonSociale: 'RAISON SOCIALE DU CONTRIBUTABLE',
      Centre: 'SRE 1 Analamanga',
      statut: 'Certifié',
      source: 'modele-de-verificationnif.json',
    },
  ],
};

/**
 * Génère le classeur vierge `modele de verificationnif.xls` : une feuille
 * « NIF » portant uniquement la ligne d'en-têtes des colonnes reconnues.
 */
export function telechargerModeleExcel() {
  const feuille = XLSX.utils.aoa_to_sheet([COLONNES_MODELE]);
  feuille['!cols'] = [{ wch: 14 }, { wch: 34 }, { wch: 24 }];

  const classeur = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(classeur, feuille, 'NIF');
  XLSX.writeFile(classeur, MODELE_EXCEL_NOM, { bookType: 'xls' });
}

/** Téléchargement côté navigateur d'un gabarit JSON au même format que l'import. */
export function telechargerModeleJson() {
  telechargerFichier(MODELE_JSON_NOM, JSON.stringify(MODELE_JSON, null, 2), 'application/json');
}

function telechargerFichier(nom, contenu, typeMime) {
  const url = URL.createObjectURL(new Blob([contenu], { type: typeMime }));
  const lien = document.createElement('a');
  lien.href = url;
  lien.download = nom;
  document.body.appendChild(lien);
  lien.click();
  lien.remove();
  URL.revokeObjectURL(url);
}

/* ───────────────────────────── Requêtes longues ───────────────────────────── */

/** Un NIF malgache est composé de 10 chiffres, éventuellement suivis d'une clé. */
const NIF_DANS_TEXTE = /\b\d{10}[A-Za-z]?\b/g;

/**
 * Extrait le NIF d'une saisie libre : un NIF seul, ou le premier repéré dans une
 * requête SQL plus longue (`SELECT … WHERE nif = '3000000004'`). Renvoie une
 * `erreur` bloquante quand aucun NIF n'est identifiable, et un `avertissement`
 * quand la saisie en contient plusieurs.
 */
export function extraireNifDepuisRequete(texte) {
  const nettoye = String(texte || '').replace(/\s+/g, ' ').trim();
  const detectes = nettoye.match(NIF_DANS_TEXTE) || [];

  if (!detectes.length) {
    return {
      erreur: `Aucun NIF à 10 chiffres détecté dans la saisie (${nettoye.length} caractère(s)). Écrivez le NIF seul, ou une requête qui en contient un.`,
    };
  }

  const nif = detectes[0].replace(/[^0-9]/g, '');
  if (detectes.length > 1) {
    return { nif, avertissement: `Plusieurs NIFs repérés (${detectes.join(', ')}) : seul ${nif} est vérifié.` };
  }

  return { nif };
}

/* ─────────────────────────── SELECT qui liste des lignes ─────────────────────────── */

/** Colonnes que `GET /api/contribuables` sait restituer, et leurs synonymes SQL. */
const COLONNES_CONTRIBUABLES = [
  { key: 'nif', label: 'NIF', alias: ['nif', 'numero', 'numeroidentifiantfiscal'] },
  { key: 'raison_sociale', label: 'Raison sociale', alias: ['raison_sociale', 'raisonsociale', 'nom', 'entreprise'] },
  { key: 'centre', label: 'Centre fiscal', alias: ['centre', 'nom_centre', 'centre_fiscal', 'centre_fiscal_ref'] },
  { key: 'secteur_activite', label: 'Secteur', alias: ['secteur', 'secteur_activite'] },
  { key: 'regime_fiscal', label: 'Régime', alias: ['regime', 'regime_fiscal'] },
  { key: 'statut_conformite', label: 'Conformité', alias: ['statut', 'conformite', 'statut_conformite', 'etat'] },
  { key: 'nb_declarations', label: 'Déclarations', alias: ['nb_declarations', 'nombre_declarations', 'declarations'] },
];

/** Colonnes rendues pour `SELECT *`. */
const ETOILE = COLONNES_CONTRIBUABLES;

/** Plafond de lignes demandé à l'API, même si la requête réclame plus. */
const LIMITE_MAX = 100;

const LIMITE_DANS_REQUETE = /\blimit\s+(\d{1,4})\b/i;

/** Premier littéral entre guillemets ou apostrophes du `WHERE`. */
const LITTERAL_DANS_WHERE = /\bwhere\b(.*?)(?=\b(group\s+by|order\s+by|limit)\b|$)/i;

/**
 * Reconnaît un `SELECT` de liste sur la table `contribuables` : colonnes
 * projetées, filtre et `LIMIT`. Renvoie `null` quand la saisie n'est pas une
 * liste interrogeable ici (pas un SELECT, autre table, projection vide).
 */
export function analyserSelectListe(texte) {
  const nettoye = String(texte || '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/;\s*$/, '');

  const select = /^select\s+(.+?)\s+from\s+([a-z_][\w.]*)(.*)$/i.exec(nettoye);
  if (!select) {
    return { erreur: "La saisie n'a pas la forme `SELECT … FROM contribuables [WHERE …] [LIMIT n]`." };
  }

  const table = select[2].split('.').pop().toLowerCase();
  if (table !== 'contribuables') {
    return { erreur: `Seule la table « contribuables » est interrogeable sur cette page (reçue : « ${table} »).` };
  }

  const corps = select[3] || '';
  const projection = select[1]
    .replace(/\bdistinct\b/gi, ' ')
    .split(',')
    .map((mot) => mot.replace(/[`"[\]]/g, '').trim())
    .filter(Boolean);

  let colonnes = ETOILE;
  const ignorees = [];
  if (!projection.includes('*')) {
    colonnes = [];
    projection.forEach((mot) => {
      const nom = mot.split('.').pop().toLowerCase().replace(/\s+/g, '_');
      const trouvee = COLONNES_CONTRIBUABLES.find((colonne) => colonne.key === nom || colonne.alias.includes(nom));
      if (trouvee) {
        if (!colonnes.includes(trouvee)) colonnes.push(trouvee);
      } else {
        ignorees.push(mot);
      }
    });

    if (!colonnes.length) {
      return { erreur: `Aucune colonne servie par l'API dans la projection (${projection.join(', ')}).` };
    }
  }

  const limiteBrute = parseInt(LIMITE_DANS_REQUETE.exec(corps)?.[1] ?? '20', 10);
  const limite = Math.min(Math.max(limiteBrute || 20, 1), LIMITE_MAX);

  const where = LITTERAL_DANS_WHERE.exec(corps)?.[1] || '';
  const recherche = (where.match(/['"]([^'"]+)['"]/) || [])[1]?.replace(/[%_]/g, '').trim() || '';

  return {
    table: 'contribuables',
    colonnes,
    limite,
    recherche,
    avertissement: ignorees.length
      ? `Colonne(s) non servie(s) par l'API et ignorée(s) : ${ignorees.join(', ')}.`
      : '',
  };
}

/**
 * Exécute réellement un `SELECT` de liste : le `WHERE` est compris comme une
 * recherche sur le NIF, la raison sociale ou le secteur (comportement de
 * l'API), et le `LIMIT` borne le nombre de lignes demandées.
 */
export async function executerSelectListe(requete) {
  const analyse = analyserSelectListe(requete);
  if (analyse.erreur) return analyse;

  const params = { limit: analyse.limite };
  if (analyse.recherche) params.search = analyse.recherche;

  const resultat = await getContribuables(params);
  const lignes = (resultat?.data || []).map((contribuable) => ({
    id: contribuable.id_contribuable,
    nif: contribuable.nif,
    valeur: Object.fromEntries(
      analyse.colonnes.map((colonne) => [colonne.key, valeurDeColonne(contribuable, colonne.key)]),
    ),
  }));

  return { ...analyse, lignes, total: resultat?.pagination?.total ?? lignes.length };
}

/** Valeur affichable d'une colonne pour un contribuable de l'API. */
function valeurDeColonne(contribuable, cle) {
  const valeur =
    cle === 'centre' ? contribuable.centres?.nom_centre || contribuable.centre_fiscal_ref : contribuable[cle];
  return valeur === null || valeur === undefined || valeur === '' ? '—' : String(valeur);
}

/* ───────────────────────────── APIs JSON tierces ───────────────────────────── */

/** Clé de conservation des API JSON enregistrées par l'administrateur. */
const APIS_JSON_KEY = 'verif_nif_apis_json';

/**
 * Les fichiers de référence déposés dans `frontend/public/referentiel-nif/` sont
 * servis par le frontend ; ce préfixe permet à l'administrateur de les déclarer
 * comme source sans taper l'URL complète.
 */
export const DOSSIER_REFERENTIEL_LOCAL = '/referentiel-nif/';

export function loadApisJson() {
  return lireJsonCle(APIS_JSON_KEY, []);
}

export function saveApisJson(apis) {
  ecrireJsonCle(APIS_JSON_KEY, apis);
  return apis;
}

/** Ajoute (ou remplace) une API JSON enregistrée, en refusant les doublons d'URL. */
export function pushApiJson(url, libelle) {
  const absolute = normaliserUrlApi(url);
  const sansDoublon = loadApisJson().filter((item) => item.url !== absolute);
  const api = {
    url: absolute,
    label: String(libelle || '').trim() || nomDepuisUrl(absolute),
    id: nouvelIdentifiant(),
    date: new Date().toISOString(),
  };

  return { apis: saveApisJson([api, ...sansDoublon]), api };
}

export function removeApiJson(id) {
  return saveApisJson(loadApisJson().filter((item) => item.id !== id));
}

/** Marque une API comme synchronisée : date et nombre de NIFs fusionnés. */
export function marquerApiSynchronisee(id, { nbNifs, total }) {
  return saveApisJson(
    loadApisJson().map((item) =>
      item.id === id ? { ...item, synchroniseeLe: new Date().toISOString(), nbNifs, total } : item,
    ),
  );
}

/** Nom de fichier ou hôte de l'URL, utilisé comme libellé d'API. */
function nomDepuisUrl(url) {
  const { pathname, host } = new URL(url, window.location.origin);
  const dernier = pathname.split('/').filter(Boolean).pop();
  return dernier || host;
}

/** Seuls `http`/`https`, absolu ou chemin du site : pas de `file:` ni de `javascript:`. */
function normaliserUrlApi(url) {
  const brut = String(url || '').trim();
  if (!brut) throw new Error("L'URL de l'API JSON est vide.");

  const absolute = /^https?:\/\//i.test(brut);
  const cheminSite = brut.startsWith('/');
  if (!absolute && !cheminSite) {
    throw new Error("Adresse invalide : indiquez une URL commençant par http(s):// ou par / (fichier du dossier public).");
  }

  const analyse = new URL(brut, window.location.origin);
  if (!['http:', 'https:'].includes(analyse.protocol)) {
    throw new Error(`Protocole non autorisé : ${analyse.protocol}`);
  }

  return cheminSite ? analyse.pathname + analyse.search : analyse.toString();
}

/**
 * Appelle une API JSON et transforme sa réponse en entrées du référentiel.
 * Réponse admise : un tableau, ou un objet portant `data`, `resultats` ou
 * `referentiel`. Les mêmes colonnes que le modèle Excel sont reconnues.
 */
export async function chargerReferentielDepuisApiJson(url) {
  const absolute = normaliserUrlApi(url);

  let reponse;
  try {
    reponse = await fetch(absolute, { headers: { Accept: 'application/json' } });
  } catch (fetchError) {
    throw new Error(
      `Appel impossible vers ${absolute} (${fetchError.message}). Vérifiez l'adresse et les autorisations CORS du serveur.`,
      { cause: fetchError },
    );
  }

  if (!reponse.ok) {
    throw new Error(`Réponse ${reponse.status} ${reponse.statusText || ''} de l'API ${absolute}`.trim());
  }

  let payload;
  try {
    payload = await reponse.json();
  } catch {
    throw new Error(`La réponse de ${absolute} n'est pas un JSON valide.`);
  }

  const lignes = extraireListeDepuisPayload(payload);
  const entrees = normaliserLignesNif(lignes, {
    source: `API JSON: ${absolute}`,
    statut: 'Certifié (API JSON)',
  });

  if (!entrees.length) {
    throw new Error(`Aucun NIF exploitable dans la réponse de ${absolute}.`);
  }

  return entrees;
}

function extraireListeDepuisPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.resultats)) return payload.resultats;
  if (Array.isArray(payload?.referentiel)) return payload.referentiel;
  throw new Error('Format non reconnu : le JSON doit être un tableau, ou un objet avec une clé data, resultats ou referentiel.');
}

/** Mappe des lignes quelconques vers le format du référentiel, en ignorant celles sans NIF. */
function normaliserLignesNif(lignes, { source, statut }) {
  return lignes
    .map((row) => ({
      nif: String(row?.NIF || row?.nif || row?.Numero || row?.numero || '').trim(),
      raison_sociale: String(row?.RaisonSociale || row?.raison_sociale || row?.Nom || row?.nom || 'Entreprise').trim(),
      centre: String(row?.Centre || row?.centre || 'Centre Fiscal').trim(),
      statut: String(row?.statut || statut),
      source: String(row?.source || source),
    }))
    .filter((item) => item.nif);
}

