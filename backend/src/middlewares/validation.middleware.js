const { body, validationResult } = require('express-validator');

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
const entrepriseValidators = [
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
    .isIn(['IS', 'IR']).withMessage('Régime fiscal invalide')
];

const declarationValidators = [
  body('id_entreprise')
    .isInt().withMessage('ID entreprise invalide'),
  body('annee')
    .isInt({ min: 2000, max: 2100 })
    .withMessage('Année invalide'),
  body('ca')
    .isFloat({ min: 0 }).withMessage('Le CA doit être positif'),
  body('benefice')
    .isFloat({ min: 0 }).withMessage('Le bénéfice doit être positif'),
  body('tva_collectee')
    .isFloat({ min: 0 }).withMessage('La TVA collectée doit être positive'),
  body('tva_deductible')
    .isFloat({ min: 0 }).withMessage('La TVA déductible doit être positive'),
  body('tva_payee')
    .isFloat({ min: 0 }).withMessage('La TVA payée doit être positive')
];

module.exports = {
  validate,
  entrepriseValidators,
  declarationValidators
};