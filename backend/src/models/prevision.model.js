const prisma = require('../config/prisma');

/**
 * Prévisions de recette d'un centre : une ligne par année civile, saisie par le
 * chef de centre. Les recettes réelles face à la prévision sont la TVA payée
 * enregistrée sur les déclarations des contribuables rattachés au centre.
 */
class PrevisionModel {
  static listeParCentre(id_centre) {
    return prisma.previsions.findMany({
      where: { id_centre },
      orderBy: { annee: 'desc' },
      include: { agents: { select: { nom: true, prenom: true } } },
    });
  }

  static trouve(id_prevision) {
    return prisma.previsions.findUnique({ where: { id_prevision } });
  }

  static trouveParCentreEtAnnee(id_centre, annee) {
    return prisma.previsions.findUnique({
      where: { id_centre_annee: { id_centre, annee } },
    });
  }

  static creer(donnees) {
    return prisma.previsions.create({ data: donnees });
  }

  static modifier(id_prevision, donnees) {
    return prisma.previsions.update({
      where: { id_prevision },
      data: { ...donnees, date_modification: new Date() },
    });
  }

  static supprimer(id_prevision) {
    return prisma.previsions.delete({ where: { id_prevision } });
  }

  static async recettesAnnuelles(id_centre, annees) {
    const lignes = await prisma.declarations.groupBy({
      by: ['annee'],
      where: { annee: { in: annees }, contribuables: { id_centre } },
      _sum: { tva_payee: true },
    });
    const recettes = {};
    for (const annee of annees) recettes[annee] = 0;
    for (const ligne of lignes) recettes[ligne.annee] = Number(ligne._sum.tva_payee || 0);
    return recettes;
  }
}

module.exports = PrevisionModel;