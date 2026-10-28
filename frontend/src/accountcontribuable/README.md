# Espace contribuable (`/src/accountcontribuable`)

Dossier de l'espace consulté **par le contribuable lui-même**, en lecture seule
et hors session agent. Il s'ouvre par un lien spécial émis depuis la fiche d'un
contribuable du front-office agent.

## 1. Parcour complet

1. Un agent, contrôleur, inspecteur ou chef de centre ouvre
   [`../frontofficeagent/contribuables/ContribuableDetail.jsx`](../frontofficeagent/contribuables/ContribuableDetail.jsx)
   et clique « Lien contribuable » (bouton `secondary` de
   [`ContribuableHeader.jsx`](../frontofficeagent/contribuables/components/ContribuableHeader.jsx)).
2. [`LienAccesModal.jsx`](../frontofficeagent/contribuables/components/LienAccesModal.jsx)
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

## 2. Écrans

| Fichier | Rôle |
| --- | --- |
| [`EspaceContribuable.jsx`](EspaceContribuable.jsx) | lit le jeton depuis l'URL, affiche l'en-tête DGI, le thème, les trois états du lien (vérification, indisponible, formulaire d'identité) et monte `SituationFiscale` après confirmation. Le composant interne est rendu avec `key={token}` : changer de lien repart d'un état neuf, sans dossier conservé en mémoire |
| [`components/SituationFiscale.jsx`](components/SituationFiscale.jsx) | dossier complet en lecture seule |

`SituationFiscale` présente, dans cet ordre :

- l'identité du dossier (raison sociale, NIF, centre gestionnaire, situation
  d'activité, conformité enregistrée) ;
- un pavé d'aide à la lecture (« Comment lire cette page ») ;
- le **tableau de bord des taxes** : TVA payée cumulée, TVA théorique attendue,
  écart constaté et nombre de déclarations sans écart, plus un histogramme TVA
  payée / théorique par exercice (6 derniers) ;
- **pénalités, échéances et conseils** : conseils calculés depuis le dossier
  (écart cumulé, réponse attendue à une notification primitive, net restant à
  payer d'une notification définitive, relances en cours, rapprochements à
  vérifier), encart « À retenir sur les pénalités » (amende de 40 % exigible
  seulement après la notification définitive), tableau des notifications et
  détail replié des relances ;
- l'**historique des déclarations TVA** (collectée, déductible, payée,
  théorique, écart, situation) ;
- les **droits de communication** (tiers, type, objet, statut, date de réponse) ;
- les **recoupements** (source, opération, montants) ;
- le **rapprochement et la confrontation** (référence déclaration / recoupement,
  type, montants, écart, statut) avec l'encart « Que faire en cas d'écart ? » ;
- un pied de page rappelant la date de fin de validité du lien.

## 3. Ce qui n'est jamais affiché

La projection serveur
([`../../../backend/src/models/acces-contribuable.model.js`](../../../backend/src/models/acces-contribuable.model.js))
exclut du payload les champs réservés à l'instruction : `observations_agent`,
`score`, le `motif` des rapprochements, l'`id_agent` instructeur et le NIF du
tiers. Le frontend ne reçoit donc pas ces données et ne peut pas les rendre.

## 4. Styles

Aucune feuille dédiée : la page réutilise les classes du projet — `.panel`,
`.kpis`, `.table-wrap`, `.badge`, `.bar-chart`, `.rule-box`, `.dossier-lecture`,
`.procedure-more`, `.declaration-detail-grid`, `.secondary`, `.empty`,
`.login-field`, `.login-submit` — et les règles `.portail-*` ajoutées dans
[`../../App.css`](../../App.css), y compris les variantes `.dark-theme` et le
bloc `@media print` (boutons et bascule de thème masqués, panneaux et tableaux
non coupés).

« Imprimer / enregistrer en PDF » appelle `window.print()` : aucune dépendance
n'est utilisée pour générer le document.

## 5. Garde de route

Il n'existe pas de garde de rôle ici : le portail ne dépend pas de la session
agent, il dépend de la validité du jeton et de la correspondance NIF / e-mail.
Un lien expiré, révoqué ou inconnu renvoie `404` avec un message unique, et le
formulaire d'identité ne montre alors aucune donnée fiscale.
