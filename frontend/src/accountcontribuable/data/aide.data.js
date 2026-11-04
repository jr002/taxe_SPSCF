/**
 * Repères légaux et clés de lecture affichés par la page d'aide du portail
 * contribuable.
 *
 * Rien ici n'est une interprétation libre du droit, et surtout : **cet énoncé ne
 * cite plus un article lui-même**. Chaque rubrique porte une `regleId` qui
 * rattache la ligne au registre [`regles.data.js`](regles.data.js) ; c'est ce
 * registre qui détient la référence vérifiée (`source`) et c'est lui que
 * `AideContribuable` rend sous forme de lien. Une référence écrite à deux
 * endroits finit par diverger — c'est exactement ce qui s'était produit avec
 * « CPF art. V-17 » et « CPF art. V-19 et suivants », cités ici et là sans rapport
 * avec les articles réellement appliqués (V-02 pour les éclaircissements, V-04
 * pour la primitive, V-07 pour la définitive).
 *
 * Les valeurs correspondent à celles appliquées par l'application, à savoir :
 *
 * - notification primitive, délai de réponse de 30 jours :
 *   `backend/src/models/declaration.model.js` (`emettreNotificationPrimitive`) ;
 * - imputation du crédit d'impôt seulement après la notification définitive :
 *   `backend/src/models/declaration.model.js` (`emettreNotificationDefinitive`)
 *   et les documents générés par `components/common/NotificationModal.jsx` ;
 * - premier acte contradictoire et son délai de 30 jours :
 *   `components/common/DemandeEclaircissementModal.jsx`,
 *   `frontofficeagent/relance/utils/relance.utils.js` ;
 * - délais des relances (8, 8 et 5 jours francs) :
 *   `frontofficeagent/relance/utils/relance.utils.js` ;
 * - pénalité de retard de 10 % portée au rappel :
 *   `frontofficeagent/relance/components/RappelOrdreModal.jsx` ;
 * - amende de 40 % du principal, seuil d'écart à 50 %, TVA théorique et
 *   pénalités mensuelles par catégorie :
 *   `frontofficeagent/collecte/components/TheoreticalForm.jsx` ;
 * - seuils de catégorie, régimes, durées de conservation et amendes :
 *   `frontofficeagent/contribuables/utils/classificationCgi.utils.js`.
 *
 * Le 1er novembre 2026, chaque valeur a été confrontée aux PDF officiels de la DGI
 * et du Ministère des Finances (code des impôts et code des procédures fiscales,
 * éditions consolidées 2025 ; loi de finances n° 2025-021 pour 2026) — voir
 * [`../../data/textesFiscaux.data.js`](../../data/textesFiscaux.data.js). Ce qui
 * n'est pas dans un texte est dit comme règle du système, sans lien.
 */
import { REFERENCES } from '@/data/textesFiscaux.data';

/**
 * Sommaire de l'aide : l'ordre suit le trajet d'une lecture, de la page elle-même
 * jusqu'au droit applicable. Les `id` servent de cibles aux liens « comprendre »
 * placés dans le dossier, section par section.
 */
export const SECTIONS_AIDE = [
  { id: 'lire', titre: 'Comment lire cette page' },
  { id: 'montants', titre: 'Les montants et l’écart' },
  { id: 'confrontation', titre: 'Recoupements et confrontation' },
  { id: 'procedure', titre: 'La procédure contradictoire' },
  { id: 'delais', titre: 'Délais, relances et pénalités' },
  { id: 'categories', titre: 'Catégories et obligations' },
  { id: 'statuts', titre: 'Glossaire des statuts' },
  { id: 'securite', titre: 'Sécurité de votre lien' },
  { id: 'questions', titre: 'Questions fréquentes' },
];

