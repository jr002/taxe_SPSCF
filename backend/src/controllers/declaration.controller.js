const DeclarationModel = require('../models/declaration.model');
const FiscalService = require('../services/fiscal.service');

class DeclarationController {
  // Créer une déclaration avec calcul auto
  static async create(req, res) {
    try {
      const { 
        id_contribuable, annee, ca, benefice, 
        tva_collectee, tva_deductible, tva_payee, tva_theorique,
        regime_fiscal, type_declaration, periode, observations_agent 
      } = req.body || {};
      
      // TVA théorique : calculée depuis le CA et le bénéfice, sauf quand le collecteur
      // l'a déjà déterminée à partir d'autres assiettes (TVA collectée / déductible).
      const tvaTheorique =
        tva_theorique !== undefined && tva_theorique !== null && tva_theorique !== ''
          ? Number(tva_theorique)
          : FiscalService.calculerTVATheorique(ca, benefice, regime_fiscal);
      
      // Calculer l'écart et déterminer le statut
      const ecart = FiscalService.calculerEcart(tvaTheorique, tva_payee);
      const pourcentageEcart = FiscalService.calculerPourcentageEcart(tvaTheorique, tva_payee);
      const statut = FiscalService.determinerStatut(pourcentageEcart);
      
      const declaration = await DeclarationModel.create({
        id_contribuable,
        annee,
        type_declaration,
        periode,
        ca,
        benefice,
        tva_collectee,
        tva_deductible,
        tva_payee,
        tva_theorique: tvaTheorique,
        statut,
        observations_agent
      });
      
      res.status(201).json({
        success: true,
        data: {
          declaration,
          analyse: {
            tva_theorique: tvaTheorique,
            ecart: ecart,
            pourcentage_ecart: pourcentageEcart,
            statut: statut
          }
        },
        message: 'Déclaration créée avec succès'
      });
    } catch (error) {
      console.error('Erreur création déclaration:', error);
      // L'unicité (contribuable, période, type) est portée par la base : un
      // doublon est un conflit métier, pas une panne serveur.
      if (error.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message: 'Une déclaration existe déjà pour ce contribuable, cette période et ce type'
        });
      }
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de la déclaration'
      });
    }
  }

  // Liste des déclarations
  static async findAll(req, res) {
    try {
      const { page, limit, search, statut, annee, type_declaration, periode } = req.query;
      const result = await DeclarationModel.findAll({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        search: search || '',
        statut: statut || '',
        annee: annee || '',
        type_declaration: type_declaration || '',
        periode: periode || '',
        scope: req.dataScope,
      });
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Erreur liste déclarations:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des déclarations'
      });
    }
  }

  // Détails d'une déclaration
  static async findById(req, res) {
    try {
      const { id } = req.params;
      const declaration = await DeclarationModel.findById(id);
      
      if (!declaration) {
        return res.status(404).json({
          success: false,
          message: 'Déclaration non trouvée'
        });
      }
      
      res.json({
        success: true,
        data: declaration
      });
    } catch (error) {
      console.error('Erreur détail déclaration:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de la déclaration'
      });
    }
  }

  // Statistiques
  static async getStats(req, res) {
    try {
      // Le chef de centre reçoit en plus le total TVA national : l'accueil
      // compare son centre à la DGI entière (agrégat seul, aucun dossier).
      const stats = await DeclarationModel.getStats(req.dataScope, {
        national: req.user?.role === 'chef_centre',
      });
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Erreur statistiques:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques'
      });
    }
  }

  // Émettre la Notification Primitive (Proposition)
  static async emettreNotificationPrimitive(req, res) {
    try {
      const { id } = req.params;
      const { date_emission, prorogation_jours, montant_redressement, credit_impot, observations_agent } = req.body;

      const updated = await DeclarationModel.emettreNotificationPrimitive(id, {
        date_emission,
        prorogation_jours,
        montant_redressement,
        credit_impot,
        observations_agent,
      });

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Déclaration non trouvée',
        });
      }

      res.json({
        success: true,
        data: updated,
        message: 'Notification primitive émise avec succès (délai de réponse fixé à 30 jours)',
      });
    } catch (error) {
      console.error('Erreur émission notification primitive:', error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de l'émission de la notification primitive",
      });
    }
  }

  // Émettre la Notification Définitive (Validation des montants par l'agent)
  static async emettreNotificationDefinitive(req, res) {
    try {
      const { id } = req.params;
      const { date_emission, montant_valide, credit_impot, observations_agent } = req.body;

      const updated = await DeclarationModel.emettreNotificationDefinitive(id, {
        date_emission,
        montant_valide,
        credit_impot,
        observations_agent,
      });

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Déclaration non trouvée',
        });
      }

      res.json({
        success: true,
        data: updated,
        message: 'Notification définitive émise avec succès (statut DÉFINITIVE_ENVOYÉE, imputation débloquée)',
      });
    } catch (error) {
      console.error('Erreur émission notification définitive:', error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de l'émission de la notification définitive",
      });
    }
  }

  // Imputer le crédit d'impôt (Articles 01.01.15 et 01.02.06 CGI 2026)
  static async imputerCreditImpot(req, res) {
    try {
      const { id } = req.params;
      const { credit_impot, montant_a_imputer, observations_agent } = req.body;

      const updated = await DeclarationModel.imputerCreditImpot(id, {
        credit_impot,
        montant_a_imputer,
        observations_agent,
      });

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Déclaration non trouvée',
        });
      }

      res.json({
        success: true,
        data: updated,
        message: "Crédit d'impôt imputé avec succès sur le redressement définitif",
      });
    } catch (error) {
      console.error('Erreur imputation crédit impôt:', error);
      res.status(400).json({
        success: false,
        message: error.message || "Erreur lors de l'imputation du crédit d'impôt",
      });
    }
  }

  // Mettre à jour une déclaration
  static async update(req, res) {
    try {
      const { id } = req.params;
      const updated = await DeclarationModel.update(id, req.body);
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Déclaration non trouvée',
        });
      }
      res.json({
        success: true,
        data: updated,
        message: 'Déclaration mise à jour avec succès',
      });
    } catch (error) {
      console.error('Erreur mise à jour déclaration:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de la déclaration',
      });
    }
  }
}

module.exports = DeclarationController;