/**
 * Textes fiscaux officiels de Madagascar et renvois légaux de l'application.
 *
 * Pourquoi ce fichier est hors des trois espaces : la page d'aide du portail,
 * les actes imprimables et les écrans d'instruction citent les mêmes articles.
 * Une citation recopiée à trois endroits finit par diverger — c'est exactement
 * ce qui s'était produit avec « art. V-17 » et « art. V-19 », qui ne correspondent
 * à rien dans le Code des procédures fiscales. La référence est donc écrite
 * une seule fois ici, avec son URL, et les composants ne font que l'afficher.
 *
 * Règle de sourcing : un article n'est cité que s'il a été relu dans le PDF de
 * l'éditeur indiqué, à la page imprimée mentionnée. Trois états sont possibles :
 *
 * - `conforme: true` — la valeur affichée par l'application se lit dans l'article ;
 * - `conforme: 'partiel'` — l'article couvre le sujet mais n'énonce pas la valeur
 *   de l'application (taux, seuil ou délai différent) ; `ecart` dit lequel ;
 * - pas de `source` — la règle est interne au système (tolérance de rapprochement,
 *   délais de relance, sécurité du lien) : rien dans le texte, donc aucun lien.
 *
 * Le lien reste posé dans les deux premiers cas : ouvrir le PDF et tomber sur
 * l'article cité fait partie de la vérification, y compris quand l'article dit
 * autre chose que le chiffre affiché — c'est alors `ecart` qui doit le dire.
 *
 * `page` est le numéro **imprimé sur le feuillet** (le folio), pas la nième page
 * du fichier : les trois PDF ont des pages de titre non numérotées avant le
 * premier folio. Chaque document porte donc son `decalagePage` — vérifié page par
 * page sur l'extraction texte du fichier — et `referenceLegale()` s'en sert pour
 * ajouter `#page=` à l'URL : le lecteur arrive sur l'article, pas sur la couverture.
 */

export const TEXTES_FISCAUX = {
  cdi: {
    sigle: 'Code des impôts',
    titre: 'Code des impôts — édition consolidée pour l’année 2025',
    editeur: 'Direction Générale des Impôts — Madagascar',
    url: 'https://portal.impots.mg/textes/textes/2025-02-06--N-2025-MEF.SG.DGI-Ref-HIH9EC-3OPLT3.pdf',
    decalagePage: 1,
    observation:
      'Aucune édition consolidée « 2026 » n’est publiée sur le portail de la DGI : pour 2026, le texte applicable est l’édition 2025 telle que modifiée par la loi de finances n° 2025-021.',
  },
  cpf: {
    sigle: 'Code des procédures fiscales',
    titre: 'Code des procédures fiscales — édition consolidée pour l’année 2025',
    editeur: 'Direction Générale des Impôts — Madagascar',
    url: 'https://portal.impots.mg/textes/textes/2025-02-06--N-2025-MEF.SG.DGI-Ref-ZIT5BN-B0NX39.pdf',
    decalagePage: 1,
  },
  lf2026: {
    sigle: 'Loi de finances 2026',
    titre: 'Loi n° 2025-021 du 20 décembre 2025 portant loi de finances pour l’année 2026',
    editeur: 'Ministère de l’Économie et des Finances — Madagascar',
    url: 'https://www.mef.gov.mg/assets/vendor/ckeditor/plugins/kcfinder/upload/files/2026/janv/LOI_n%C2%B0_2025-021_VF_LFI__2026.pdf',
    decalagePage: 2,
  },
};

/** Ce qui a été vérifié, et comment — affiché en pied de la page d'aide. */
export const VERIFICATION_TEXTES = {
  date: '2 novembre 2026',
  methode:
    'Chaque article cité a été relu dans le PDF de l’éditeur indiqué ; les numéros de page sont ceux imprimés sur le document, et chaque lien ouvre le fichier à la page correspondante.',
  annuaire: 'https://portal.impots.mg/textes/',
  annuaireLibelle: 'Index des textes réglementaires de la Direction Générale des Impôts',
};

