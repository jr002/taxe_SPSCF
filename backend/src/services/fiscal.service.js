class FiscalService {
  // Calcul de la TVA théorique
  static calculerTVATheorique(ca, benefice, regimeFiscal) {
    let tvaTheorique = 0;
    
    if (regimeFiscal === 'IS') {
      // Régime IS : CA < 400,000,000 Ar
      tvaTheorique = ca * 0.05; // 5%
    } else if (regimeFiscal === 'IR') {
      // Régime IR : CA >= 400,000,000 Ar
      const option1 = 320000 + (ca * 0.20);
      const option2 = benefice * 0.20;
      tvaTheorique = Math.max(option1, option2);
    } else {
      // Par défaut
      tvaTheorique = ca * 0.05;
    }
    
    return Math.round(tvaTheorique * 100) / 100;
  }

  // Calcul de l'écart
  static calculerEcart(tvaTheorique, tvaPayee) {
    return Math.round((tvaTheorique - tvaPayee) * 100) / 100;
  }

  // Calcul du pourcentage d'écart
  static calculerPourcentageEcart(tvaTheorique, tvaPayee) {
    if (tvaTheorique === 0) return 0;
    const ecart = this.calculerEcart(tvaTheorique, tvaPayee);
    return Math.round((ecart / tvaTheorique) * 10000) / 100;
  }

  // Déterminer le statut
  static determinerStatut(pourcentageEcart) {
    if (pourcentageEcart < 25) {
      return 'conforme';
    } else if (pourcentageEcart <= 50) {
      return 'alerte';
    } else {
      return 'critique';
    }
  }

  // Calcul de la somme recoupée
  static calculerSommeRecoupee(data) {
    const {
      merchandise_sold = 0,
      goods_purchased = 0,
      services_purchased = 0,
      third_party_payments = 0,
      local_products = 0,
      import_expenses = 0
    } = data;
    
    return merchandise_sold + goods_purchased + services_purchased +
           third_party_payments + local_products + import_expenses;
  }

  // Vérifier la cohérence des recoupements
  static verifierRecoupement(sommeRecoupee, caDeclare) {
    if (sommeRecoupee === 0) return { valide: true, message: 'Aucune donnée de recoupement' };
    
    const ratio = caDeclare / sommeRecoupee;
    
    if (ratio >= 0.5 && ratio <= 1.5) {
      return { valide: true, message: 'Données cohérentes' };
    } else if (ratio < 0.5) {
      return { valide: false, message: 'CA déclaré inférieur aux recoupements' };
    } else {
      return { valide: false, message: 'CA déclaré supérieur aux recoupements' };
    }
  }
}

module.exports = FiscalService;