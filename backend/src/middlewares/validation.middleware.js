const { body, query, validationResult } = require('express-validator');
const { isValidCentreFiscalRef } = require('../utils/unite-fiscale.utils');
const { STATUTS_ACTIVITE, STATUTS_CONFORMITE } = require('../models/etat-contribuable.model');
const { TYPES_RELANCE, STATUTS_RELANCE } = require('../models/relance.model');
const { TYPES_RAPPROCHEMENT, STATUTS_RAPPROCHEMENT } = require('../models/rapprochement.model');

// Plafond des colonnes monétaires : toutes sont en `numeric(15,2)`, au-delà
// PostgreSQL renvoie une erreur de dépassement (500) au lieu d'un refus net.
const MONTANT_MAX = 9999999999999.99;

const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));
    
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }
    
    res.status(400).json({
      success: false,
      message: 'Erreur de validation',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  };
};

// Validateurs
const contribuableValidators = [
  body('nif')
    .notEmpty().withMessage('Le NIF est obligatoire')
    .isLength({ min: 10, max: 50 }).withMessage('Le NIF doit contenir entre 10 et 50 chiffres')
    .matches(/^\d+$/).withMessage('Le NIF ne doit contenir que des chiffres'),
  body('raison_sociale')
    .notEmpty().withMessage('La raison sociale est obligatoire')
    .isLength({ min: 2, max: 255 }).withMessage('La raison sociale doit contenir entre 2 et 255 caractères'),
  body('secteur_activite')
    .notEmpty().withMessage('Le secteur d\'activité est obligatoire')
    .isLength({ max: 100 }).withMessage('Le secteur d\'activité ne doit pas dépasser 100 caractères'),
  body('adresse')
    .notEmpty().withMessage('L\'adresse est obligatoire'),
  body('telephone')
    .notEmpty().withMessage('Le téléphone est obligatoire')
    .matches(/^[0-9+\-\s]{8,}$/).withMessage('Format de téléphone invalide')
    .isLength({ max: 20 }).withMessage('Le téléphone ne doit pas dépasser 20 caractères'),
  body('email')
    .optional({ values: 'falsy' })
    .isEmail().withMessage('Email invalide')
    .isLength({ max: 100 }).withMessage('L\'email ne doit pas dépasser 100 caractères'),
  body('regime_fiscal')
    .optional()
    .isIn(['IS', 'IR']).withMessage('Régime fiscal invalide'),
  body('id_centre')
    .optional({ values: 'falsy' })
    .isInt({ min: 1 }).withMessage('Centre invalide'),
  body('centre_fiscal_ref')
    .optional({ values: 'falsy' })
    .isString().withMessage('Centre fiscal invalide')
    .bail()
    .isLength({ max: 255 }).withMessage('Référence du centre trop longue')
    .bail()
    .custom(isValidCentreFiscalRef).withMessage('Le centre fiscal sélectionné est introuvable')
];

const centreFiscalRefValidator = [
  body('centre_fiscal_ref')
    .optional({ values: 'falsy' })
    .isString().withMessage('Centre fiscal invalide')
    .bail()
    .isLength({ max: 255 }).withMessage('Référence du centre trop longue')
    .bail()
    .custom(isValidCentreFiscalRef).withMessage('Le centre fiscal sélectionné est introuvable')
];

const centreFiscalRefQueryValidator = [
  query('centre_fiscal_ref')
    .optional()
    .isString().withMessage('Centre fiscal invalide')
    .bail()
    .isLength({ max: 255 }).withMessage('Référence du centre trop longue')
    .bail()
    .custom(isValidCentreFiscalRef).withMessage('Le centre fiscal sélectionné est introuvable')
];

