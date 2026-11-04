/**
 * Porte d'entrée du domaine « aide » : le vocabulaire partagé des écrans
 * contribuable du front-office — registre des termes, aides par écran, survol,
 * bouton et modale. Les domaines `contribuables` et `confrontation` l'importent
 * par chemin `@/frontofficeagent/aide/...`, comme tous les domaines entre eux.
 */
export { default as AideTerme } from '@/frontofficeagent/aide/components/AideTerme';
export { default as AideLectureModal } from '@/frontofficeagent/aide/components/AideLectureModal';
export { default as BoutonAide } from '@/frontofficeagent/aide/components/BoutonAide';
export { TERMES, AIDES, terme, aideEcran } from '@/frontofficeagent/aide/data/aideAgent.data.js';
