# Espace contribuable (`/src/accountcontribuable`)

Dossier de l'espace consulté **par le contribuable lui-même**, en lecture seule
et hors session agent. Il s'ouvre par un lien spécial émis depuis la fiche d'un
contribuable du front-office agent, et se compose de deux vues : « Ma situation
fiscale » (les données du dossier) et « Aide & repères légaux » (la lecture de
l'écran et les textes appliqués par le système).

## 1. Parcour complet

1. Un agent, contrôleur, inspecteur ou chef de centre ouvre
   [`../frontofficeagent/contribuables/pages/ContribuableDetail.jsx`](../frontofficeagent/contribuables/pages/ContribuableDetail.jsx)
   et clique « Lien contribuable » (bouton `secondary` de
   [`../frontofficeagent/contribuables/components/ContribuableHeader.jsx`](../frontofficeagent/contribuables/components/ContribuableHeader.jsx)).
2. [`../frontofficeagent/contribuables/components/LienAccesModal.jsx`](../frontofficeagent/contribuables/components/LienAccesModal.jsx)
   appelle `POST /api/contribuables/:id/acces-contribuable` (`admin`, `chef_centre`,
   `inspecteur`, `controleur`, `agent` ; un compte `contribuable` ou `autre` reçoit `403`).
   La modale affiche l'URL complète, la date d'expiration et l'e-mail masqué du
   dossier, et avertit que la réémission révoque les liens précédents.
3. Le contribuable reçoit l'URL `/espace-contribuable/<jeton>` et l'ouvre dans
   son navigateur. `App.jsx` reconnaît le préfixe `/espace-contribuable/` et
   n'appelle alors **aucun** `GET /api/auth/me` : la page est rendue hors layout,
   sans `Header` ni navigation agent.
4. `EspaceContribuable` demande `GET /api/acces-contribuable/:token` (statut du
   lien) puis, après saisie du **NIF** et de l'**e-mail enregistrés dans le
   dossier**, `POST /api/acces-contribuable/:token/ouvrir`. Seule cette seconde
   réponse contient les données fiscales.
5. De là, le contribuable bascule entre les deux vues sans jamais quitter l'URL
   du lien : `ouvrirAide(section)` monte `AideContribuable`, `retourDossier()`
   remonte `SituationFiscale`. L'aide est aussi accessible **avant** vérification
   (bouton sous le formulaire d'identité) et **sans lien valide** (bouton sur
   l'écran « Lien indisponible ») : elle n'affiche aucune donnée de dossier,
   seulement les clés de lecture, et ne consomme donc aucune tentative.

## 2. Écrans et modules

| Fichier | Rôle |
| --- | --- |
| [`pages/EspaceContribuable.jsx`](pages/EspaceContribuable.jsx) | lit le jeton depuis l'URL, affiche l'en-tête DGI, le thème, les trois états du lien (vérification, indisponible, formulaire d'identité), puis **bascule** entre `SituationFiscale` et `AideContribuable` (`useState('dossier' \| 'aide')`, `useState(section)`) |
| [`components/SituationFiscale.jsx`](components/SituationFiscale.jsx) | dossier complet en lecture seule, avec la confrontation détaillée en § 3 |
| [`components/AideContribuable.jsx`](components/AideContribuable.jsx) | page d'aide : neuf rubriques ancres, sommaire, glossaire des statuts, sources légales en pied de page |
| [`components/LegendeStatuts.jsx`](components/LegendeStatuts.jsx) | rend une légende « badge + explication » à partir d'entrées `{ label, badge, sens }`, en dédoublonnant par libellé ; retourne `null` si rien à dire |
| [`components/LienAide.jsx`](components/LienAide.jsx) | bouton de renvoi vers une rubrique de l'aide (`portail-aide-lien`), muet si `onOuvrirAide` est absent |
| [`components/Infobulle.jsx`](components/Infobulle.jsx) | explication au survol d'un terme : bouton porteur de `aria-describedby`, infobulle rendue par CSS |
| [`components/RegleFiscale.jsx`](components/RegleFiscale.jsx) | assemble les deux au-dessus autour d'une règle énoncée dans le dossier ; variante `compact` pour les cellules étroites |
| [`data/statuts.data.js`](data/statuts.data.js) | **référentiels de libellés et de sens** pour tous les statuts rencontrés dans le portail |
| [`data/regles.data.js`](data/regles.data.js) | **registre des règles** énoncées dans le portail : forme courte du survol + rubrique d'aide visée + `source` (identifiant de l'article dans [`../data/textesFiscaux.data.js`](../data/textesFiscaux.data.js)) pour une même entrée |
| [`data/aide.data.js`](data/aide.data.js) | **contenu de l'aide** : rubriques, montants expliqués, étapes de procédure, délais, catégories, sécurité du lien, questions fréquentes, sources |
| [`utils/portail.utils.js`](utils/portail.utils.js) | `formatDate` (jj/mm/aaaa) et `formatDateLongue` (« 4 novembre 2026 »), tolérants aux dates absentes ou invalides |

### Règle de source unique

Un libellé de statut et son explication ne sont écrits **qu'une fois**, dans
`data/statuts.data.js`. Les tableaux du dossier, les notes sous chaque cellule,
les légendes et le glossaire de l'aide lisent le même objet par l'intermédiaire
des sélecteurs `statutDeclaration`, `statutRapprochement`, `statutDroit`,
`typeRapprochement`, `typeRelance`, `statutRelance`. Un statut inconnu du
référentiel n'est jamais vide : le sélecteur retombe sur
`libelleBrut(value)` (underscores remplacés par des espaces) sans badge ni
explication, ce qui rend le défaut visible plutôt que silencieux.

Les clés sont écrites **sans accent et en minuscules** (`primitive_envoyee`),
comme en base ; les variantes accentuées utilisées côté agent
(`primitive_envoyée`) sont déclarées en alias, avec le même libellé : la légende
déduplique par libellé pour ne pas afficher deux fois la même ligne.

Pour ajouter un statut : l'ajouter au référentiel concerné de
`statuts.data.js` avec son `sens` en langage courant, et le mentionner dans la
section « Glossaire » de l'aide si le référentiel y est exposé — le glossaire est
construit à partir de ces mêmes objets, il suit donc automatiquement.

### Registre des règles : survol et renvoi

Toute règle énoncée dans le portail (« l’amende de 40 % », « jours francs »,
« tolérance de rapprochement »…) est inscrite dans `data/regles.data.js` sous un
`id`, avec quatre champs : `regle` (forme courte affichée au survol), `section`
(l’ancre de l’aide à ouvrir), `ref` (mention légale, optionnelle) et `aussi`
(renvois croisés vers d’autres règles du registre, optionnel). Le couple
survol + renvoi ne peut donc pas diverger : les deux viennent de la même entrée.

`RegleFiscale` est le seul composant posé dans le dossier. Version courante
(KPI, en-têtes de colonne, paragraphes d’introduction, note de pied de page) ou
`compact` (cellules et listes, où seul le mot « règle » tient, précédé d’un
`.sr-only` « Ouvrir la règle dans l’aide — » pour les lecteurs d’écran) ; une
`id` absente du registre rend le texte sans artifice, rien ne disparaît. Le
survol est en réalité un bouton : il s’ouvre aussi au focus clavier
(`:focus-within`) et au tap (bascule `.ouvert`) ; il se referme par `Escape` —
qui retire aussi le focus, pour que `:focus-within` ne le rouvre pas — ou dès
que le bouton perd le focus. L’infobulle reste
dans l’arbre d’accessibilité (`opacity: 0`, jamais `visibility: hidden`) : un
lecteur d’écran la lit via `aria-describedby` même fermée.

Côté aide, le registre sert dans l’autre sens. `Terme` (un `Infobulle` sans
renvoi — le lecteur y est déjà) explique les valeurs chiffrées des rubriques, et
`RenvoisSection` calcule automatiquement, en pied de rubrique, les renvois vers
les règles dont le champ `aussi` cite cette rubrique ; les questions fréquentes
portent de même un `RenvoiRegle` quand leur `regleId` pointe une règle. Les
entrées de `aide.data.js` (`MONTANTS_EXPLIQUES`, `PROCEDURE_ETAPES`, `RELANCES`,
`PENALITES`, `SECURITE_LIEN`, `QUESTIONS`) portent donc un `regleId` optionnel
qui les raccroche au registre.

Pour énoncer une nouvelle règle dans le dossier : l’ajouter au registre avec sa
forme courte, son ancre et — quand un texte officiel la prévoit — sa `source`
parmi les clés de `../data/textesFiscaux.data.js`, puis l’entourer de
`<RegleFiscale>` ; rien d’autre, l’aide, ses renvois et la puce de référence
suivent. Une règle que l’application s’invente à elle-même (écart de
rapprochement, tolérance, jours francs des relances) reste **sans `source`** :
aucun lien n’est rendu, et l’aide le dit.

### Référentiels et énumérations serveur

| Référentiel frontend | Source serveur |
| --- | --- |
| `STATUT_DECLARATION` | `STATUTS_DECLARATION` de [`../../../backend/src/models/declaration.model.js`](../../../backend/src/models/declaration.model.js) |
| `STATUT_RAPPROCHEMENT` | `STATUTS_RAPPROCHEMENT` de [`../../../backend/src/models/rapprochement.model.js`](../../../backend/src/models/rapprochement.model.js) |
| `STATUT_DROIT` | `STATUTS` de [`../../../backend/src/models/droit-communication.model.js`](../../../backend/src/models/droit-communication.model.js) |
| `TYPE_RELANCE`, `STATUT_RELANCE` | `TYPE_RELANCE` et le suivi des `relances` côté front-office agent ([`../frontofficeagent/relance/utils/relance.utils.js`](../frontofficeagent/relance/utils/relance.utils.js)) |

### Compteur de tentatives du formulaire d'identité

`POST /api/acces-contribuable/:token/ouvrir` renvoie, avec son `403`, le champ
`tentatives_restantes` lu par le serveur sur le limiteur encore ouvert (8 tentatives
par lien et IP). `EspaceContribuable` l'affiche sous le message d'erreur, dans un
paragraphe `.procedure-note` en `role="status"`, à partir de **trois** tentatives
restantes : « Il vous reste N tentatives avant le blocage temporaire de ce lien. »,
puis, à zéro, le blocage est annoncé avec la conduite à tenir. Le `429` n'est pas
doublé : le message du serveur, qui énonce déjà le délai d'attente en minutes,
tient lieu d'avertissement et le paragraphe de compteur reste vide. Une ouverture
réussie réinitialise les compteurs côté serveur, donc le contribuable qui trouve le
bon couple n'est jamais bloqué.

## 3. La confrontation, pensée pour un non-spécialiste

`SituationFiscale` présente, dans cet ordre :

- l'identité du dossier (raison sociale, NIF, centre gestionnaire, situation
  d'activité, conformité enregistrée) ; un dossier sans état enregistré porte
  « Aucun statut enregistré » sur un badge neutre (`.badge.absent`) — le serveur
  renvoie `statut_activite: null` et `situation: null` au lieu de substitutions
  favorables, et l'absence ne se lit ni comme une conformité accordée, ni comme
  un contrôle achevé ;
- un pavé d'aide à la lecture (« Comment lire cette page ») qui renvoie à l'aide ;
- le **tableau de bord des taxes** : TVA payée cumulée, TVA théorique attendue,
  écart constaté et nombre de déclarations sans écart, plus un histogramme TVA
  payée / théorique par exercice (6 derniers) ;
- **pénalités, échéances et conseils** : conseils calculés depuis le dossier
  (écart cumulé, réponse attendue à une notification primitive, net restant à
  payer d'une notification définitive, relances en cours, rapprochements à
  vérifier), encart « À retenir sur les pénalités » (amende de 40 % exigible
  seulement après la notification définitive), tableau des notifications et
  détail replié des relances ;
- l'**historique des déclarations TVA** ;
- les **droits de communication** ;
- les **recoupements** ;
- le **rapprochement et la confrontation** (voir ci-dessous) ;
- un pied de page rappelant la date de fin de validité du lien.

Chaque titre de section est posé dans un `.portail-section-titre` accompagné d'un
`LienAide` : le contribuable peut, à partir de la ligne qu'il ne comprend pas,
ouvrir l'aide **sur la rubrique correspondante** (`montants`, `procedure`,
`confrontation`, `delais`). À l'intérieur des sections, chaque règle énoncée
(portail, KPI, en-têtes de colonnes, conseils, notes) porte son propre couple
survol + renvoi via `RegleFiscale` — voir § 2.

Trois choix rendent la section de confrontation lisible :

1. **Une synthèse en quatre chiffres** (`.portail-confront-kpis`) : lignes
   rapprochées, lignes « à vous expliquer », lignes concordantes, somme des
   écarts — les écarts négatifs venant en déduction, ce que l'intitulé dit.
2. **Une phrase de lecture** pour la ligne qui demande attention
   (`.portail-confront-focus`) : `lectureRapprochement()` écrit les deux montants
   et l'écart en toutes lettres, choisis par `lignePrioritaire` (plus grand écart
   absolu), suivis du sens du statut.