// Champs mutables d'un contribuable (ContribuableModel.update). Le corps est
// partiel : seule la longueur des colonnes `VarChar` est bornée, les exigences
// de contenu restent celles de la création.
const contribuableUpdateValidators = [
  ...centreFiscalRefValidator,
  body('raison_sociale')
    .optional({ values: 'falsy' })
    .isString().withMessage('Raison sociale invalide')
    .isLength({ max: 255 }).withMessage('La raison sociale ne doit pas dépasser 255 caractères'),
  body('secteur_activite')
    .optional({ values: 'falsy' })
    .isString().withMessage('Secteur d\'activité invalide')
    .isLength({ max: 100 }).withMessage('Le secteur d\'activité ne doit pas dépasser 100 caractères'),
  body('adresse')
    .optional({ values: 'falsy' })
    .isString().withMessage('Adresse invalide'),
  body('telephone')
    .optional({ values: 'falsy' })
    .isString().withMessage('Téléphone invalide')
    .isLength({ max: 20 }).withMessage('Le téléphone ne doit pas dépasser 20 caractères'),
  body('email')
    .optional({ values: 'falsy' })
    .isEmail().withMessage('Email invalide')
    .isLength({ max: 100 }).withMessage('L\'email ne doit pas dépasser 100 caractères'),
  body('regime_fiscal')
    .optional({ values: 'falsy' })
    .isIn(['IS', 'IR']).withMessage('Régime fiscal invalide'),
  body('id_centre')
    .optional({ values: 'falsy' })
    .isInt({ min: 1 }).withMessage('Centre invalide')
];

const declarationValidators = [
  body('id_contribuable')
    .isInt().withMessage('ID contribuable invalide'),
  body('annee')
    .optional()
    .isInt({ min: 2000, max: 2100 })
    .withMessage('Année invalide'),
  body('type_declaration')
    .optional()
    .isString().withMessage('Type de déclaration invalide')
    .isLength({ max: 30 }).withMessage('Type de déclaration trop long'),
  body('periode')
    .optional({ values: 'falsy' })
    .isString().withMessage('Période invalide')
    .isLength({ max: 7 }).withMessage('La période doit comporter au maximum 7 caractères (ex: 2024-01)'),
  body('ca')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0, max: MONTANT_MAX }).withMessage('Le CA doit être compris entre 0 et 9 999 999 999 999,99'),
  body('benefice')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0, max: MONTANT_MAX }).withMessage('Le bénéfice doit être compris entre 0 et 9 999 999 999 999,99'),
  body('tva_collectee')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0, max: MONTANT_MAX }).withMessage('La TVA collectée doit être comprise entre 0 et 9 999 999 999 999,99'),
  body('tva_deductible')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0, max: MONTANT_MAX }).withMessage('La TVA déductible doit être comprise entre 0 et 9 999 999 999 999,99'),
  body('tva_payee')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0, max: MONTANT_MAX }).withMessage('La TVA payée doit être comprise entre 0 et 9 999 999 999 999,99'),
  body('tva_theorique')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0, max: MONTANT_MAX }).withMessage('La TVA théorique doit être comprise entre 0 et 9 999 999 999 999,99'),
  body('observations_agent')
    .optional({ values: 'falsy' })
    .isString().withMessage('Observations invalides')
    .isLength({ max: 2000 }).withMessage('Les observations ne peuvent excéder 2000 caractères'),
  body('statut')
    .optional({ values: 'falsy' })
    .isString().withMessage('Statut invalide')
    .isLength({ max: 40 }).withMessage('Statut trop long')
];

