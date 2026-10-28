/**
 * Point d'entrée du dossier `api/` : les écrans importent `@/api` et seulement les
 * fonctions du domaine qui les concerne.
 *
 * L'instance HTTP brute n'est pas ré-exportée ici : elle se lit dans
 * `@/api/client`, pour qu'un appel ponctuel reste visible plutôt que de se fondre
 * dans un client global.
 */
export * from './erreurs';
export * from './auth';
export * from './contribuables';
export * from './declarations';
export * from './controles';
export * from './procedure-contradictoire';
export * from './recoupements';
export * from './droits-communication';
export * from './rapprochements';
export * from './etats-contribuable';
export * from './relances';
export * from './centres';
export * from './agents';
export * from './acces-contribuable';