3. **Un tri, pas un empilement** : `lignesALire` (statut `a_verifier` ou `ecart`,
   ou écart non nul) est seule affichée ; les lignes concordantes passent dans un
   `details.procedure-more`. Les deux ensembles sont disjoints (`idsALire`), donc
   une ligne n'apparaît jamais deux fois.

Dans le tableau, chaque cellule sensible porte une
`.portail-ligne-note` en langage courant : le type de rapprochement (« une partie
seulement des montants correspond »), le sens de l'écart (l'`ecart` serveur étant
`montant_declare − montant_recoupe`, un écart positif veut dire « vous avez
déclaré plus que le montant recoupé ») et le statut, avec son explication. Une
légende (`LegendeStatuts`) ne reprend que les statuts réellement présents dans le
dossier.

Les listes longues sont repliées par `ListeRepliable` au-delà de
`LIGNES_VISIBLES` (10 lignes) : le serveur triant déclarations, recoupements,
rapprochements et relances en ordre inverse de date, ce qui reste visible est
toujours la période la plus récente, et le pli indique combien de lignes sont
cachées. Les tableaux repliés partagent le balisage de leur version visible
(`TableauDeclarations`, `TableauRecoupements`, `TableauRapprochements`) avec un
`aria-label` distingué (« … (suite) »).