// Champs réellement mutables d'une déclaration (DeclarationModel.update). Une
// modification partielle ne doit pas réclamer `id_contribuable`, qui n'est pas
// modifiable.
const declarationUpdateValidators = [
  body('annee')
    .optional({ values: 'falsy' })
    .isInt({ min: 2000, max: 2100 }).withMessage('Année invalide'),
  body('type_declaration')
    .optional({ values: 'falsy' })
    .isString().withMessage('Type de déclaration invalide')
    .isLength({ max: 30 }).withMessage('Type de déclaration trop long'),
  body('periode')
    .optional({ values: 'falsy' })
    .isString().withMessage('Période invalide')
    .isLength({ max: 7 }).withMessage('La période doit comporter au maximum 7 caractères (ex: 2024-01)'),
  body('ca')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0, max: MONTANT_MAX }).withMessage('Le CA doit être compris entre 0 et 9 999 999 999 999,99'),
  body('benefice')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0, max: MONTANT_MAX }).withMessage('Le bénéfice doit être compris entre 0 et 9 999 999 999 999,99'),
  body('tva_collectee')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0, max: MONTANT_MAX }).withMessage('La TVA collectée doit être comprise entre 0 et 9 999 999 999 999,99'),
  body('tva_deductible')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0, max: MONTANT_MAX }).withMessage('La TVA déductible doit être comprise entre 0 et 9 999 999 999 999,99'),
  body('tva_payee')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0, max: MONTANT_MAX }).withMessage('La TVA payée doit être comprise entre 0 et 9 999 999 999 999,99'),
  body('tva_theorique')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0, max: MONTANT_MAX }).withMessage('La TVA théorique doit être comprise entre 0 et 9 999 999 999 999,99'),
  body('statut')
    .optional({ values: 'falsy' })
    .isString().withMessage('Statut invalide')
    .isLength({ max: 40 }).withMessage('Statut trop long'),
  body('date_notification_primitive')
    .optional({ values: 'falsy' })
    .isISO8601().withMessage('Date de notification primitive invalide'),
  body('date_limite_reponse')
    .optional({ values: 'falsy' })
    .isISO8601().withMessage('Date limite de réponse invalide'),
  body('date_notification_definitive')
    .optional({ values: 'falsy' })
    .isISO8601().withMessage('Date de notification définitive invalide'),
  body('prorogation_jours')
    .optional({ values: 'falsy' })
    .isInt({ min: 0, max: 3650 }).withMessage('Prorogation invalide (0 à 3650 jours)'),
  body('montant_redressement')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0, max: MONTANT_MAX }).withMessage('Le montant du redressement doit être compris entre 0 et 9 999 999 999 999,99'),
  body('credit_impot')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0, max: MONTANT_MAX }).withMessage('Le crédit d\'impôt doit être compris entre 0 et 9 999 999 999 999,99'),
  body('montant_impute')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0, max: MONTANT_MAX }).withMessage('Le montant imputé doit être compris entre 0 et 9 999 999 999 999,99'),
  body('montant_net_a_payer')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0, max: MONTANT_MAX }).withMessage('Le montant net à payer doit être compris entre 0 et 9 999 999 999 999,99'),
  body('observations_agent')
    .optional({ values: 'falsy' })
    .isString().withMessage('Observations invalides')
    .isLength({ max: 2000 }).withMessage('Les observations ne peuvent excéder 2000 caractères')
];

// Les trois actes subséquents d'une déclaration : dates en ISO et montants dans
// la plage des colonnes numeric(15,2).
const notificationPrimitiveValidators = [
  body('date_emission')
    .optional({ values: 'falsy' })
    .isISO8601().withMessage('Date d\'émission invalide'),
  body('prorogation_jours')
    .optional({ values: 'falsy' })
    .isInt({ min: 0, max: 3650 }).withMessage('Prorogation invalide (0 à 3650 jours)'),
  body('montant_redressement')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0, max: MONTANT_MAX }).withMessage('Le montant du redressement doit être compris entre 0 et 9 999 999 999 999,99'),
  body('credit_impot')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0, max: MONTANT_MAX }).withMessage('Le crédit d\'impôt doit être compris entre 0 et 9 999 999 999 999,99'),
  body('observations_agent')
    .optional({ values: 'falsy' })
    .isString().withMessage('Observations invalides')
    .isLength({ max: 2000 }).withMessage('Les observations ne peuvent excéder 2000 caractères')
];

