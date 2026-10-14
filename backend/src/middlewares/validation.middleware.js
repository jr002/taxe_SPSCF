const { body, query, validationResult } = require('express-validator');
const { isValidCentreFiscalRef } = require('../utils/unite-fiscale.utils');

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
    .isLength({ min: 10 }).withMessage('Le NIF doit contenir au moins 10 chiffres')
    .matches(/^\d+$/).withMessage('Le NIF ne doit contenir que des chiffres'),
  body('raison_sociale')
    .notEmpty().withMessage('La raison sociale est obligatoire')
    .isLength({ min: 2 }).withMessage('La raison sociale est trop courte'),
  body('secteur_activite')
    .notEmpty().withMessage('Le secteur d\'activité est obligatoire'),
  body('adresse')
    .notEmpty().withMessage('L\'adresse est obligatoire'),
  body('telephone')
    .notEmpty().withMessage('Le téléphone est obligatoire')
    .matches(/^[0-9+\-\s]{8,}$/).withMessage('Format de téléphone invalide'),
  body('email')
    .optional({ values: 'falsy' })
    .isEmail().withMessage('Email invalide'),
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
    .optional()
    .isFloat({ min: 0 }).withMessage('Le CA doit être positif'),
  body('benefice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Le bénéfice doit être positif'),
  body('tva_collectee')
    .optional()
    .isFloat({ min: 0 }).withMessage('La TVA collectée doit être positive'),
  body('tva_deductible')
    .optional()
    .isFloat({ min: 0 }).withMessage('La TVA déductible doit être positive'),
  body('tva_payee')
    .optional()
    .isFloat({ min: 0 }).withMessage('La TVA payée doit être positive')
];

const recoupementValidators = [
  body('id_contribuable')
    .optional({ values: 'falsy' })
    .isInt().withMessage('ID contribuable invalide'),
  body('source')
    .optional()
    .isString().withMessage('Source invalide'),
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
    .isLength({ max: 50 }).withMessage('NIF tiers trop long')
];

const etatContribuableValidators = [
  body('id_contribuable')
    .optional()
    .isInt().withMessage('ID contribuable invalide'),
  body('statut_activite')
    .optional()
    .isString().withMessage('Statut d\'activité invalide'),
  body('statut_conformite')
    .optional()
    .isString().withMessage('Statut de conformité invalide')
];

const rapprochementValidators = [
  body('type_rapprochement')
    .optional()
    .isString().withMessage('Type de rapprochement invalide'),
  body('score')
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('Score invalide (0 à 100)')
];

module.exports = {
  validate,
  contribuableValidators,
  centreFiscalRefValidator,
  centreFiscalRefQueryValidator,
  declarationValidators,
  recoupementValidators,
  etatContribuableValidators,
  rapprochementValidators
};