Enfin, l'encart « Que faire en cas d'écart ? » s'adapte à la situation : quand
aucune ligne n'attend d'explication, il ne renvoie plus à « le tableau ci-dessus »
et annonce d'abord soit l'absence de comparaison, soit la concordance générale ;
le rappel anti-fraude (ne pas créer de nouveau compte, ne pas payer hors des voies
officielles) reste affiché dans tous les cas.

## 4. Page d'aide et sourçage des valeurs

`AideContribuable` ne calcule rien : tout le texte vient de `data/aide.data.js`,
et chaque chiffre de ce fichier est relevé dans le code qui l'applique réellement.
Le tableau ci-dessous est la liste de contrôle de ce sourçage.

| Valeur énoncée dans l'aide | Où elle est appliquée |
| --- | --- |
| 30 jours de réponse à la demande d'éclaircissements (art. V-02 du code des procédures fiscales, qui fixe un délai franc de 15 jours) | délai porté par le formulaire agent [`DemandeEclaircissementModal.jsx`](../components/common/DemandeEclaircissementModal.jsx) |
| 30 jours + prorogation pour la notification primitive (art. V-04 ; la prorogation est bornée à 15 jours par les art. VI-04 et VI-05) | `prorogation_jours` du formulaire [`NotificationModal.jsx`](../components/common/NotificationModal.jsx) |
| Amende de 40 % du principal | `principal * 0.4` dans [`TheoreticalForm.jsx`](../frontofficeagent/collecte/components/TheoreticalForm.jsx) (simulateur) et dans [`ProcedureContradictoireTimeline.jsx`](../frontofficeagent/suivi-fiscal/components/ProcedureContradictoireTimeline.jsx) — jamais imprimé comme un montant dû : la base n'a aucune colonne d'amende, les courriers portent « Non liquidé au dossier » |
| Pénalité de 10 % au rappel | aucun calcul dans l'application, et c'est ce que dit le document : [`RappelOrdreModal.jsx`](../frontofficeagent/relance/components/RappelOrdreModal.jsx) imprime « Non liquidé au dossier » et le total enregistré (`relances.montant_du`). La règle reste énoncée dans `aide.data.js` comme repère légal |
| Seuils de catégorie (400 M / 200 M / 100 M Ar) et pénalités mensuelles de retard | `classificationCgi.utils.js` (côté agent) et `CATEGORIES` de `aide.data.js` |
| TVA théorique : `CA × 5 %` (IS) ou `max(320 000 + CA × 20 % ; bénéfice × 20 %)` (IR) | `tvaTheorique` de `TheoreticalForm.jsx` |
| Seuil d'écart de 50 % déclenchant le redressement | `redressementApplicable` de `TheoreticalForm.jsx` |
| Imputation du crédit d'impôt seulement après la notification définitive (art. 01.01.15 IR / 01.02.06 IS) | garde d'imputation du parcours agent (4ᵉ bouton d'imputation) |
| Rythme des relances 8 / 8 / 5 jours francs | `RappelOrdreModal.jsx` (côté agent) et `RELANCES` de `aide.data.js` |
| Statuts et leur sens | référentiels serveur cités en § 2 |

Les neuf rubriques, dans l'ordre du sommaire, sont identifiées par les ancres
`lire`, `montants`, `confrontation`, `procedure`, `delais`, `categories`,
`statuts`, `securite`, `questions`. L'ordre de la rubrique `procedure` suit
l'ordre légal de la procédure contradictoire : demande d'éclaircissements (art.
V-02), puis notification primitive (art. V-03 et V-04), puis notification
définitive (art. V-07), puis imputation du crédit d'impôt (art. 01.01.15 IR /
01.02.06 IS du code des impôts).