const notificationDefinitiveValidators = [
  body('date_emission')
    .optional({ values: 'falsy' })
    .isISO8601().withMessage('Date d\'émission invalide'),
  body('montant_valide')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0, max: MONTANT_MAX }).withMessage('Le montant validé doit être compris entre 0 et 9 999 999 999 999,99'),
  body('credit_impot')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0, max: MONTANT_MAX }).withMessage('Le crédit d\'impôt doit être compris entre 0 et 9 999 999 999 999,99')
];

const imputationCreditValidators = [
  body('credit_impot')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0, max: MONTANT_MAX }).withMessage('Le crédit d\'impôt doit être compris entre 0 et 9 999 999 999 999,99'),
  body('montant_a_imputer')
    .notEmpty().withMessage('Le montant à imputer est obligatoire')
    .isFloat({ min: 0, max: MONTANT_MAX }).withMessage('Le montant à imputer doit être compris entre 0 et 9 999 999 999 999,99')
];

const recoupementValidators = [
  body('id_contribuable')
    .optional({ values: 'falsy' })
    .isInt().withMessage('ID contribuable invalide'),
  body('source')
    .optional({ values: 'falsy' })
    .isString().withMessage('Source invalide')
    .isLength({ max: 50 }).withMessage('La source ne doit pas dépasser 50 caractères'),
  body('periode')
    .optional({ values: 'falsy' })
    .isString().withMessage('Période invalide')
    .isLength({ max: 7 }).withMessage('La période ne doit pas dépasser 7 caractères'),
  body('reference')
    .optional({ values: 'falsy' })
    .isString().withMessage('Référence invalide')
    .isLength({ max: 100 }).withMessage('La référence ne doit pas dépasser 100 caractères'),
  body('type_operation')
    .optional({ values: 'falsy' })
    .isString().withMessage('Type d\'opération invalide')
    .isLength({ max: 30 }).withMessage('Type d\'opération trop long'),
  body('nif_tiers')
    .optional({ values: 'falsy' })
    .isString().withMessage('NIF tiers invalide')
    .isLength({ max: 50 }).withMessage('NIF tiers trop long'),
  body('somme_recoupee')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0, max: MONTANT_MAX }).withMessage('La somme recoupée doit être comprise entre 0 et 9 999 999 999 999,99'),
  body('montant_declare')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0, max: MONTANT_MAX }).withMessage('Le montant déclaré doit être compris entre 0 et 9 999 999 999 999,99'),
  body('montant_tva')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0, max: MONTANT_MAX }).withMessage('Le montant de TVA doit être compris entre 0 et 9 999 999 999 999,99'),
  body('montant_ttc')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0, max: MONTANT_MAX }).withMessage('Le montant TTC doit être compris entre 0 et 9 999 999 999 999,99')
];

const droitCommunicationValidators = [
  body('id_contribuable')
    .notEmpty().withMessage('Le contribuable est obligatoire')
    .isInt().withMessage('ID contribuable invalide'),
  body('tier')
    .notEmpty().withMessage('Le tiers est obligatoire')
    .isLength({ max: 255 }).withMessage('Le tiers ne doit pas dépasser 255 caractères'),
  body('objet')
    .notEmpty().withMessage('L\'objet de la demande est obligatoire'),
  body('date_demande')
    .notEmpty().withMessage('La date de demande est obligatoire')
    .isISO8601().withMessage('Date de demande invalide'),
  body('type_tier')
    .optional({ values: 'falsy' })
    .isString().withMessage('Type de tiers invalide')
    .isLength({ max: 30 }).withMessage('Type de tiers trop long'),
  body('nif_tier')
    .optional({ values: 'falsy' })
    .isString().withMessage('NIF tiers invalide')
    .isLength({ max: 50 }).withMessage('NIF tiers trop long'),
  body('date_reponse')
    .optional({ values: 'falsy' })
    .isISO8601().withMessage('Date de réponse invalide'),
  body('statut')
    .optional({ values: 'falsy' })
    .isIn(['demande', 'reponse', 'partiel', 'relance', 'sans_suite']).withMessage('Statut invalide')
];

