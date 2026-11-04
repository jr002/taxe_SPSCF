/**
 * Règles de calcul fiscal partagées entre plusieurs domaines.
 *
 * Ces seuils ne sont pas un réglage d'affichage : ils doivent rester alignés sur
 * `FiscalService.determinerStatut` côté backend, car la mise à jour d'une
 * déclaration (`PUT /api/declarations/:id`) ne recalcule pas le statut du dossier.
 * Un écran qui écrit des montants sans recaler le statut laisserait donc un
 * dossier « conforme » avec un écart de 80 %.
 */

/** Écart en deçà duquel le dossier reste « conforme ». */
export const SEUIL_CONFORMITE = 25;

/** Écart au-delà duquel le dossier passe en « critique ». */
export const SEUIL_CRITIQUE = 50;

/**
 * Statut de contrôle d'une déclaration à partir de la TVA théorique attendue et
 * de la TVA réellement payée. Une théorique à zéro ou absente ne peut pas faire
 * un écart : le statut reste « conforme ».
 */
export const statutSelonEcart = (tvaTheorique, tvaPayee) => {
  const theorie = Number(tvaTheorique) || 0;
  if (theorie <= 0) return 'conforme';
  const pourcentage = ((theorie - (Number(tvaPayee) || 0)) / theorie) * 100;
  if (pourcentage < SEUIL_CONFORMITE) return 'conforme';
  if (pourcentage <= SEUIL_CRITIQUE) return 'alerte';
  return 'critique';
};