Le pied de page de l'aide énonce les textes cités — code des impôts et code des
procédures fiscales (éditions consolidées 2025) et loi de finances pour 2026 —
avec, pour chacun, un lien qui ouvre le PDF de l'éditeur à la page du fichier
où se lit l'article. Le registre conserve le folio imprimé dans `page` et calcule
l'ancre physique avec `decalagePage` (1 pour les deux codes, 2 pour la LF 2026).
Ces références viennent du registre neutre
[`../data/textesFiscaux.data.js`](../data/textesFiscaux.data.js), lu par la
puce [`../components/common/RefLegal.jsx`](../components/common/RefLegal.jsx).
Chaque cellule du tableau `CATEGORIES` cite aussi sa source (`seuil`, `impots`,
`comptabilite`) au lieu de renvoyer seulement au pied de page. Une valeur que
l'application calcule sans la lire dans un texte (TVA théorique, seuil d'écart
de 50 %, pénalité de rappel de 10 %) garde son lien vers l'article le plus
proche, mais affiche un avertissement et une puce de couleur prudente. L'aide
« ne vaut pas avis individuel sur votre dossier » : elle explique les mots et
les règles, jamais une situation.

## 5. Ce qui n'est jamais affiché

La projection serveur
([`../../../backend/src/models/acces-contribuable.model.js`](../../../backend/src/models/acces-contribuable.model.js))
exclut du payload les champs réservés à l'instruction : `observations_agent`,
`score`, le `motif` des rapprochements, l'`id_agent` instructeur et le NIF du
tiers. Le frontend ne reçoit donc pas ces données et ne peut pas les rendre.

