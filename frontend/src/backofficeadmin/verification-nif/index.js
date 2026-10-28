/**
 * Point d'entrée du domaine : seules les pages branchées sur une route sortent
 * du domaine. Composants, hooks et utilitaires internes s'importent par leur
 * chemin, pour que le barrel ne boucle jamais sur ses propres fichiers.
 */
export { default as AdminVerificationNIF } from '@/backofficeadmin/verification-nif/pages/AdminVerificationNIF';
export { default as VerificationNifSql } from '@/backofficeadmin/verification-nif/pages/VerificationNifSql';
export { default as VerificationNifExcel } from '@/backofficeadmin/verification-nif/pages/VerificationNifExcel';
export { default as VerificationNifJson } from '@/backofficeadmin/verification-nif/pages/VerificationNifJson';
