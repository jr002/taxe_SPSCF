/**
 * Point d'entrée du domaine : seules les pages branchées sur une route sortent
 * du domaine. Composants, hooks et utilitaires internes s'importent par leur
 * chemin, pour que le barrel ne boucle jamais sur ses propres fichiers.
 */
export { default as Signin } from '@/backofficeadmin/auth/pages/Signin';
export { default as Signup } from '@/backofficeadmin/auth/pages/Signup';
export { default as AttenteActivation } from '@/backofficeadmin/auth/pages/AttenteActivation';
export { default as MotDePasseOublie } from '@/backofficeadmin/auth/pages/MotDePasseOublie';