## 6. Styles

Aucune feuille dédiée : la page réutilise les classes du projet — `.panel`,
`.kpis`, `.table-wrap`, `.badge`, `.bar-chart`, `.rule-box`, `.dossier-lecture`,
`.procedure-more`, `.declaration-detail-grid`, `.secondary`, `.empty`,
`.login-field`, `.login-submit` — et les règles `.portail-*` de
[`../App.css`](../App.css).

Les ajouts du portail sont écrits **en jetons de thème** (`var(--card)`,
`var(--ink)`, `var(--muted)`, `var(--border)`, `var(--warn)`,
`var(--brand-soft)`, échelle `--text-*`) : comme `.dark-theme` se contente
d'inverser ces jetons, le thème sombre est couvert sans règle dédiée. Les seules
variantes `.dark-theme` explicites restent celles des écrans écrits avant cette
convention (`.portail-brand`, `.portail-identite`, `.lien-acces-*`).

Classes nouvelles : `.portail-section-titre`, `.portail-ligne-note`,
`.portail-legende` / `.portail-legende-puce`, `.portail-confront-kpis`,
`.portail-confront-focus`, `.portail-que-faire-etapes` /
`.portail-que-faire-note`, `.portail-aide-lien`, `.portail-verification-aide`,
`.portail-regle` (marqueur d'une règle, avec sa variante `.compact` en bloc pour
les listes de conseils), `.portail-infobulle` / `-cible` / `-tip` et le jeu
`.portail-aide-*` (`sommaire`, `dl`, `etapes`, `numero`, `refs`,
`puce`, `ref`, `delais`, `delai`, `liste`, `faq`, `titre`, `renvois`, `renvoi`).