/**
 * Les références vérifiées, écrites une seule fois.
 *
 * Le portail contribuable (`accountcontribuable/data/regles.data.js`), les actes
 * imprimables (`components/common/NotificationModal.jsx`,
 * `DemandeEclaircissementModal.jsx`) et les écrans d'instruction
 * (`frontofficeagent/`) citent les mêmes articles. Ces trois espaces ne peuvent
 * pas s'importer entre eux — ils sont étanches par construction —, ils partagent
 * donc ce registre neutre : un article qui change de numéro ou de page change
 * ici, et nulle part ailleurs.
 *
 * Chaque entrée se lit `{ texte, article, page, conforme, citation, ecart }` :
 * `conforme: 'partiel'` signifie que l'article couvre le sujet sans énoncer la
 * valeur affichée par l'application, et `ecart` doit le dire au lecteur.
 */
export const REFERENCES = {
  eclaircissements: {
    texte: 'cpf',
    article: 'V-02',
    page: 87,
    conforme: 'partiel',
    citation:
      'Toutes les demandes écrites doivent […] assigner au contribuable pour fournir sa réponse, un délai franc de 15 jours.',
    ecart:
      'L’article fixe un délai franc de 15 jours ; l’acte en accorde 30, ce qui est plus favorable, et ce sont les 30 jours portés au dossier.',
  },
  sanction_eclaircissements: {
    texte: 'cpf',
    article: 'V-38',
    page: 93,
    citation:
      'Les contribuables qui se sont abstenus de répondre ou qui ont répondu hors du délai imparti aux demandes d’éclaircissements ou de justifications prévues par le présent Code sont taxés d’office.',
  },
  notification_primitive: {
    texte: 'cpf',
    article: 'V-04',
    page: 87,
    citation:
      'L’invitation du contribuable à faire parvenir son acceptation ou ses observations dans un délai de trente (30) jours, compté à partir de la date de réception d’une notification primitive.',
  },
  proposition_rectification: {
    texte: 'cpf',
    article: 'V-03',
    page: 87,
    citation:
      'L’agent chargé de l’assiette doit faire connaître au contribuable la nature et les motifs des redressements envisagés dans la notification primitive.',
  },
  notification_definitive: {
    texte: 'cpf',
    article: 'V-07',
    page: 88,
    citation:
      'À défaut de réponse dans le délai de trente (30) jours pour faire parvenir la réponse à la notification primitive, l’agent fixe la base d’imposition et établit la notification définitive.',
  },
  prorogation: {
    texte: 'cpf',
    article: 'VI-04 et VI-05',
    page: 107,
    conforme: 'partiel',
    citation:
      'Une prorogation des délais requis dans l’exécution de leurs obligations […] L’autorité décisionnaire peut accorder un nouveau délai dont la durée n’excède pas quinze jours compté à partir de la notification de la décision.',
    ecart:
      'Le texte ne parle pas d’un accord du centre gestionnaire : la demande est gracieuse, la décision revient à l’autorité décisionnaire et le nouveau délai ne peut excéder quinze jours.',
  },
  mise_en_demeure: {
    texte: 'cpf',
    article: 'VII-33',
    page: '128 et 129',
    conforme: 'partiel',
    citation:
      'La lettre de notification tient lieu de mise en demeure. Elle contient sommation d’avoir à payer sans délai les sommes énoncées dans le titre de perception. Celles-ci sont immédiatement exigibles.',
    ecart:
      'Dans le Code, la mise en demeure est la lettre de notification du titre de perception — un acte de recouvrement émis après la notification définitive. Les rappels et la « mise en demeure » de ce module sont des relances produites par l’application, dont le rythme en jours francs n’est fixé par aucun article.',
  },
  poursuites_recouvrement: {
    texte: 'cpf',
    article: 'VII-35',
    page: 130,
    citation:
      'Les poursuites procédant du titre de perception peuvent être engagées 15 jours après la notification de ce titre ou le commandement de payer lorsque le contribuable n’a pas acquitté les sommes dont il est redevable.',
  },
  droit_communication: {
    texte: 'cpf',
    article: 'IV-01',
    page: 73,
    citation:
      'Pour les besoins de l’assiette, de la liquidation, et du recouvrement, le droit de communication est reconnu à l’Administration fiscale.',
  },
  amende_40: {
    texte: 'cdi',
    article: '20.01.54',
    page: 170,
    citation:
      'Toute insuffisance, inexactitude, omission, minoration ou fausseté relevée dans toute déclaration périodique ou occasionnelle […] donne lieu au paiement d’une amende égale à 40p.100 du complément des droits exigibles.',
  },
  penalites_retard: {
    texte: 'cdi',
    article: '20.01.53',
    page: 170,
    citation:
      '3p.100 du montant à payer pour le premier mois et 1p.100 par mois de retard pour les mois suivants pour les contribuables ayant un Chiffre d’affaires ou revenu supérieur ou égal à Ar 400 000 000.',
  },
  penalite_rappel: {
    texte: 'cdi',
    article: '20.01.53',
    page: 170,
    conforme: 'partiel',
    citation:
      'Tout retard dans le paiement […] est passible d’une pénalité de retard. La totalité des pénalités à payer ne doit pas être inférieure à Ar 10 000.',
    ecart:
      'Les pénalités de retard de cet article sont mensuelles (1 % par mois, 2 % puis 1 %, 3 % puis 1 % selon le chiffre d’affaires) : aucun article ne liquide 10 % du principal d’un seul coup. Le taux porté au rappel vient de la saisie de l’agent.',
  },
  seuil_categorie: {
    texte: 'cdi',
    article: '20.01.53',
    page: 170,
    conforme: 'partiel',
    citation:
      '2p.100 du montant à payer pour le premier mois […] pour les contribuables dont le Chiffre d’affaires ou revenu est compris entre Ar 100 000 000 et Ar 400 000 000.',
    ecart:
      'Les bornes de 100 M et 400 M Ar se lisent dans l’article des pénalités de retard ; aucun article ne définit « grand, moyen, petit contribuable » sur ces seuils et l’article 20.01.52 en utilise d’autres (400 M, 200 M, 50 M). La catégorie affichée est celle que l’application déduit du dernier chiffre d’affaires.',
  },
  imputation_credit: {
    texte: 'cdi',
    article: '01.01.15 (IR) et 01.02.06 (IS)',
    page: '24 et 36',
    citation:
      'Le trop-perçu ouvre droit à un crédit d’impôt pouvant être imputé sur les règlements ultérieurs de droits de même nature se rapportant aux déclarations périodiques ou à une notification définitive d’un redressement fiscal.',
  },
  ir_taux: {
    texte: 'cdi',
    article: '01.01.14',
    page: 21,
    citation: 'Le taux de l’impôt est fixé à 20p.100.',
  },
  impot_synthetique: {
    texte: 'cdi',
    article: '01.02.05',
    page: 34,
    citation: 'Le taux de l’impôt est fixé à 5p.100 de la base imposable.',
  },
  taux_synthese_nouveaux_adherents: {
    texte: 'lf2026',
    article: '01.02.05 (modifié)',
    page: 39,
    citation:
      'Toutefois, ce taux est de 3p.100 pour les nouveaux adhérents des Centres de gestion agréés ainsi que les contribuables nouvellement immatriculés en ligne par leurs propres clients pour leurs premiers exercices.',
  },
  conservation_pieces: {
    texte: 'lf2026',
    article: '01.01.20 (modifié)',
    page: 37,
    citation:
      'Les livres prescrits par le présent article, ainsi que toutes les pièces justificatives des opérations effectuées par les intéressés […] doivent être conservés pendant un délai de 10 ans […] Ce délai de conservation est réduit à trois (3) ans pour les contribuables soumis à l’Impôt synthétique.',
  },
  tva_theorique: {
    texte: 'cdi',
    article: '06.01.12',
    page: 116,
    conforme: 'partiel',
    citation: 'Le taux normal de la Taxe sur la Valeur Ajoutée est fixé à 20p.100.',
    ecart:
      'Ce calcul ne se lit dans aucun article : le taux normal de TVA est de 20 % et l’impôt synthétique est de 5 % de la base imposable (art. 01.02.05). La TVA théorique est une attente produite par l’application pour comparer les paiements enregistrés, pas une taxe due.',
  },
  seuil_redressement: {
    texte: 'cpf',
    article: 'V-03',
    page: 87,
    conforme: 'partiel',
    citation:
      'L’agent chargé de l’assiette doit faire connaître au contribuable la nature et les motifs des redressements envisagés dans la notification primitive.',
    ecart:
      'Aucun texte ne fixe de pourcentage d’écart : le seuil de 50 % est un déclencheur de l’application, qui décide seule si une proposition de rectification est présentée.',
  },
  efacturation: {
    texte: 'lf2026',
    article: '20.01.56.33',
    page: 59,
    conforme: 'partiel',
    citation:
      'Toute personne […] astreinte à l’utilisation du système d’e-Facturation […] est passible d’une amende administrative forfaitaire fixée en fonction de sa catégorie fiscale.',
    ecart:
      'Ces trois montants sont l’amende des infractions à l’e-Facturation — doublée en cas de récidive sous deux ans. L’infraction ordinaire à la facturation se paie en pourcentage des droits (art. 20.01.56.18), pas au forfait.',
  },
};

