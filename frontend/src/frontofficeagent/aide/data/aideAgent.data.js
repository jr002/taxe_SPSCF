/**
 * Registre d'aide du front-office agent.
 *
 * Comme côté portail contribuable, une seule source : chaque terme expliqué au
 * survol (`AideTerme`) et chaque section de la modale « Aide à la lecture »
 * (`AideLectureModal`) lisent ce fichier. Le ton diffère volontairement de
 * `accountcontribuable/data` : ici le lecteur est un agent qui instruit le
 * dossier, pas le contribuable — on explique ce que l'écran calcule et d'où il
 * le tire, sans « vous ».
 *
 * Les définitions reprennent le code qui applique la valeur, pas un texte
 * réglementaire général :
 *  - seuils de catégorie : `contribuables/utils/classificationCgi.utils.js` ;
 *  - formule de TVA théorique : `collecte/components/TheoreticalForm.jsx` ;
 *  - chaîne de relances 8 / 8 / 5 jours francs et demande d'éclaircissements :
 *    `relance/utils/relance.utils.js` ;
 *  - « montant dû estimé » : `somme des montants nets, défaut théorique − payée`
 *    calculé dans `ContribuableDetail.jsx`.
 *
 * Quand un article de loi est cité, il est relu dans l'édition consolidée 2025 du
 * texte officiel (voir `@/data/textesFiscaux.data`), et le lien ouvrant le PDF est
 * posé par le composant `RefLegal` sur les écrans, pas dans ce registre de mots.
 */