Deux précautions d'écriture, vérifiées en direct dans les deux thèmes :

- les règles d'infobulle ciblent trois classes (`.portail .portail-infobulle
  .portail-infobulle-tip`, idem pour les états `:hover` / `:focus-within` /
  `.ouvert` et pour les reprises dans les media queries) : à une seule classe,
  elles perdraient en spécificité contre `.dark-theme .kpis span` et le texte du
  survol redeviendrait gris sur fond sombre ;
- le survol existe aussi sans souris : `@media (hover: none)` rend la cible
  cliquable, et les pastilles du tactile rouvrent l'infobulle par `.ouvert`.

Les points de rupture 760 px et 520 px replient la grille des KPI et celle des
délais, puis les légendes et les définitions en une colonne ; la même logique
borne la largeur de l'infobulle et l'aligne sur le bord gauche de l'écran quand
la cible est en bout de ligne. Le bloc `@media print` masque les boutons, la
bascule de thème, le sommaire de l'aide et les renvois `.portail-aide-lien`, les
infobulles (le survol n'existe pas sur papier — la forme courte de chaque règle
vit de toute façon dans l'aide imprimable) et les renvois croisés
`.portail-aide-renvois` / `.portail-aide-renvoi`, et empêche les coupures au
milieu des panneaux, identités, légendes, étapes et définitions.

**Réserve d'impression** : le contenu d'un `<details>` fermé n'est pas rendu par
le navigateur, donc les lignes repliées (historique, recoupements, suite de la
confrontation, relances, FAQ) ne sortent pas sur papier ni dans le PDF avant
d'avoir été dépliées à l'écran.

## 7. Garde de route

Il n'existe pas de garde de rôle ici : le portail ne dépend pas de la session
agent, il dépend de la validité du jeton et de la correspondance NIF / e-mail.
Un lien expiré, révoqué ou inconnu renvoie `404` avec un message unique, et le
formulaire d'identité ne montre alors aucune donnée fiscale. L'aide, ouverte dans
cet état, reste du texte général : elle ne lit aucun dossier et n'appelle aucun
endpoint.
