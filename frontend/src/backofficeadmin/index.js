/**
 * Porte d'entrée de l'espace d'administration, réservée au rôle `admin`. Même
 * règle que pour le front-office : un domaine, une porte ; ce fichier les cumule.
 */
export * from '@/backofficeadmin/auth';
export * from '@/backofficeadmin/dashboard';
export * from '@/backofficeadmin/historique';
export * from '@/backofficeadmin/roles';
export * from '@/backofficeadmin/utilisateurs';
export * from '@/backofficeadmin/verification-nif';
