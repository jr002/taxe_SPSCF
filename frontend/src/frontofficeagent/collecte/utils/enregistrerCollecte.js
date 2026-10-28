/**
 * Enregistrement en base des collectes du module /collecte.
 *
 * Les quatre formulaires partagent le même point d'entrée : le contribuable est
 * résolu depuis son NIF (le registre reste la source d'autorité — aucune fiche
 * n'est créée ici), puis la collecte alimente soit `declarations`, soit
 * `recoupements`.
 *
 * Une collecte renouvelée pour le même NIF et la même année met à jour la
 * déclaration existante plutôt que d'empiler des lignes en double.
 */
import {
  createDeclaration,
  createRecoupement,
  getContribuableByNif,
  getDeclarations,
  updateDeclaration,
} from '@/api/api';

/**
 * Seuils d'écart de la DGI (< 25 % conforme, ≤ 50 % alerte, au-delà critique).
 * Doit rester aligné sur `FiscalService.determinerStatut` côté backend : la
 * mise à jour d'une déclaration ne recalcule pas le statut côté serveur.
 */
const statutSelonEcart = (tvaTheorique, tvaPayee) => {
  const theorie = Number(tvaTheorique) || 0;
  if (theorie <= 0) return 'conforme';
  const pourcentage = ((theorie - (Number(tvaPayee) || 0)) / theorie) * 100;
  if (pourcentage < 25) return 'conforme';
  if (pourcentage <= 50) return 'alerte';
  return 'critique';
};

async function enregistrerDeclaration(collecte, contribuable) {
  const annee = Number(collecte.annee);

  const resultatListe = await getDeclarations({
    search: collecte.nif,
    annee,
    type_declaration: 'TVA',
    limit: 10,
  });
  const existante = (resultatListe?.data || []).find(
    (declaration) => declaration.id_contribuable === contribuable.id_contribuable
  );

  if (existante) {
    // `PUT /declarations/:id` ne recalcule pas le statut : on le dérive des valeurs
    // qui seront réellement stockées (les champs non collectés restent ceux de la ligne).
    const statut = statutSelonEcart(
      collecte.valeurs.tva_theorique ?? existante.tva_theorique,
      collecte.valeurs.tva_payee ?? existante.tva_payee
    );
    await updateDeclaration(existante.id_declaration, { ...collecte.valeurs, statut });
    return {
      message: `${collecte.intitule} de ${contribuable.raison_sociale} (${annee}) mise à jour — statut : ${statut}.`,
    };
  }

  const resultat = await createDeclaration({
    id_contribuable: contribuable.id_contribuable,
    annee,
    type_declaration: 'TVA',
    periode: String(annee),
    ...collecte.valeurs,
  });
  // `POST /declarations` renvoie son propre diagnostic : c'est le statut réellement enregistré.
  const statut = resultat?.analyse?.statut;
  return {
    message: `${collecte.intitule} de ${contribuable.raison_sociale} (${annee}) enregistré${
      statut ? ` — statut : ${statut}` : ''
    }.`,
  };
}

/**
 * @param {object} collecte
 * @param {'declarations'|'recoupements'} collecte.table
 * @param {string} collecte.nif      NIF saisi dans le bloc identification
 * @param {string|number} collecte.annee
 * @param {string} collecte.intitule libellé affiché dans le message de confirmation
 * @param {object} collecte.valeurs  colonnes cibles (déjà numériques)
 * @returns {Promise<{message: string}>}
 */
export async function enregistrerCollecte({ table, nif, annee, intitule, valeurs }) {
  const contribuable = await getContribuableByNif(String(nif).trim());
  if (!contribuable) {
    throw new Error(
      `Aucun contribuable du registre ne correspond au NIF ${String(nif).trim()}. ` +
        "Inscrivez-le d'abord via « + Ajouter un contribuable »."
    );
  }

  if (table === 'recoupements') {
    await createRecoupement({
      id_contribuable: contribuable.id_contribuable,
      source: 'tiers_declarant',
      periode: String(Number(annee)),
      ...valeurs,
    });
    return { message: `Recoupement de ${contribuable.raison_sociale} (${annee}) enregistré.` };
  }

  return enregistrerDeclaration({ nif, annee, intitule, valeurs }, contribuable);
}
