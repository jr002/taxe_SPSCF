# Utilitaires backend

Fonctions techniques communes, indépendantes d'une route ou d'un domaine métier.

- [`data-scope.js`](data-scope.js) : source unique du **périmètre de données**
  d'un agent — ce que son rôle et son centre de rattachement autorisent à lire
  ou à écrire. Sept rôles (`admin`, `inspecteur`, `chef_centre`, `controleur`,
  `agent`, `contribuable`, `autre`) et trois kinds : `all` (tous les centres :
  `admin`, `inspecteur`), `centre` (`chef_centre`, `controleur`, `agent`, sur
  `agents.id_centre`) et `none` (`contribuable`, `autre`, ainsi qu'un rôle centré
  sans rattachement — sans centre connu, aucune donnée n'est autorisée). Le scope
  porte aussi `canWrite`, qui distingue lire et écrire : les rôles nationaux en
  écriture sont `admin` (`ALL_CENTRE_ROLES` moins `READ_ONLY_ROLES`), l'`inspecteur`
  (`READ_ONLY_ROLES`) voit tout sans pouvoir rien poser. Exports :
  `resolveScope(user)` (appelé par [`../middlewares/auth.middleware.js`](../middlewares/auth.middleware.js),
  résultat rangé dans `req.dataScope`), `applyScope(where, scope, { relation })` et
  `applyScopeViaRelations(where, scope, paths)` qui empilent le filtre dans
  `where.AND` sans jamais écraser un filtre déjà posé par un modèle (les blocs de
  recherche textuelle, notamment), `contribuableIsReadable(scope, contribuable)` et
  `forceCentreOnWrite(scope, data)` pour verrouiller le centre d'une écriture, et
  `ROLE_LABELS`, `roleLabel(role)`, `scopeDeniedMessage(scope)`,
  `writeDeniedMessage(scope)` pour les messages de refus affichés à l'agent.
- [`unite-fiscale.utils.js`](unite-fiscale.utils.js) : lit `unitefiscal.json` à la
  racine du dépôt et exporte `isValidCentreFiscalRef(reference)`, utilisé par la
  validation des contribuables pour n'accepter que des références de centres
  existantes. `centreFiscalRefFromCentre(centre)` construit cette référence
  (`cle:nom`) depuis une ligne de la table `centres`, d'après la correspondance
  interne `Centre Fiscal` → `centres_fiscaux`, `SRE` → `sre`, `DGE` → `dge` ;
  elle renvoie `null` quand le centre n'a pas d'équivalent dans le référentiel.
  `splitCentreFiscalRef(reference)` découpe une référence et
  `TYPE_CENTRE_PAR_CLE_UNITE` fait le chemin inverse — les deux servent au modèle
  contribuable pour tenir `id_centre` et `centre_fiscal_ref` alignés.