/** Comment lire l'écran, dans l'ordre où les panneaux se présentent. */
export const LECTURE_DU_DOSSIER = [
  {
    titre: "L'en-tête du dossier",
    texte:
      "Raison sociale, NIF, centre gestionnaire et conformité enregistrée. Le centre gestionnaire est le service qui instruit votre dossier : c'est lui qu'il faut contacter pour toute question. Quand la mention « Aucun statut enregistré » apparaît, c'est qu'aucun statut n'a été saisi par l'administration : cela ne vaut ni conformité accordée, ni contrôle achevé.",
  },
  {
    titre: 'Le tableau de bord des taxes',
    texte:
      'Cumuls de TVA payée, de TVA théorique attendue et écart constaté, puis comparaison exercice par exercice. Un écart cumulé est une somme de différences théoriques, pas un avis à payer.',
  },
  {
    titre: 'Pénalités, échéances et conseils',
    texte:
      'Une liste de points d’attention calculés sur vos données, puis la table de vos notifications avec la date limite de réponse, et le détail replié des relances.',
  },
  {
    titre: 'Vos déclarations TVA',
    texte:
      'Une ligne par déclaration enregistrée : TVA collectée, déductible, payée, théorique, écart et situation.',
  },
  {
    titre: 'Droits de communication, recoupements et confrontation',
    texte:
      'Les documents demandés à des tiers, les montants venus de l’extérieur, puis la comparaison entre ce que vous avez déclaré et ce qui a été recoupé.',
  },
];

/**
 * Les montants, dans les mots du contribuable, avec la formule réellement appliquée.
 *
 * Une ligne peut porter `regleId` : le renvoi vers le registre
 * ([`regles.data.js`](regles.data.js)) dont la forme courte s'affiche au survol et
 * à la touche Tabulation, la forme longue restant dans le texte de la rubrique.
 */
export const MONTANTS_EXPLIQUES = [
  {
    terme: 'TVA collectée',
    definition: 'La taxe que vous avez facturée à vos clients.',
  },
  {
    terme: 'TVA déductible',
    definition: 'La taxe que vous avez payée à vos fournisseurs et que vous pouvez imputer.',
  },
  {
    terme: 'TVA payée',
    definition: 'Le montant effectivement versé au trésor pour la période.',
  },
  {
    terme: 'TVA théorique',
    regleId: 'tva_theorique',
    definition:
      'Le montant attendu d’après la base déclarée : chiffre d’affaires × 5 % pour un redevable de l’impôt synthétique, max(320 000 Ar + 20 % du chiffre d’affaires ; 20 % du bénéfice) pour un redevable de l’IR au réel.',
  },
  {
    terme: 'Écart',
    regleId: 'ecart',
    definition:
      'TVA théorique moins TVA payée, lorsque le résultat est positif. Un écart nul signifie que vos paiements couvrent la TVA attendue ; un écart positif demande une explication, pas un paiement immédiat.',
  },
];

/**
 * Les quatre actes de la procédure, dans l'ordre légal d'instruction.
 *
 * `regleId` désigne l'entrée du registre qui porte la référence vérifiée ; la
 * puce de renvoi au texte officiel est construite à partir d'elle, pas d'un
 * `ref` recopié ici. `aussiId` ajoute une seconde puce quand un autre article
 * éclaire la même étape.
 */