/** Terme court → explication posée au survol. Une à deux phrases, jamais plus. */
export const TERMES = {
  nif: {
    terme: 'NIF',
    sens:
      'Numéro d’Identification Fiscale : la clé du dossier. Toutes les pages du produit retrouvent le même contribuable par ce numéro.',
  },
  nif_tiers: {
    terme: 'NIF du tiers',
    sens:
      'Le NIF de l’organisme qui a fourni l’information (banque, fournisseur, administration). Il permet de rattacher le recoupement à un autre dossier du registre.',
  },
  centre_gestionnaire: {
    terme: 'Centre gestionnaire',
    sens:
      'Le service qui instruit le dossier et est seul habilité à le modifier. Un chef de centre ou un agent de centre ne voit que les dossiers du sien.',
  },
  categorie: {
    terme: 'Catégorie',
    sens:
      'Déduite du dernier chiffre d’affaires déclaré : grand (≥ 400 M Ar), moyen (100 à 400 M Ar), petit (< 100 M Ar). Elle commande la fiche d’obligations affichée dans l’onglet « Nature d’impôt ».',
  },
  nature_impot: {
    terme: 'Nature d’impôt',
    sens:
      'IS — Impôt Synthétique, ou IR — Impôt sur le revenu. C’est le régime porté au dossier ; la catégorie peut en révéler un autre, l’onglet « Nature d’impôt » signale alors la contradiction.',
  },
  ca: {
    terme: "Chiffre d’affaires",
    sens:
      'Total des recettes déclaré pour l’année. C’est lui qui détermine la catégorie du contribuable et sert de base aux comparaisons de la confrontation.',
  },
  tva_collectee: {
    terme: 'TVA collectée',
    sens:
      'TVA facturée par le contribuable à ses clients pendant la période. C’est ce qu’il a reçu pour le compte du fisc.',
  },
  tva_deductible: {
    terme: 'TVA déductible',
    sens:
      'TVA payée par le contribuable à ses fournisseurs. Elle vient en réduction de la TVA collectée.',
  },
  tva_payee: {
    terme: 'TVA payée',
    sens:
      'Le montant réellement versé, tel qu’enregistré dans la déclaration. La colonne « TVA payée cumulée » additionne ces montants sur toutes les années du dossier.',
  },
  derniere_annee: {
    terme: 'Dernière année',
    sens:
      'L’exercice de la déclaration la plus récente enregistrée. Ce n’est pas forcément l’année en cours : un dossier sans déclaration récente n’est pas forcément en faute, c’est souvent une saisie en attente.',
  },
  annees_suivies: {
    terme: 'Années suivies',
    sens:
      'Le nombre d’exercices pour lesquels une déclaration est enregistrée dans le dossier. Un chiffre faible avec une activité ancienne signalé par les tiers est un point à vérifier en confrontation.',
  },
  tva_theorique: {
    terme: 'TVA théorique',
    sens:
      'La TVA que la déclaration aurait dû produire d’après la règle d’assiette (CA × 5 % en IS ; en IR, max(320 000 + CA × 20 % ; bénéfice × 20 %)). C’est la référence de l’écart, pas une imposition prononcée.',
  },
  ecart: {
    terme: 'Écart',
    sens:
      'Différence entre ce qui était attendu et ce qui a été payé ou recoupé. Un écart signale une divergence à expliquer ; il ne devient une somme à payer qu’après notification définitive.',
  },
  statut_declaration: {
    terme: 'Statut de la déclaration',
    sens:
      'État d’avancement de la ligne : conforme, alerte ou critique selon l’écart enregistré, non conforme en anomalie ; « notification primitive » puis « définitive » quand la procédure contradictoire est engagée.',
  },
  notification_primitive: {
    terme: 'Notification primitive',
    sens:
      'Premier acte du redressement proposé : elle énonce le manquement et ouvre un délai de réponse (30 jours, prorogeable sur demande). Le contribuable peut encore faire bouger le montant.',
  },
  notification_definitive: {
    terme: 'Notification définitive',
    sens:
      'Acte qui arrête la somme à payer, après que le contribuable a pu répondre. L’amende de 40 % du principal et les pénalités deviennent alors exigibles.',
  },
  recoupement: {
    terme: 'Recoupement',
    sens:
      'Information obtenue légalement auprès d’un tiers (banque, fournisseur, administration…) et enregistrée dans le dossier pour être comparée aux déclarations.',
  },
  cadence_recoupement: {
    terme: 'Fréquence des recoupements',
    sens:
      'Deux cadences. En TVA, le recoupement des annexes récapitulatives clients et fournisseurs (déposées sur NIFONLINE) suit l’échéance mensuelle : douze fois par an. En IR et en IS, le recoupement du chiffre d’affaires, du bénéfice et de la somme recoupée (ventes, achats, débours, importations et douanes) se fait une fois par an, au dépôt de la déclaration annuelle et des états financiers.',
  },
  droit_communication: {
    terme: 'Droit de communication',
    sens:
      'Demande adressée à un tiers pour obtenir des documents ou des informations. Son statut dit où en est la réponse du tiers, pas l’état de l’imposition. Un seul droit par contribuable et par année civile.',
  },
  statut_droit: {
    terme: 'Statut du droit',
    sens:
      'Déroulé de la réponse du tiers : demande émise, réponse reçue, réponse partielle, relance émise faute de réponse, ou sans suite après épuisement des relances.',
  },
  rapprochement: {
    terme: 'Rapprochement',
    sens:
      'Comparaison automatique ligne à ligne entre un montant déclaré et un montant recoupé, avec un écart chiffré et un statut.',
  },
  tolerance: {
    terme: 'Tolérance',
    sens:
      'Écart admis par la règle de rapprochement : les deux montants ne coïncident pas au centime, mais la différence reste acceptable — la ligne ne demande pas d’explication.',
  },
  statut_rapprochement: {
    terme: 'Statut du rapprochement',
    sens:
      'Concordant : les montants collent. Tolérance : l’écart reste admis. À vérifier : hors tolérance sans être retenu comme écart. Écart : divergence retenue, à expliquer avant tout redressement.',
  },
  confrontation: {
    terme: 'Confrontation',
    sens:
      'Le module qui compare les chiffres déclarés et les chiffres recoupés et produit les lignes de rapprochement. La TVA y est affichée à titre informatif : la confrontation raisonne en chiffre d’affaires.',
  },
  relance: {
    terme: 'Relance',
    sens:
      'Acte de recouvrement amiable émis depuis l’onglet du même nom, dans l’ordre : premier rappel, deuxième rappel, mise en demeure. Chaque acte porte le montant dû estimé et un délai de régularisation.',
  },
  rappel: {
    terme: 'Rappel à l’ordre',
    sens:
      'Premier et deuxième acte de la chaîne de recouvrement, chacun sur un délai de 8 jours francs. Deux rappels infructueux ouvrent la mise en demeure.',
  },
  mise_en_demeure: {
    terme: 'Mise en demeure',
    sens:
      'Dernier acte avant poursuite : 5 jours francs pour régulariser. Son échéance dépassée, le dossier peut être transmis pour mise en recouvrement.',
  },
  demande_eclaircissement: {
    terme: "Demande d’éclaircissements",
    sens:
      'Acte d’instruction (code des procédures fiscales, art. V-02) qui ouvre 30 jours pour obtenir les justificatifs d’une ligne — l’article, lui, fixe un délai franc de 15 jours. Elle précède la notification primitive et se pilote depuis l’écran de suivi fiscal.',
  },
  jours_francs: {
    terme: 'Jours francs',
    sens:
      'Un jour franc est une journée entière qui ne commence qu’après la notification de l’acte : le jour d’envoi n’est pas décompté.',
  },
  montant_du: {
    terme: 'Montant dû estimé',
    sens:
      'Somme des nets à payer de chaque année ; à défaut de net enregistré, l’écart théorique − payée, ramenée à zéro si négative. C’est une base de travail pour la relance, pas un titre exécutoire.',
  },
  statut_relance: {
    terme: 'Statut de la relance',
    sens:
      'Émise : l’acte est sorti, le court son délai. Régularisée : le contribuable a payé ou l’erreur est réparée — à marquer dans le produit pour arrêter la chaîne.',
  },
  penalite_retard: {
    terme: 'Pénalité de retard',
    sens:
      'Majoration attachée au paiement tardif, détaillée par catégorie dans l’onglet « Nature d’impôt ». Elle ne se déclenche pas depuis cet écran.',
  },
  amende_administrative: {
    terme: 'Amende administrative',
    sens:
      'Sanction fixée par la loi de finances pour un manquement donné (défaut de déclaration, infraction de facturation…), indépendante de la somme due en principal.',
  },
  lien_contribuable: {
    terme: 'Lien contribuable',
    sens:
      'URL de consultation en lecture seule émise pour ce dossier : le contribuable y retrouve ses chiffres et l’aide à la lecture, sans accès au back-office. Une nouvelle émission révoque les liens précédents.',
  },
};

