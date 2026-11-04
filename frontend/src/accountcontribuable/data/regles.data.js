/**
 * Registre des règles énoncées dans le portail contribuable.
 *
 * Chaque règle qui apparaît dans un écran y figure une seule fois, avec :
 *
 * - `regle` : la formulation courte donnée au survol (ou au focus clavier, ou au
 *   tap) — elle dit comment le chiffre est obtenu, pas ce qu'il faut payer ;
 * - `section` : l'ancre de la page d'aide qui développe la règle, cible du renvoi
 *   depuis le dossier (`montants`, `confrontation`, `procedure`, `delais`,
 *   `categories`, `securite`) ;
 * - `aussi` : rubrique secondaire utile depuis la page d'aide elle-même, pour que
 *   deux repères liés renvoient l'un à l'autre plutôt que de se répéter ;
 * - `source` : la référence légale vérifiée, reprise telle quelle de `REFERENCES`
 *   ([`data/textesFiscaux.data.js`](../../data/textesFiscaux.data.js)) — le texte
 *   officiel, l'article, la page imprimée, l'état de conformité, la citation et la
 *   phrase d'écart. Elle est rendue par `RefLegal` sous forme de lien qui ouvre le
 *   PDF de l'éditeur. `conforme: 'partiel'` signale que l'article couvre le sujet
 *   sans énoncer la valeur affichée : le lien est gardé, car c'est en ouvrant
 *   l'article que le lecteur constate l'écart, et `ecart` le dit en une phrase.
 * - `code` : le fichier de l'application qui applique la valeur, quand elle ne vient
 *   pas du texte (ou pas du texte seul).
 *
 * Les références ne sont pas écrites ici : elles vivent dans le registre partagé
 * des trois espaces, parce que les actes imprimables et les écrans d'instruction
 * citent les mêmes articles sans pouvoir importer ce fichier.
 *
 * Le triage a été fait le 1er novembre 2026, article par article, dans les PDF de la
 * Direction Générale des Impôts et du Ministère des Finances. Il en est sorti trois
 * états. Six règles sont conformes : amende de 40 % (20.01.54), pénalités mensuelles
 * (20.01.53), délai de la notification primitive (V-04), notification définitive
 * (V-07), imputation du crédit (01.01.15 et 01.02.06), droit de communication
 * (IV-01). Six sont partielles : la TVA théorique, le seuil de redressement, la
 * pénalité de rappel de 10 %, le délai de la demande d'éclaircissements (V-02 en
 * fixe quinze), les catégories et l'amende d'e-Facturation. Les autres règles —
 * écart, tolérance, rapprochement, recoupement, délais de relance, jour franc,
 * sécurité du lien — n'ont aucune source légale : elles restent énoncées comme
 * règles du système, sans référence et donc sans lien.
 */
import { REFERENCES } from '@/data/textesFiscaux.data';