export const PROCEDURE_ETAPES = [
  {
    numero: 1,
    titre: "Demande d'éclaircissements et de justifications",
    regleId: 'delai_eclaircissements',
    delai: '30 jours pour répondre',
    texte:
      'Premier acte contradictoire, parfois facultatif : la DGI vous demande d’expliquer une différence et de produire les pièces justificatives. Elle ne réclame aucun paiement à ce stade.',
  },
  {
    numero: 2,
    titre: 'Notification primitive (proposition de rectification)',
    regleId: 'delai_primitive',
    aussiId: 'prorogation',
    delai: '30 jours pour répondre',
    texte:
      'La DGI vous propose un montant de rectification. Ce n’est qu’une proposition : la date limite de réponse figure sur votre dossier, section « Vos notifications ». Vos observations et vos pièces peuvent encore faire baisser, voire disparaître, le montant proposé. Un délai supplémentaire se demande à titre gracieux et n’est jamais automatique.',
  },
  {
    numero: 3,
    titre: 'Notification définitive (décision)',
    regleId: 'notification_definitive',
    delai: 'montant devenu exigible',
    texte:
      'La procédure contradictoire est close et la dette est liquidée. Le détail annoncé est le principal redressé, l’amende fiscale de 40 % de ce principal, les pénalités et majorations de retard, puis le net à payer après imputation éventuelle d’un crédit d’impôt. Les amendes et pénalités ne sont pas calculées par ce site : le document imprimé porte la mention « Non liquidé au dossier » tant que rien n’est enregistré.',
  },
  {
    numero: 4,
    titre: "Imputation du crédit d'impôt",
    regleId: 'imputation',
    delai: 'après la notification définitive',
    texte:
      "Un crédit d'impôt antérieur s'impute sur la dette née de la notification définitive. Il ne peut pas être imputé sur une simple proposition : l'instruction n'autorise l'imputation qu'une fois le statut définitif atteint.",
  },
];

/** Les relances de recouvrement et leurs délais, dans l'ordre de la chaîne. */
export const RELANCES = [
  {
    titre: 'Premier rappel à l’ordre',
    regleId: 'penalite_rappel',
    delaiId: 'jours_francs',
    delai: '8 jours francs',
    texte: 'Invitation à régulariser le paiement, avec la pénalité de retard portée au rappel.',
  },
  {
    titre: 'Deuxième rappel à l’ordre',
    regleId: 'relance_delais',
    delaiId: 'jours_francs',
    delai: '8 jours francs',
    texte: 'Même injonction, un cran plus ferme, si le premier rappel est resté sans effet.',
  },
  {
    titre: 'Mise en demeure de payer',
    regleId: 'relance_delais',
    delaiId: 'jours_francs',
    delai: '5 jours francs',
    texte: 'Acte formel de recouvrement qui ouvre la voie des poursuites.',
  },
];

/**
 * Ce que la page d'aide doit dire des délais de relance : ils ne sont écrits dans
 * aucun article. Ils viennent du module de relances de l'application
 * (`frontofficeagent/relance/utils/relance.utils.js`), et l'afficher comme
 * « délai légal » serait une invention.
 */
export const NOTE_DELAIS_RELANCE =
  'Les trois délais ci-dessus — deux rappels à 8 jours francs puis mise en demeure à 5 jours francs — ' +
  'sont ceux appliqués par le service des relances de ce système. Aucun article du code des procédures ' +
  'fiscales ne les fixe : ce sont des règles d’instruction, pas des délais légaux, et ils ne sont donc ' +
  'accompagnés d’aucun lien vers un texte.';

/** Ce qui est dû, ce qui ne l'est pas encore. */
export const PENALITES = [
  {
    situation: "Écart entre la TVA théorique et la TVA payée",
    regleId: 'ecart',
    regle:
      'Tant que la notification primitive n’est pas close, l’écart reste une proposition : aucune amende n’est exigible.',
  },
  {
    situation: 'Écart retenu pour un redressement',
    regleId: 'seuil_redressement',
    regle:
      'La collecte retient un redressement quand la différence dépasse 50 % de la TVA attendue ; en dessous, la ligne reste à expliquer.',
  },
  {
    situation: 'Amende fiscale',
    regleId: 'amende',
    regle:
      '40 % du principal redressé, exigible seulement après la notification définitive.',
  },
  {
    situation: 'Pénalité de retard portée à un rappel',
    regleId: 'penalite_rappel',
    regle: '10 % du principal, ajoutée au montant rappelé.',
  },
  {
    situation: 'Pénalités de retard mensuelles',
    regleId: 'penalite_mensuelle',
    regle:
      'Petit contribuable : 1 % par mois. Moyen contribuable : 2 % le premier mois puis 1 % par mois. Grand contribuable : 3 % le premier mois puis 1 % par mois.',
  },
  {
    situation: 'Infraction au système d’e-Facturation',
    regleId: 'infraction_facturation',
    regle:
      'Amende forfaitaire : 20 000 000 Ar (grand), 10 000 000 Ar (moyen), 1 000 000 Ar (petit contribuable). Elle n’est pas calculée par ce site.',
  },
];