// Une modification partielle d'un droit déjà enregistré ne doit pas réclamer les
// champs de constitution du dossier.
const droitCommunicationUpdateValidators = [
  body('id_contribuable')
    .optional({ values: 'falsy' })
    .isInt().withMessage('ID contribuable invalide'),
  body('tier')
    .optional({ values: 'falsy' })
    .isString().withMessage('Tiers invalide')
    .isLength({ max: 255 }).withMessage('Le tiers ne doit pas dépasser 255 caractères'),
  body('objet')
    .optional({ values: 'falsy' })
    .isString().withMessage('Objet invalide'),
  body('date_demande')
    .optional({ values: 'falsy' })
    .isISO8601().withMessage('Date de demande invalide'),
  body('type_tier')
    .optional({ values: 'falsy' })
    .isString().withMessage('Type de tiers invalide')
    .isLength({ max: 30 }).withMessage('Type de tiers trop long'),
  body('nif_tier')
    .optional({ values: 'falsy' })
    .isString().withMessage('NIF tiers invalide')
    .isLength({ max: 50 }).withMessage('NIF tiers trop long'),
  body('date_reponse')
    .optional({ values: 'falsy' })
    .isISO8601().withMessage('Date de réponse invalide'),
  body('statut')
    .optional({ values: 'falsy' })
    .isIn(['demande', 'reponse', 'partiel', 'relance', 'sans_suite']).withMessage('Statut invalide')
];

const etatContribuableValidators = [
  body('id_contribuable')
    .optional()
    .isInt().withMessage('ID contribuable invalide'),
  body('statut_activite')
    .optional({ values: 'falsy' })
    .isIn(STATUTS_ACTIVITE).withMessage(`Statut d'activité invalide. Valeurs acceptées : ${STATUTS_ACTIVITE.join(', ')}.`),
  body('statut_conformite')
    .optional({ values: 'falsy' })
    .isIn(STATUTS_CONFORMITE).withMessage(`Statut de conformité invalide. Valeurs acceptées : ${STATUTS_CONFORMITE.join(', ')}.`),
  body('motif')
    .optional({ values: 'falsy' })
    .isString().withMessage('Motif invalide')
];

const relanceValidators = [
  body('id_contribuable')
    .notEmpty().withMessage('Le contribuable est obligatoire')
    .isInt().withMessage('ID contribuable invalide'),
  body('id_declaration')
    .optional({ values: 'falsy' })
    .isInt().withMessage('ID déclaration invalide'),
  body('type_relance')
    .notEmpty().withMessage('Le type de relance est obligatoire')
    .isIn(TYPES_RELANCE).withMessage(`Type de relance invalide. Valeurs acceptées : ${TYPES_RELANCE.join(', ')}.`),
  body('statut')
    .optional({ values: 'falsy' })
    .isIn(STATUTS_RELANCE).withMessage(`Statut de relance invalide. Valeurs acceptées : ${STATUTS_RELANCE.join(', ')}.`),
  body('annee')
    .notEmpty().withMessage('L\'année est obligatoire')
    .isInt({ min: 2000, max: 2100 }).withMessage('Année invalide'),
  body('montant_du')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0, max: MONTANT_MAX }).withMessage('Le montant dû doit être compris entre 0 et 9 999 999 999 999,99'),
  body('jours_retard')
    .optional({ values: 'falsy' })
    .isInt({ min: 0, max: 36500 }).withMessage('Nombre de jours de retard invalide'),
  body('date_emission')
    .optional({ values: 'falsy' })
    .isISO8601().withMessage('Date d\'émission invalide'),
  body('date_regularisation')
    .optional({ values: 'falsy' })
    .isISO8601().withMessage('Date de régularisation invalide'),
  body('document_url')
    .optional({ values: 'falsy' })
    .isString().withMessage('URL du document invalide'),
  body('observations')
    .optional({ values: 'falsy' })
    .isString().withMessage('Observations invalides')
];

