/**
 * Point d'entrée du domaine « accueil ».
 *
 * Un barrel ne ré-exporte que les pages branchées sur une route. Les composants,
 * hooks et utilitaires du domaine restent importés par leur chemin : la porte
 * d'entrée d'un domaine ne doit pas boucler sur ses propres fichiers internes.
 */
export { default as Accueil } from '@/frontofficeagent/accueil/pages/Accueil';
