import { toNumber } from '@/utils';

/**
 * Conformité recoupée : l'état d'un dossier déduit des rapprochements enregistrés
 * par la confrontation, jamais du statut déclaratif saisi au suivi fiscal. Un
 * dossier sans confrontation active n'est pas « conforme » par défaut : il est
 * « non recoupé ». Les libellés et niveaux reprennent la charte des statuts.
 */
export const ETATS_CONFORMITE_RECOUPEE = {
  non_recoupe: { label: 'Non recoupé', niveau: 'inconnu', badge: 'cfb cfb-x', mark: '—' },
  a_verifier: { label: 'À vérifier', niveau: 'alerte', badge: 'cfb cfb-o', mark: '!' },
  en_ecart: { label: 'En écart', niveau: 'critique', badge: 'cfb cfb-r', mark: '!' },
  conforme: { label: 'Conforme (recoupé)', niveau: 'conforme', badge: 'cfb cfb-g', mark: '✓' },
};

/**
 * Lit un objet de statistiques de rapprochement (forme de `getRapprochementStats`
 * ou de l'agrégation ci-dessous) et rend la conformité recoupée et l'écart général.
 * L'écart général est `CA déclaré confronté − montant recoupé TTC` : positif, le
 * déclaré dépasse le recoupé ; négatif, le recoupé dépasse le déclaré.
 */
export function conformiteRecoupee(stats) {
  const total = toNumber(stats?.total);
  const actifs = toNumber(stats?.actifs);
  const enEcart = toNumber(stats?.ecart);
  const aVerifier = toNumber(stats?.a_verifier);

  let etat = 'non_recoupe';
  if (actifs > 0) {
    if (enEcart > 0) etat = 'en_ecart';
    else if (aVerifier > 0) etat = 'a_verifier';
    else etat = 'conforme';
  }

  return {
    etat,
    ...ETATS_CONFORMITE_RECOUPEE[etat],
    total,
    actifs,
    nbEcarts: enEcart + aVerifier,
    ecartTotal: toNumber(stats?.ecart_total),
    caDeclare: toNumber(stats?.montant_declare_total),
    recoupe: toNumber(stats?.montant_recoupe_total),
    declarationsConfrontees: toNumber(stats?.declarations),
    recoupementsConfrontes: toNumber(stats?.recoupements),
  };
}

const STATUTS_ACTIFS = ['rapproche', 'a_verifier', 'ecart', 'valide'];

/**
 * Agrège les lignes de rapprochement par contribuable, en miroir de
 * `RapprochementModel.getStats` : les totaux de montants ne portent que sur les
 * lignes actives (statut hors « rejete » / « annule »), les déclarations et
 * recoupements confrontés sont comptés distincts. Le rattachement au contribuable
 * vient de la déclaration rapprochée ; une ligne sans déclaration exploitable est
 * ignorée plutôt que rattachée arbitrairement.
 *
 * Rend une `Map` indexée par `String(id_contribuable)`, prête pour la liste.
 */
export function aggregateRapprochementsParContribuable(rows) {
  const accumulateurs = new Map();

  for (const row of rows || []) {
    const id = row?.declarations?.contribuables?.id_contribuable;
    if (id === null || id === undefined) continue;
    const cle = String(id);

    let acc = accumulateurs.get(cle);
    if (!acc) {
      acc = {
        total: 0,
        actifs: 0,
        rapproche: 0,
        a_verifier: 0,
        ecart: 0,
        valide: 0,
        rejete: 0,
        annule: 0,
        ecart_total: 0,
        montant_declare_total: 0,
        montant_recoupe_total: 0,
        declarations: new Set(),
        recoupements: new Set(),
      };
      accumulateurs.set(cle, acc);
    }

    const statut = String(row?.statut || '');
    acc.total += 1;
    if (statut === 'rejete' || statut === 'annule') {
      acc[statut] += 1;
    } else {
      acc.actifs += 1;
      if (STATUTS_ACTIFS.includes(statut)) acc[statut] += 1;
      acc.ecart_total += toNumber(row?.ecart);
      acc.montant_declare_total += toNumber(row?.montant_declare);
      acc.montant_recoupe_total += toNumber(row?.montant_recoupe);
    }

    if (row?.id_declaration !== null && row?.id_declaration !== undefined) {
      acc.declarations.add(row.id_declaration);
    }
    if (row?.id_recoupement !== null && row?.id_recoupement !== undefined) {
      acc.recoupements.add(row.id_recoupement);
    }
  }

  const resultat = new Map();
  for (const [cle, acc] of accumulateurs) {
    resultat.set(cle, {
      ...acc,
      declarations: acc.declarations.size,
      recoupements: acc.recoupements.size,
    });
  }
  return resultat;
}

/**
 * Synthèse globale du portefeuille à partir des agrégats par contribuable :
 * répartition des états de conformité recoupée et écart général cumulé. Sert la
 * vue Statistique sans recalculer ce que le moteur a déjà enregistré.
 */
export function syntheseConformitePortefeuille(contribuables, parContribuable) {
  const repartition = { conforme: 0, a_verifier: 0, en_ecart: 0, non_recoupe: 0 };
  let ecartTotal = 0;
  let caDeclare = 0;
  let recoupe = 0;
  let confrontes = 0;

  for (const contribuable of contribuables || []) {
    const stats = parContribuable?.get(String(contribuable.key ?? contribuable.id_contribuable));
    const conformite = conformiteRecoupee(stats);
    repartition[conformite.etat] += 1;
    if (conformite.etat !== 'non_recoupe') {
      confrontes += 1;
      ecartTotal += conformite.ecartTotal;
      caDeclare += conformite.caDeclare;
      recoupe += conformite.recoupe;
    }
  }

  return { repartition, ecartTotal, caDeclare, recoupe, confrontes, total: (contribuables || []).length };
}