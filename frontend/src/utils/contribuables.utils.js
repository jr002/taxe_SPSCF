/**
 * Utilitaires pour le traitement et le regroupement des contribuables
 */

/**
 * Génère une clé unique pour identifier un contribuable
 * @param {Object} declaration
 * @returns {string}
 */
export const getContribuableKey = (declaration) => String(
  declaration.id_entreprise || declaration.nif || declaration.raison_sociale || 'inconnu'
);

/**
 * Regroupe les déclarations par contribuable avec historique trié par année décroissante
 * @param {Array} declarations - Liste brute des déclarations
 * @returns {Array} Liste des contribuables avec leurs déclarations groupées
 */
export const getContribuables = (declarations = []) => {
  const contribuablesMap = new Map();

  declarations.forEach((declaration) => {
    const key = getContribuableKey(declaration);
    const current = contribuablesMap.get(key);

    if (!current) {
      contribuablesMap.set(key, {
        key,
        id_entreprise: declaration.id_entreprise,
        nif: declaration.nif,
        raison_sociale: declaration.raison_sociale,
        secteur_activite: declaration.secteur_activite,
        declarations: [declaration],
      });
      return;
    }

    current.declarations.push(declaration);
    // Conserver les informations les plus récentes
    if (Number(declaration.annee) > Number(current.declarations[0].annee)) {
      current.nif = declaration.nif || current.nif;
      current.raison_sociale = declaration.raison_sociale || current.raison_sociale;
      current.secteur_activite = declaration.secteur_activite || current.secteur_activite;
    }
  });

  return [...contribuablesMap.values()].map((contribuable) => ({
    ...contribuable,
    declarations: contribuable.declarations.sort(
      (a, b) => Number(b.annee) - Number(a.annee)
    ),
  }));
};