/** Accès sûr : une id inconnue rend `null`, le composant retombe alors sur son texte nu. */
export function terme(id) {
  return TERMES[id] || null;
}

/**
 * Aide propre à chaque écran : introduction, ce que l'écran montre, comment le
 * lire. Les `termes` listent les ids du registre que la modale reprend en
 * glossaire — jamais de redéfinition ici.
 */
export const AIDES = {
  registre: {
    titre: 'Lire le registre des contribuables',
    intro:
      'Le registre liste les dossiers fiscaux visibles depuis votre périmètre : centre pour un agent ou un chef de centre, tout le territoire pour un inspecteur ou un administrateur.',
    rubriques: [
      {
        titre: 'Ce que montre chaque ligne',
        texte:
          'Raison sociale et NIF, dernière année déclarée, nombre d’années suivies, et la TVA réellement payée sur toutes ces années. La ligne s’ouvre sur la fiche du contribuable, au clavier comme à la souris.',
        termes: ['nif', 'tva_payee', 'derniere_annee', 'annees_suivies', 'categorie'],
      },
      {
        titre: 'Filtrer et retrouver',
        texte:
          'La recherche matche le NIF ou la raison sociale ; les filtres par catégorie et les compteurs affichés tiennent sur l’ensemble du registre, pas seulement sur la page courante. Import et export Excel travaillent sur la sélection filtrée.',
        termes: ['categorie'],
      },
      {
        titre: 'Vue Statistique',
        texte:
          'Le second onglet agrège le registre en partitions VSP / CSP et par nature d’impôt. Les camemberts portent des tableaux alternatifs : les chiffres sont lisibles sans le graphique.',
      },
    ],
  },
  overview: {
    titre: 'Lire la synthèse du dossier',
    intro:
      'La synthèse répond en trois secondes : combien ce contribuable a payé, sur quelles années, et si ses paiements suivent la TVA attendue.',
    rubriques: [
      {
        titre: 'Les deux chiffres',
        texte:
          'La TVA payée cumulée additionne les montants réellement versés de toutes les déclarations enregistrées. La dernière déclaration est l’année de la plus récente d’entre elles — pas forcément l’année en cours.',
        termes: ['tva_payee', 'tva_theorique', 'lien_contribuable'],
      },
      {
        titre: 'Les deux graphiques',
        texte:
          'À gauche, le nombre de déclarations par année et, parmi elles, celles du régime déclaré. À droite, la TVA payée contre la TVA théorique sur les deux derniers exercices : deux barres qui s’écartent signalent un dossier à confronter.',
        termes: ['tva_theorique', 'ecart', 'nature_impot'],
      },
      {
        titre: 'Ouvrir la confrontation',
        texte:
          'Le bouton bleu lance la comparaison des déclarés et des recoupés du dossier. C’est l’écran où l’instruction d’un écart se mène ; la synthèse, elle, ne montre que ce qui est enregistré.',
        termes: ['confrontation', 'recoupement'],
      },
    ],
  },
  classification: {
    titre: 'Lire l’onglet « Nature d’impôt »',
    intro:
      'Cet onglet affiche la fiche d’obligations que la loi de finances attache à la catégorie du dossier, calculée sur le dernier chiffre d’affaires déclaré.',
    rubriques: [
      {
        titre: 'Catégorie et seuils',
        texte:
          'Grand (CA ≥ 400 M Ar), moyen (100 à 400 M Ar, avec une bande de transition à 200 M Ar), petit (< 100 M Ar). Sans déclaration enregistrée, la fiche « petit contribuable » s’affiche par défaut, et l’onglet le dit.',
        termes: ['categorie', 'ca'],
      },
      {
        titre: 'Ce que paie le contribuable',
        texte:
          'Les cartes listent ce que la catégorie impose : nature d’impôt, régime, TVA, tenue de comptabilité, durée de conservation des pièces. Si le dossier porte une autre nature que celle de la catégorie, un avertissement le signale : c’est un point à trancher au contrôle.',
        termes: ['nature_impot'],
      },
      {
        titre: 'Pénalités et amendes',
        texte:
          'La liste des pénalités de retard et la grille des amendes administratives viennent du code des impôts (édition consolidée 2025), art. 20.01.53 et 20.01.56 ; la fiche de catégorie les reprend. Elles sont rappelées ici pour la lecture du dossier ; leur application relève des actes d’instruction, pas de cet écran.',
        termes: ['penalite_retard', 'amende_administrative'],
      },
    ],
  },
  declarations: {
    titre: 'Lire l’onglet « Déclarations »',
    intro:
      'Une ligne par déclaration enregistrée, la plus récente en tête. Un clic ouvre le suivi fiscal de la ligne, où se mènent notification et imputation.',
    rubriques: [
      {
        titre: 'Les colonnes TVA',
        texte:
          'Collectée (reçue des clients), déductible (payée aux fournisseurs), payée (le montant réellement versé), théorique (ce que la règle d’assiette attendait). Le contrôle se lit dans l’écart entre les deux dernières.',
        termes: [
          'tva_collectee',
          'tva_deductible',
          'tva_payee',
          'tva_theorique',
          'ecart',
        ],
      },
      {
        titre: 'Catégorie par ligne',
        texte:
          'Le badge qualifie chaque année d’après son propre chiffre d’affaires : il peut différer de la catégorie du dossier, qui se lit sur le dernier exercice connu.',
        termes: ['categorie', 'ca'],
      },
      {
        titre: 'Statuts',
        texte:
          'Conforme / alerte / critique côté contrôle, puis les étapes de la procédure contradictoire quand elle est engagée : notification primitive, puis définitive. Une primitive laisse le délai de réponse ouvert ; seule la définitive rend une somme exigible.',
        termes: [
          'statut_declaration',
          'notification_primitive',
          'notification_definitive',
        ],
      },
    ],
  },
  recoupements: {
    titre: 'Lire l’onglet « Recoupements »',
    intro:
      'Les informations obtenues auprès de tiers et enregistrées dans ce dossier. Elles n’ont de valeur que comparées aux déclarations : c’est la confrontation qui le fait.',
    rubriques: [
      {
        titre: 'D’où vient la ligne',
        texte:
          'La source (banque, fournisseur, client, administration…) et le type d’opération (vente, achat, service) situent l’information ; le NIF du tiers permet de la rattacher à un autre dossier.',
        termes: ['recoupement', 'nif_tiers', 'droit_communication'],
      },
      {
        titre: 'Les montants',
        texte:
          'Le montant déclaré par le tiers, la TVA qu’il porte et la somme recoupée au total. Le rapprochement automatique les compare aux déclarations ; ce tableau, lui, montre la matière brute.',
        termes: ['rapprochement', 'tolerance'],
      },
      {
        titre: 'Deux cadences',
        texte:
          'La période de la ligne dit de quelle cadence elle relève. En TVA, les annexes récapitulatives clients et fournisseurs déposées sur NIFONLINE arrivent à chaque échéance mensuelle : douze recoupements par an. En IR et en IS, le chiffre d’affaires, le bénéfice et la somme recoupée (ventes, achats, débours, importations et douanes) ne sont recoupés qu’une fois par an, au dépôt de la déclaration annuelle et des états financiers. Une année sans ligne annuelle n’est donc pas une anomalie.',
        termes: ['cadence_recoupement', 'recoupement'],
      },
      {
        titre: 'Ajouter une ligne',
        texte:
          'Le bouton d’enregistrement ouvre le formulaire dédié ; la ligne rejoint aussitôt les comparaisons de la confrontation. Export et lien contribuable sont suspendus ici parce que la donnée est en cours d’instruction.',
        termes: ['lien_contribuable'],
      },
    ],
  },
  droits: {
    titre: 'Lire l’onglet « Droits de communication »',
    intro:
      'Le suivi des demandes adressées aux tiers : qui a été interrogé, pour quoi, et où en est la réponse. C’est la traçabilité des recoupements, pas une procédure contre le contribuable.',
    rubriques: [
      {
        titre: 'Tiers et objet',
        texte:
          'Chaque ligne nomme le tiers interrogé, son type et l’objet de la demande. Une demande sans réponse enregistrée explique un recoupement absent, pas une fraude.',
        termes: ['droit_communication', 'recoupement'],
      },
      {
        titre: 'Statuts',
        texte:
          'Demande (émise, sans réponse), réponse reçue, réponse partielle (incomplète), relance émise (une seconde demande a suivi), sans suite (clôturée sans exploiter). Le statut qualifie la réponse du tiers — jamais la situation fiscale du contribuable.',
        termes: ['statut_droit'],
      },
      {
        titre: 'Un droit par année civile',
        texte:
          'Le système n’admet qu’une demande par contribuable et par année, l’année étant celle de la date de la demande. Une seconde demande la même année est refusée à l’enregistrement, et le serait aussi si une modification venait replacer la date dans une année déjà couverte : il faut datrer d’une année encore libre.',
        termes: ['droit_communication'],
      },
    ],
  },
  relances: {
    titre: 'Lire l’onglet « Relances »',
    intro:
      'La chaîne de recouvrement amiable du dossier. Chaque acte émis depuis cet écran est enregistré, daté, et produit sa lettre imprimable.',
    rubriques: [
      {
        titre: 'L’ordre des actes',
        texte:
          'Premier rappel (8 jours francs), deuxième rappel (8 jours francs), puis mise en demeure (5 jours francs). La demande d’éclaircissements, elle, est un acte d’instruction qui se mène depuis le suivi fiscal, avant toute notification.',
        termes: ['relance', 'rappel', 'mise_en_demeure', 'demande_eclaircissement', 'jours_francs'],
      },
      {
        titre: 'Le montant dû estimé',
        texte:
          'Somme des nets à payer des années du dossier, l’écart théorique − payée servant de défaut. Le rappel porte ce montant : vérifiez-le sur le suivi avant d’émettre, l’acte enregistré ne se modifie pas rétroactivement.',
        termes: ['montant_du', 'tva_theorique', 'ecart'],
      },
      {
        titre: 'Régulariser',
        texte:
          '« Marquer comme régularisé » clôture la relance en cours dès lors que le contribuable a payé ou que l’erreur est réparée. Tant qu’une relance reste « émise », l’historique laisse supposer que le délai court.',
        termes: ['statut_relance'],
      },
    ],
  },
  confrontation: {
    titre: 'Lire la confrontation fiscale',
    intro:
      'La confrontation compare deux familles de chiffres : ce que le contribuable a déclaré, et ce qui a été recoupé légalement auprès de tiers. Elle produit des lignes de rapprochement — jamais une imposition.',
    rubriques: [
      {
        titre: 'Lancer et relancer',
        texte:
          'Le calcul est rejouable : il rapproche les derniers déclarés et recoupés enregistrés, sur la période choisie. Relancer après avoir ajouté un recoupement est normal, ça ne modifie rien au dossier du contribuable.',
        termes: ['rapprochement', 'recoupement'],
      },
      {
        titre: 'Lire une ligne',
        texte:
          'Chaque ligne porte le montant déclaré, le montant recoupé, leur écart (déclaré − recoupé : positif = déclaré plus que recoupé) et un statut. L’écart négatif vient en déduction dans les totaux.',
        termes: ['ecart', 'statut_rapprochement', 'tolerance'],
      },
      {
        titre: 'Les statuts',
        texte:
          'Concordant et tolérance ne demandent rien. « À vérifier » attend une explication, pas un paiement. « Écart » est la divergence retenue : c’est le point de départ d’une demande d’éclaircissements, puis de la procédure contradictoire.',
        termes: ['statut_rapprochement', 'demande_eclaircissement', 'notification_primitive'],
      },
      {
        titre: 'La TVA, à titre informatif',
        texte:
          'La confrontation raisonne en chiffres d’affaires. Les montants TVA affichés aident à situer la ligne ; ils ne sont pas la base du rapprochement.',
        termes: ['tva_theorique'],
      },
    ],
  },
};

/** Accès sûr pour la modale : un écran inconnu rend `null`, la modale ne s'ouvre pas. */
export function aideEcran(ecran) {
  return AIDES[ecran] || null;
}
