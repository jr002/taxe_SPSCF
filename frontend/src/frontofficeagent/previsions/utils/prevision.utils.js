/**
 * Lecture partagée des prévisions de recette : l'état compare la recette réelle
 * du centre à la prévision, proratisée au rythme de l'année pour l'exercice en
 * cours. Aucune valeur n'est inventée : sans prévision saisie, l'état le dit.
 */
import { toNumber } from '@/utils';

export const moisLibelle = (moisEcoules) =>
  new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(new Date(2000, Math.max(moisEcoules - 1, 0), 1));

export const prevuDe = (previsions, annee) =>
  toNumber(previsions?.find((p) => p.annee === annee)?.montant_prevu);

export function etatPrevision({ prevu, recette, annee, anneeCourante, moisEcoules }) {
  if (!(prevu > 0)) {
    return { code: 'non_renseignee', label: 'Prévision non renseignée', badge: 'cfb cfb-x', niveau: 'inconnu' };
  }
  if (recette >= prevu) {
    return { code: 'atteint', label: 'Objectif atteint', badge: 'cfb cfb-g', niveau: 'conforme' };
  }
  if (annee !== anneeCourante) {
    return { code: 'non_atteint', label: 'Objectif non atteint', badge: 'cfb cfb-r', niveau: 'critique' };
  }
  const attendu = prevu * (moisEcoules / 12);
  if (recette >= attendu) {
    return { code: 'dans_les_temps', label: 'Dans les temps', badge: 'cfb cfb-b', niveau: 'procedure' };
  }
  return { code: 'en_retard', label: 'En retard sur le rythme', badge: 'cfb cfb-o', niveau: 'alerte' };
}

export const tauxRealisation = (prevu, recette) => (prevu > 0 ? Math.round((recette / prevu) * 100) : null);