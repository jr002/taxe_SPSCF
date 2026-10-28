/**
 * Point d'entrée du domaine : seules les pages branchées sur une route sortent
 * du domaine. Composants, hooks et utilitaires internes s'importent par leur
 * chemin, pour que le barrel ne boucle jamais sur ses propres fichiers.
 */
export { default as AdminHistorique } from '@/backofficeadmin/historique/pages/AdminHistorique';
