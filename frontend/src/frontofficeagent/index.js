/**
 * Porte d'entrée de l'espace front-office : chaque domaine fonctionnel expose sa
 * propre porte, ce fichier les additionne. `App.jsx` n'a donc qu'un seul chemin
 * à connaître pour brancher les routes, et un domaine peut être retiré de
 * l'espace en supprimant sa ligne ici.
 */
export * from '@/frontofficeagent/accueil';
export * from '@/frontofficeagent/centres';
export * from '@/frontofficeagent/collecte';
export * from '@/frontofficeagent/confrontation';
export * from '@/frontofficeagent/contribuables';
export * from '@/frontofficeagent/decisionnel';
export * from '@/frontofficeagent/entreprises';
export * from '@/frontofficeagent/relance';
export * from '@/frontofficeagent/suivi-fiscal';
