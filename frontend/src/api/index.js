/**
 * Point d'entrée du dossier `api/` : les écrans importent `@/api` et seulement les
 * fonctions du domaine qui les concerne.
 *
 * L'instance HTTP brute n'est pas ré-exportée ici : elle se lit dans
 * `@/api/client`, pour qu'un appel ponctuel reste visible plutôt que de se fondre
 * dans un client global.
 */
export * from '@/api/erreurs';
export * from '@/api/auth';
export * from '@/api/contribuables';
export * from '@/api/declarations';
export * from '@/api/controles';
export * from '@/api/procedure-contradictoire';
export * from '@/api/recoupements';
export * from '@/api/droits-communication';
export * from '@/api/rapprochements';
export * from '@/api/etats-contribuable';
export * from '@/api/relances';
export * from '@/api/centres';
export * from '@/api/agents';
export * from '@/api/acces-contribuable';