/** Seuils et obligations du code des impôts que l'application utilise pour classer un dossier.
 *
 * Chaque ligne qui énonce une obligation de texte porte ses `sources` : des
 * entrées du registre vérifié, jamais un article recopié ici. Une ligne sans
 * source pour une colonne est une précision du système — le centre tranche, le
 * tableau ne l'affirme pas au nom de la loi.
 */
export const CATEGORIES = [
  {
    label: 'Grand contribuable',
    seuil: 'chiffre d’affaires ≥ 400 000 000 Ar',
    impots: 'Impôt sur le revenu (IR) au taux de 20 %, régime du réel obligatoire, TVA obligatoire',
    comptabilite: 'Comptabilité d’exercice complète (PCG 2005), pièces conservées 10 ans',
    sources: {
      seuil: REFERENCES.seuil_categorie,
      impots: REFERENCES.ir_taux,
      comptabilite: REFERENCES.conservation_pieces,
    },
  },
  {
    label: 'Moyen contribuable',
    seuil: '100 000 000 Ar ≤ chiffre d’affaires < 400 000 000 Ar',
    impots:
      'Impôt synthétique (IS) par défaut entre 200 et 400 millions, IS à 5 % et comptabilité allégée (système minimal de trésorerie) en dessous de 200 millions ; option possible pour l’IR et le réel sur états certifiés',
    comptabilite: 'Le régime suit la bande de chiffre d’affaires déclarée',
    sources: {
      seuil: REFERENCES.seuil_categorie,
      impots: REFERENCES.impot_synthetique,
    },
  },
  {
    label: 'Petit contribuable',
    seuil: 'chiffre d’affaires < 100 000 000 Ar',
    impots:
      'Impôt synthétique (IS) à 5 % — 3 % pour les nouveaux adhérents d’un CGA et les immatriculations en ligne — libératoire de l’IR et de la TVA',
    comptabilite: 'Journal de recettes et de dépenses, pièces conservées 3 ans',
    sources: {
      seuil: REFERENCES.seuil_categorie,
      impots: [REFERENCES.impot_synthetique, REFERENCES.taux_synthese_nouveaux_adherents],
      comptabilite: REFERENCES.conservation_pieces,
    },
  },
];

/**
 * Sécurité du lien d'accès : ce qui est vrai et ce qu'il ne faut jamais faire.
 * Une entrée peut porter `regleId` pour être expliquée au survol.
 */
export const SECURITE_LIEN = [
  {
    regleId: 'expiration_lien',
    texte:
      'Le lien qui ouvre cet espace est nommé, daté et révocable : il n’est valable que jusqu’à la date rappelée en pied de page, et votre centre peut en émettre un nouveau qui annule l’ancien.',
  },
  {
    regleId: 'tentative_lien',
    texte:
      'Une fois le lien ouvert, deux éléments sont demandés : le NIF et l’adresse e-mail enregistrés dans le dossier. Huit tentatives sont admises par lien, puis le lien se bloque temporairement.',
  },
  {
    texte:
      'Cet espace est en lecture seule : aucun montant ne peut y être modifié, aucun paiement ne s’y règle et aucun formulaire de réclamation ne s’y dépose.',
  },
  {
    texte:
      'Ne transmettez ni votre NIF, ni ce lien, ni une pièce justificative à une personne qui vous les réclame par message ou par téléphone : la DGI passe par votre centre gestionnaire.',
  },
  {
    texte:
      'Les notes internes des agents, les scores d’instruction et l’identité de l’agent qui suit le dossier ne sont jamais affichés ici.',
  },
];