// Champs réellement mutables d'une relance (RelanceModel.update) : la mise à jour
// d'un statut ou d'une date ne doit pas exiger les champs de création.
const relanceUpdateValidators = [
  body('type_relance')
    .optional({ values: 'falsy' })
    .isIn(TYPES_RELANCE).withMessage(`Type de relance invalide. Valeurs acceptées : ${TYPES_RELANCE.join(', ')}.`),
  body('statut')
    .optional({ values: 'falsy' })
    .isIn(STATUTS_RELANCE).withMessage(`Statut de relance invalide. Valeurs acceptées : ${STATUTS_RELANCE.join(', ')}.`),
  body('montant_du')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0, max: MONTANT_MAX }).withMessage('Le montant dû doit être compris entre 0 et 9 999 999 999 999,99'),
  body('jours_retard')
    .optional({ values: 'falsy' })
    .isInt({ min: 0, max: 36500 }).withMessage('Nombre de jours de retard invalide'),
  body('date_regularisation')
    .optional({ values: 'falsy' })
    .isISO8601().withMessage('Date de régularisation invalide'),
  body('document_url')
    .optional({ values: 'falsy' })
    .isString().withMessage('URL du document invalide'),
  body('observations')
    .optional({ values: 'falsy' })
    .isString().withMessage('Observations invalides'),
  body('id_agent')
    .optional({ values: 'falsy' })
    .isInt().withMessage('ID agent invalide')
];

const rapprochementStatutValidators = [
  body('statut')
    .notEmpty().withMessage('Le statut est obligatoire')
    .isIn(STATUTS_RAPPROCHEMENT).withMessage(`Statut de rapprochement invalide. Valeurs acceptées : ${STATUTS_RAPPROCHEMENT.join(', ')}.`),
  body('motif')
    .optional({ values: 'falsy' })
    .isString().withMessage('Motif invalide')
];

const rapprochementValidators = [
  body('type_rapprochement')
    .optional({ values: 'falsy' })
    .isIn(TYPES_RAPPROCHEMENT).withMessage(`Type de rapprochement invalide. Valeurs acceptées : ${TYPES_RAPPROCHEMENT.join(', ')}.`),
  body('statut')
    .optional({ values: 'falsy' })
    .isIn(STATUTS_RAPPROCHEMENT).withMessage(`Statut de rapprochement invalide. Valeurs acceptées : ${STATUTS_RAPPROCHEMENT.join(', ')}.`),
  body('score')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0, max: 100 }).withMessage('Score invalide (0 à 100)'),
  body('montant_declare')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0, max: MONTANT_MAX }).withMessage('Le montant déclaré doit être compris entre 0 et 9 999 999 999 999,99'),
  body('montant_recoupe')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0, max: MONTANT_MAX }).withMessage('Le montant recoupé doit être compris entre 0 et 9 999 999 999 999,99'),
  body('ecart')
    .optional({ values: 'falsy' })
    .isFloat({ min: -MONTANT_MAX, max: MONTANT_MAX }).withMessage('Écart hors plage'),
  body('id_controle')
    .optional({ values: 'falsy' })
    .isInt().withMessage('ID contrôle invalide')
];

module.exports = {
  validate,
  contribuableValidators,
  contribuableUpdateValidators,
  centreFiscalRefValidator,
  centreFiscalRefQueryValidator,
  declarationValidators,
  declarationUpdateValidators,
  notificationPrimitiveValidators,
  notificationDefinitiveValidators,
  imputationCreditValidators,
  recoupementValidators,
  droitCommunicationValidators,
  droitCommunicationUpdateValidators,
  etatContribuableValidators,
  relanceValidators,
  relanceUpdateValidators,
  rapprochementValidators,
  rapprochementStatutValidators
};