/**
 * Une référence, telle qu'elle est écrite dans `regles.data.js` ou
 * `aide.data.js` : `{ texte, article, page, conforme, citation, ecart }`.
 *
 * Renvoie `null` sans `source` : un composant qui appelle ce helper n'a alors
 * rien à afficher, et une règle interne au système reste une règle interne.
 *
 * `url` désigne le document ; `urlAncre` ouvre sa page `page + decalagePage`,
 * celle où le lecteur trouve l'article cité.
 */
export const referenceLegale = (source) => {
  if (!source || !source.texte || !source.article) return null;
  const texte = TEXTES_FISCAUX[source.texte];
  if (!texte) return null;

  const libelleCourt = `${texte.sigle} art. ${source.article}`;
  const libelle = source.page ? `${libelleCourt} — p. ${source.page}` : libelleCourt;

  // Le lien doit arriver sur l'article, pas sur la couverture : le folio imprimé
  // est décalé dans le fichier par les pages de titre non numérotées
  // (`decalagePage`). Une référence qui couvre deux feuillets — « 24 et 36 » —
  // s'ouvre sur le premier, celui où commence l'article cité.
  const [premierFeuillet] = String(source.page ?? '').match(/\d+/) ?? [];
  const urlAncre = premierFeuillet
    ? `${texte.url}#page=${Number(premierFeuillet) + (texte.decalagePage ?? 0)}`
    : texte.url;

  return {
    url: texte.url,
    urlAncre,
    libelle,
    libelleCourt,
    sigle: texte.sigle,
    article: source.article,
    page: source.page ?? null,
    document: texte.titre,
    editeur: texte.editeur,
    conforme: source.conforme !== 'partiel' && source.conforme !== false,
    citation: source.citation ?? '',
    ecart: source.ecart ?? '',
    titre: `${texte.titre} — ${texte.editeur}. Ouvrir le PDF officiel${
      source.citation ? ` (« ${source.citation} »)` : ''
    }`,
  };
};

/** Liste plate des trois documents, pour le pied de page « d'où viennent ces repères ». */
export const TEXTES_CITES = Object.values(TEXTES_FISCAUX).map((texte) => ({
  sigle: texte.sigle,
  titre: texte.titre,
  editeur: texte.editeur,
  url: texte.url,
  observation: texte.observation ?? '',
}));