/**
 * Questions fréquentes, dans l'ordre des inquiétudes les plus courantes.
 * `regleId` rattache la réponse à une règle du registre : la question propose
 * alors un renvoi vers la rubrique qui la développe.
 */
export const QUESTIONS = [
  {
    question: 'Un écart affiché signifie-t-il que je dois payer tout de suite ?',
    regleId: 'ecart',
    reponse:
      'Non. Un écart est une différence entre la TVA attendue et la TVA payée. Il ne devient une somme à payer qu’après une notification définitive, et l’amende de 40 % ne s’attache qu’à ce stade-là.',
  },
  {
    question: 'Comment contester une notification primitive ?',
    regleId: 'delai_primitive',
    aussiId: 'prorogation',
    reponse:
      'En répondant avant la date limite indiquée dans « Vos notifications » : observations écrites et pièces justificatives remises à votre centre gestionnaire. Un délai supplémentaire peut être demandé, à titre gracieux et avant l’expiration du délai initial ; l’autorité qui statue peut alors accorder quinze jours au plus.',
  },
  {
    question: "Qu'est-ce qu'un rapprochement « à vérifier » ?",
    regleId: 'tolerance',
    reponse:
      'Un montant déclaré qui ne coïncide pas exactement avec un montant recoupé, sans que l’écart soit retenu comme tel. La règle de rapprochement admet une tolérance ; en dehors d’elle, la ligne attend une explication, pas un paiement.',
  },
  {
    question: 'Pourquoi vois-je des montants venant de banques ou de tiers ?',
    regleId: 'recoupement',
    reponse:
      'Ce sont les recoupements et les droits de communication : des informations obtenues légalement auprès de tiers et comparées à votre dossier. La liste des tiers interrogés et l’état de leurs réponses figure sur la page.',
  },
  {
    question: 'Une information de mon dossier est fausse, que faire ?',
    reponse:
      'Contactez votre centre gestionnaire avec le numéro NIF, l’exercice et la période concernés, et apportez la pièce qui prouve le chiffre exact. La correction s’opère dans le dossier professionnel, jamais depuis cet espace.',
  },
  {
    question: 'Puis-je garder une trace de cette consultation ?',
    reponse:
      'Oui : « Imprimer / enregistrer en PDF » produit un document figé à la date de consultation. Les montants qu’il porte sont ceux enregistrés ce jour-là.',
  },
  {
    question: 'Comment savoir si je suis dans mon centre ?',
    reponse:
      'Le centre gestionnaire est indiqué sous votre NIF. C’est le seul service habilité à vous répondre sur le contenu du dossier.',
  },
];

/**
 * Ce qui est vérifié, et ce qui ne l'est pas. Les trois documents cités sont
 * listés à part, avec leur URL, depuis
 * [`../../data/textesFiscaux.data.js`](../../data/textesFiscaux.data.js).
 */
export const SOURCES_AIDE = [
  'Les délais de réponse de la procédure contradictoire sont écrits dans le code des procédures fiscales ; chaque puce d’article ouvre le PDF officiel à l’article cité.',
  'Les taux d’amende et de pénalité de retard sont écrits dans le code des impôts, édition consolidée 2025, telle que modifiée par la loi de finances n° 2025-021 pour 2026.',
  'Une puce marquée en avertissement signale que l’article cité couvre le sujet sans énoncer le chiffre affiché : le montant vient alors du calcul de l’application ou de la saisie de l’agent, et la phrase d’avertissement le dit.',
  'Les règles propres à ce système — écart, tolérance de rapprochement, délais de relance, sécurité du lien — n’ont pas de puce : aucun texte ne les fixe, elles sont énoncées comme règles d’instruction.',
  'Cette page ne remplace pas un avis du centre gestionnaire : en cas de doute sur une ligne, faites-la préciser.',
];