export const REGLES = {
  tva_theorique: {
    regle:
      'Attendue d’après la base déclarée : chiffre d’affaires × 5 % sous impôt synthétique, sinon le plus grand de (320 000 Ar + 20 % du chiffre d’affaires) et (20 % du bénéfice).',
    section: 'montants',
    aussi: 'categories',
    code: 'frontend/src/frontofficeagent/collecte/components/TheoreticalForm.jsx',
    source: REFERENCES.tva_theorique,
  },
  ecart: {
    regle:
      'TVA théorique moins TVA payée, uniquement quand le résultat est positif. Une différence demande une explication, pas un paiement immédiat.',
    section: 'montants',
    aussi: 'questions',
  },
  seuil_redressement: {
    regle:
      'Le calcul de collecte retient un redressement quand la différence dépasse 50 % de la TVA attendue ; en dessous, la ligne reste à expliquer.',
    section: 'montants',
    aussi: 'confrontation',
    code: 'frontend/src/frontofficeagent/collecte/components/TheoreticalForm.jsx',
    source: REFERENCES.seuil_redressement,
  },
  amende: {
    regle:
      'Amende fiscale de 40 % du principal redressé. Elle n’est exigible qu’après la notification définitive, jamais sur une proposition.',
    section: 'delais',
    aussi: 'procedure',
    source: REFERENCES.amende_40,
  },
  delai_eclaircissements: {
    regle:
      '30 jours pour répondre à une demande d’éclaircissements. Aucun montant n’est réclamé à ce stade.',
    section: 'procedure',
    source: REFERENCES.eclaircissements,
  },
  delai_primitive: {
    regle:
      '30 jours pour répondre à la notification primitive. Une prorogation n’est pas un droit : elle se demande à titre gracieux et le nouveau délai, accordé par l’autorité décisionnaire, ne peut excéder quinze jours.',
    section: 'procedure',
    aussi: 'delais',
    source: REFERENCES.notification_primitive,
  },
  notification_definitive: {
    regle:
      'À défaut de réponse dans les trente jours, l’agent fixe la base d’imposition et établit la notification définitive ; celle-ci clôt la procédure contradictoire.',
    section: 'procedure',
    aussi: 'delais',
    source: REFERENCES.notification_definitive,
  },
  imputation: {
    regle:
      'Un crédit d’impôt antérieur s’impute sur la dette née de la notification définitive. L’instruction ne l’autorise pas sur une simple proposition.',
    section: 'procedure',
    aussi: 'delais',
    source: REFERENCES.imputation_credit,
  },
  penalite_rappel: {
    regle: 'Pénalité de retard de 10 % du principal, ajoutée au montant porté au rappel.',
    section: 'delais',
    aussi: 'statuts',
    code: 'frontend/src/frontofficeagent/relance/components/RappelOrdreModal.jsx',
    source: REFERENCES.penalite_rappel,
  },
  penalite_mensuelle: {
    regle:
      'En retard, une pénalité s’ajoute chaque mois : 1 % (petit contribuable), 2 % le premier mois puis 1 % (moyen), 3 % le premier mois puis 1 % (grand).',
    section: 'delais',
    aussi: 'categories',
    source: REFERENCES.penalites_retard,
  },
  infraction_facturation: {
    regle:
      'Amende forfaitaire d’infraction au système d’e-Facturation : 20 000 000 Ar (grand contribuable), 10 000 000 Ar (moyen), 1 000 000 Ar (petit).',
    section: 'delais',
    aussi: 'categories',
    source: REFERENCES.efacturation,
  },
  relance_delais: {
    regle:
      'Deux rappels espacés de 8 jours francs, puis mise en demeure de payer à 5 jours francs.',
    section: 'delais',
    aussi: 'statuts',
    code: 'frontend/src/frontofficeagent/relance/utils/relance.utils.js',
  },
  jours_francs: {
    regle:
      'Un jour franc est une journée entière : le jour où l’acte est envoyé n’est pas décompté.',
    section: 'delais',
  },
  tolerance: {
    regle:
      'La règle de rapprochement admet une petite différence entre les deux montants : la ligne est alors qualifiée de « tolérance », sans écart retenu.',
    section: 'confrontation',
    aussi: 'questions',
  },
  rapprochement: {
    regle:
      'Comparaison, date par date, d’un montant que vous avez déclaré et d’un montant obtenu hors de votre dossier.',
    section: 'confrontation',
    aussi: 'statuts',
  },
  recoupement: {
    regle:
      'Montant obtenu auprès d’un tiers — banque, fournisseur, client, administration — que la DGI rapproche de vos déclarations.',
    section: 'confrontation',
    aussi: 'questions',
  },
  droit_communication: {
    regle:
      'Demande de pièces ou d’informations adressée à un tiers dans le cadre de votre dossier. Son statut dit où en est la réponse du tiers, pas votre imposition.',
    section: 'confrontation',
    aussi: 'questions',
    source: REFERENCES.droit_communication,
  },
  categorie: {
    regle:
      'Catégorie déduite du dernier chiffre d’affaires déclaré : 400 M Ar et plus (grand), de 100 à 400 M Ar (moyen), moins de 100 M Ar (petit). Elle commande le régime, la comptabilité et les pénalités mensuelles.',
    section: 'categories',
    aussi: 'montants',
    code: 'frontend/src/frontofficeagent/contribuables/utils/classificationCgi.utils.js',
    source: REFERENCES.seuil_categorie,
  },
  prorogation: {
    regle:
      'Obtenir un délai supplémentaire est une demande gracieuse, pas une prorogation automatique de la procédure.',
    section: 'delais',
    aussi: 'procedure',
    source: REFERENCES.prorogation,
  },
  tentative_lien: {
    regle:
      'Huit tentatives de vérification sont admises pour un lien : le NIF et l’e-mail doivent être ceux enregistrés dans le dossier. Passé ce nombre, le lien se bloque temporairement.',
    section: 'securite',
  },
  expiration_lien: {
    regle:
      'Un lien d’accès est valable sept jours à compter de son émission, trente jours au maximum. Un nouveau lien demandé au centre révoque l’ancien.',
    section: 'securite',
  },
};

/** Une règle inconnue n'est jamais muette : le composant rend alors le texte seul. */
export const regle = (id) => (id ? REGLES[id] : undefined);
