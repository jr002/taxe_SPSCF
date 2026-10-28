/**
 * Référentiel institutionnel des unités fiscales (pays, SRE, centres, unités
 * opérationnelles).
 *
 * Le JSON vit à la racine du dépôt parce que le backend le lit aussi
 * (`backend/src/utils/unite-fiscale.utils.js`) : ce module est le seul endroit du
 * frontend à remonter hors de `src/`, les domaines importent `@/data/referentiel-unites`.
 */
import referentielUnites from '../../../unitefiscal.json';

export default referentielUnites;
