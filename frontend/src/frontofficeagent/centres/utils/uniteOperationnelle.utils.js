import { getOperationalUnits } from '@/frontofficeagent/centres/utils/uniteFiscale.utils';

/**
 * Les deux sources du module décrivent le même objet — l'unité opérationnelle —
 * avec des champs qui ne se recouvrent pas :
 *
 * - la table `centres` (`GET /api/centres`) est le **registre administré** :
 *   numéro officiel du centre, contacts saisis par l'administration et, par
 *   `_count`, le nombre de dossiers qui lui sont rattachés ;
 * - `unitefiscal.json` est la **cartographie institutionnelle** : régions
 *   couvertes, DRI de rattachement, adresse, téléphones multiples.
 *
 * Cette jointure remplace les deux écrans qui affichaient chacun une source :
 * une ligne fusionne les deux quand elles se reconnaissent, et rien n'est
 * inventé pour la source absente — `null` veut dire « non renseigné ».
 */

/** Table `centres`.`type_centre` → clé de `unites_operationnelles`. */
const CLE_PAR_TYPE_CENTRE = {
  'Centre Fiscal': 'centres_fiscaux',
  SRE: 'sre',
  DGE: 'dge',
};

/** Libellé de type d'une clé du référentiel, pour les unités sans ligne en base. */
const TYPE_PAR_CLE = {
  dge: 'DGE',
  sre: 'SRE',
  centres_fiscaux: 'Centre Fiscal',
};

/** Ordre de lecture de la cartographie : direction nationale, puis régional, puis local. */
const CLES_UNITE = ['dge', 'sre', 'centres_fiscaux'];

/**
 * Clé du rattachement fiscal, au format que porte déjà `contribuables.centre_fiscal_ref`
 * côté backend (`cle:nom`) : un seul langage entre l'annuaire, la base et l'URL.
 */
export const referenceUnite = (cle, nom) => `${cle}:${nom}`;

const premiereValeur = (...valeurs) =>
  valeurs.find((valeur) => valeur !== null && valeur !== undefined && valeur !== '') ?? null;

export const formaterTelephone = (telephone) => {
  if (!telephone) return null;
  return Array.isArray(telephone) ? telephone.join(' / ') : String(telephone);
};

export const regionsCouvertes = (unite) =>
  (unite ? premiereValeur(unite.regions_couvertes?.join(', '), unite.region) : null);

/** URL de la fiche — le nom remplace l'index positionnel de l'ancien annuaire. */
export const cheminUnite = ({ cle, nom }) =>
  `/unites-operationnelles/${encodeURIComponent(cle)}/${encodeURIComponent(nom)}`;

const ligneDuReferentiel = (cle, unite, centre) => ({
  cle,
  nom: unite.nom,
  reference: referenceUnite(cle, unite.nom),
  type: premiereValeur(centre?.type_centre, unite.type, TYPE_PAR_CLE[cle]),
  id_centre: centre?.id_centre ?? null,
  numero: centre?.numero_centre ?? null,
  email: premiereValeur(centre?.email_centre, unite.email),
  telephone: premiereValeur(formaterTelephone(centre?.telephone_centre), formaterTelephone(unite.telephone)),
  adresse: unite.adresse ?? null,
  dri: premiereValeur(unite.dri, unite.rattachement),
  regions: regionsCouvertes(unite),
  nbContribuables: centre?._count?.contribuables ?? null,
  unite,
  enregistre: Boolean(centre),
});

const ligneDeBaseSeule = (centre) => {
  const cle = CLE_PAR_TYPE_CENTRE[centre.type_centre] ?? 'autre';

  return {
    cle,
    nom: centre.nom_centre,
    reference: referenceUnite(cle, centre.nom_centre),
    type: centre.type_centre,
    id_centre: centre.id_centre,
    numero: centre.numero_centre ?? null,
    email: centre.email_centre ?? null,
    telephone: formaterTelephone(centre.telephone_centre),
    adresse: null,
    dri: null,
    regions: null,
    nbContribuables: centre._count?.contribuables ?? null,
    unite: null,
    enregistre: true,
  };
};

/**
 * Toutes les unités opérationnelles : chaque entrée du référentiel enrichie de
 * sa ligne de registre quand elle existe, puis les centres enregistrés que le
 * référentiel ne cartographie pas (centre SSIF, créations administratives). Une
 * unité cartographiée mais absente du registre reste visible : c'est le vide
 * que le registre doit combler, pas un fantôme à masquer.
 */
export const construireUnites = (centres = []) => {
  const lignesEnbase = new Map();
  for (const centre of centres) {
    const cle = CLE_PAR_TYPE_CENTRE[centre.type_centre];
    if (cle) lignesEnbase.set(referenceUnite(cle, centre.nom_centre), centre);
  }

  const lignes = CLES_UNITE.flatMap((cle) =>
    getOperationalUnits(cle).map((unite) =>
      ligneDuReferentiel(cle, unite, lignesEnbase.get(referenceUnite(cle, unite.nom)) ?? null)
    )
  );

  const orphelines = centres
    .filter((centre) => !lignes.some((ligne) => ligne.id_centre === centre.id_centre))
    .map(ligneDeBaseSeule);

  return [...lignes, ...orphelines];
};

/**
 * Unité d'une fiche, retrouvée depuis l'URL (`cle` + `nom`) et la liste chargée
 * du registre. Une unité cartographiée sans ligne en base se consulte quand
 * même : seule la partie « registre » de la fiche reste vide.
 */
export const trouverUnite = ({ cle, nom, centres = [] }) =>
  construireUnites(centres).find((ligne) => ligne.cle === cle && ligne.nom === nom) ?? null;
