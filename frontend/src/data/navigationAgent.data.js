/**
 * Registre unique des écrans du frontoffice agent.
 *
 * Chaque écran y tient une seule fois son nom, son chemin, son icône et le groupe
 * auquel il appartient. `AgentSidebar` affiche les cinq espaces principaux ; les
 * pages de dossier restent accessibles par les onglets de `DossierFiscalNavigation`.
 * L'état actif se résout sur tout le registre, y compris les écrans secondaires.
 *
 * Champ `chemin` : adresse de l'écran. `alias` : autres préfixes qui désignent le
 * même écran. `section` : id du groupe, et donc de l'entrée de rail allumée.
 * `chefCentre` : entrée réservée au chef de centre, seule passerelle vers
 * l'administration.
 */
export const ECRANS_AGENT = [
  {
    id: 'accueil',
    chemin: '/accueil',
    label: 'Accueil',
    icone: ['M3 10.5 12 3l9 7.5', 'M5.5 9.5V21h13V9.5', 'M9.5 21v-7h5v7'],
    rail: true,
  },
  {
    id: 'dossiers',
    chemin: '/contribuables',
    label: 'Dossiers',
    icone: [
      'M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2',
      'M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
      'M20 21v-2a4 4 0 0 0-3-3.87',
      'M16 3.13a4 4 0 0 1 0 7.75',
    ],
    rail: true,
  },
  { id: 'suivi', chemin: '/suivi', label: 'Suivi fiscal', section: 'dossiers' },
  { id: 'file', chemin: '/file-de-travail', label: 'File de travail', section: 'dossiers' },
  { id: 'relance', chemin: '/relance', label: 'Relances', section: 'dossiers' },
  { id: 'entreprise', chemin: '/entreprises/nouveau', label: 'Nouveau contribuable', section: 'dossiers' },
  {
    id: 'collecte',
    chemin: '/collecte',
    label: 'Contrôle',
    icone: ['M4 4h16v16H4z', 'm8 12 2.5 2.5L16 9'],
    rail: true,
  },
  {
    id: 'statistique',
    chemin: '/decisionnel',
    label: 'Statistiques',
    icone: ['M4 20V4', 'M4 20h17', 'm8 16 4-5 3 2 5-7'],
    rail: true,
  },
  {
    id: 'unites',
    chemin: '/unites-operationnelles',
    label: 'Organisation',
    icone: ['M3 21h18', 'M5 21V7l7-4 7 4v14', 'M9 10h.01', 'M15 10h.01', 'M9 14h.01', 'M15 14h.01', 'M10 21v-4h4v4'],
    alias: ['/centres', '/centres-fiscaux', '/register'],
    rail: true,
  },
  {
    id: 'previsions',
    chemin: '/previsions',
    label: 'Prévision',
    icone: ['M4 19V5', 'M4 19h16', 'M8 15v-3', 'M12 15V8', 'M16 15v-5', 'm7 7 4-3 5 2'],
    chefCentre: true,
    rail: true,
  },
  {
    id: 'equipe',
    chemin: '/admin/utilisateurs',
    label: 'Mon équipe',
    icone: [
      'M3.5 5h17v14h-17z',
      'M9 11.1a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6',
      'M6 16.6c0-1.66 1.34-3 3-3s3 1.34 3 3',
      'M15 8.5h3.5',
      'M15 11.5h3.5',
    ],
    chefCentre: true,
    rail: true,
  },
];

/**
 * Pages secondaires du groupe Dossiers, dans l'ordre du parcours habituel.
 * Les libellés viennent du registre : l'onglet et la barre disent le même nom.
 */
export const SECTIONS_AGENT = [
  {
    id: 'dossiers',
    ariaLabel: 'Navigation des dossiers fiscaux',
    ecrans: ['dossiers', 'suivi', 'file', 'relance', 'entreprise'],
  },
];

/** Sous-modules de saisie de la collecte, tels que les nomme l'en-tête. */
export const SOUS_MODULES_COLLECTE = [
  { id: 'sales', label: 'TVA à payer' },
  { id: 'theoretical', label: 'TVA théorique' },
  { id: 'reconciliation', label: 'Recoupement' },
  { id: 'declaration', label: 'Déclaration' },
];

const parId = new Map(ECRANS_AGENT.map((ecran) => [ecran.id, ecran]));

const tousLesChemins = (ecran) => [ecran.chemin, ...(ecran.alias ?? [])];

/**
 * Écran auquel appartient une URL, en privilégiant le préfixe le plus long pour
 * qu'un chemin profond (`/contribuables/72/relances`) compte pour son écran.
 */
export const trouveEcran = (pathname) => {
  let gagnant = null;
  let longueur = 0;

  for (const ecran of ECRANS_AGENT) {
    for (const chemin of tousLesChemins(ecran)) {
      const correspond = pathname === chemin || pathname.startsWith(`${chemin}/`);
      if (correspond && chemin.length > longueur) {
        gagnant = ecran;
        longueur = chemin.length;
      }
    }
  }

  return gagnant;
};

/** Groupe de l'écran — lui-même s'il est déjà une entrée de barre. */
export const groupeDe = (ecran) => (ecran ? parId.get(ecran.section ?? ecran.id) : null);

/** Entrées de la barre latérale, passerelle du chef de centre comprise. */
export const entreesRail = (estChefCentre) =>
  ECRANS_AGENT.filter((ecran) => ecran.rail && (!ecran.chefCentre || estChefCentre));

/** Onglets d'un domaine, sous le libellé du registre. */
export const ongletsDeSection = (id) => {
  const section = SECTIONS_AGENT.find((uneSection) => uneSection.id === id);
  return {
    ariaLabel: section?.ariaLabel ?? 'Navigation du domaine',
    liens: (section?.ecrans ?? []).map((ecranId) => {
      const ecran = parId.get(ecranId);
      return { to: ecran.chemin, label: ecran.label };
    }),
  };
};
