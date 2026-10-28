# Composants communs

Composants transversaux de l'interface : la navigation principale, les documents
officiels de la procédure contradictoire (notification, demande d'éclaircissements)
et la pagination des tableaux.

---

## [`Pagination.jsx`](Pagination.jsx)

Export par défaut `Pagination`. Barre de navigation entre les pages d'un tableau
déjà découpé côté client ; le composant est partagé par le registre des
contribuables (`/contribuables`) et les cinq pages du backoffice
administrateur.

* Renvoie `null` lorsque `totalPages <= 1` **et** que `showSinglePage` est faux :
  aucune barre n'apparaît tant que la liste tient dans une page.
* Les numéros affichés viennent de `getPageNumbers`, exporté par
  [`../../utils/pagination.utils.js`](../../utils/pagination.utils.js) : tous les
  numéros jusqu'à 7 pages, puis `1 … n-1` avec ellipses.
* « Précédent » est désactivé en page 1, « Suivant » en dernière page ; la page
  active se reconnaît à son fond `#1d4ed8`.
* Le conteneur porte la classe `pagination-controls` et une mise en place en
  flex centre ; aucun style nouveau n'est introduit pour les pages admin.

| Prop | Type | Rôle |
| --- | --- | --- |
| `currentPage` | `number` | Page affichée (doit déjà être bornée par l'appelant) |
| `onPageChange` | `(page: number) => void` | Changement de page |
| `totalPages` | `number` | Nombre de pages de la liste filtrée |
| `showSinglePage` | `boolean` | Défaut `false`. À `true`, la barre reste rendue quand `totalPages <= 1` (boutons « Précédent » et « Suivant » désactivés) — utilisé par les tables du backoffice, qui n'ont que quelques lignes |

* Sans `showSinglePage`, une liste qui tient sur une page ne montre aucun pager ;
  les trois pages qui l'activent le conditionnent à `Boolean(lignes.length)` pour
  ne pas afficher de pager sous une recherche sans résultat.

La découpe en page est fournie par [`../../hooks/useTablePagination.js`](../../hooks/useTablePagination.js)
côté administration, et par `useContribuablesList` (15 lignes) côté registre.

---

## [`Header.jsx`](Header.jsx)

Export par défaut `Header`. En-tête rendu par `App.jsx` pour toutes les routes protégées.

* Liens statiques déclarés dans `NAVIGATION_LINKS` (huit entrées, toutes routées) :
  `/acceuil` (Accueil), `/collecte` (Collecte), `/decisionnel` (Statistique),
  `/suivi` (Dossier fiscal), `/relance` (Relances), `/contribuables`
  (Contribuables), `/centres-fiscaux` (Centres) et `/register` (Registre).
* Le lien actif est celui dont le chemin est le **préfixe le plus long** de
  `pathname` (calcul `reduce` dans le composant) : `/contribuables/51/relances`
  surligne « Contribuables », et côté admin `/admin/verification-nif/sql`
  surligne « Vérification NIF » sans surligner « Tableau de bord ».
* Barre rendue **fixe** (`position: sticky; top: 0; z-index: 40` dans
  [`../../App.css`](../../App.css)) au-dessus de 1024 px ; en dessous elle passe
  en `position: relative` — elle défile avec la page, mais reste le repère du
  profil — quand la navigation revient à la ligne et occupe sa propre rangée.
* Logo `logodgi.jpg` importé depuis [`../../assets/logodgi.jpg`](../../assets/logodgi.jpg).
* Onglets de sous-modules affichés uniquement lorsque `pathname === '/collecte'` et que `modules.length > 0` ; chaque onglet appelle `onSelectModule?.(module.id)`.
* Bouton de bascule du thème et déconnexion tous deux déplacés dans le profil de
  l'agent connecté ([`UserProfile.jsx`](UserProfile.jsx)) : simple pastille ronde
  de 3 rem rendue **hors du `<nav>`**, en dernier enfant du `<header>`.
  `.user-profile` est positionné en absolu à droite de la barre et centré sur sa
  hauteur (`top: 50%` + `translateY(-50%)`, `right` calqué sur le rembourrage de
  `.topbar`) ; il reste donc collé là même quand les liens passent sur deux
  lignes, et son panneau se déroule juste dessous. Sous 1024 px, la barre passant
  sur deux lignes, le profil est réaligné sur celle du logo (`top: 0.9rem`).
* **Deux espaces étanches, choisis par le rôle** : `links = isAdmin ?
  ADMIN_LINKS : NAVIGATION_LINKS`. Le backoffice (`ADMIN_LINKS`, cinq entrées)
  ignore les modules fiscaux — un administrateur n'a pas accès aux dossiers
  fiscaux — et l'espace agent ignore la gestion des utilisateurs, des rôles et du
  journal d'audit. Aucun second bloc, aucun lien de bascule : `FISCAL_MODULE_LINKS`
  et le `<nav className="nav-modules">` introduits un temps ont été retirés, avec
  leurs règles `.topbar { flex-wrap: wrap }` / `.nav-modules-label` dans
  [`../../App.css`](../../App.css).
* Cette étanchéité est celle de la **navigation**, pas des routes : un admin qui
  tape `/suivi` y accède toujours (le `data-scope` de son rôle couvre tous les
  centres), et un agent qui tape `/admin` tombe sur le refus rendu par chaque
  page du backoffice (`if (!isAdmin)` dans
  `src/backofficeadmin/dashboard/pages/AdminDashboard.jsx`,
  `utilisateurs/AdminUtilisateurs.jsx`, `roles/AdminRoles.jsx`,
  `historique/AdminHistorique.jsx` et `verification-nif/AdminVerificationNIF.jsx`).
  Verrouiller `/admin*` et l'espace fiscal par des gardes de route reste à faire
  si l'exigence doit être absolue.

Props :

| Prop | Type | Rôle |
| --- | --- | --- |
| `modules` | `Array<{ id, label }>` | Onglets de sous-modules de collecte (défaut `[]`) |
| `currentModule` | `string` | Identifiant du module actif |
| `onSelectModule` | `function` | Sélection d'un module |
| `isDarkMode` | `boolean` | Thème courant, transmis au profil |
| `onToggleTheme` | `function` | Bascule clair / sombre, déclenchée depuis le profil |
| `onLogout` | `function` | Déconnexion, transmise au profil |
| `user` | `object \| null` | Agent renvoyé par `GET /api/auth/me` (défaut `null`) |
| `isAdmin` | `boolean` | Bascule la navigation sur les entrées du backoffice (défaut `false`) |

---

## [`UserProfile.jsx`](UserProfile.jsx)

Export par défaut `UserProfile`. Puce de profil de l'agent connecté, rendue par
[`Header.jsx`](Header.jsx) ; renvoie `null` si `user` est absent.

* Dans la barre, uniquement le **bouton rond** portant les deux initiales
  (premières lettres de `prenom` et `nom`, repli sur les deux premiers
  caractères de l'e-mail) : `.user-profile-toggle` est une disquette de `2.6rem`
  à `border-radius: 50%`, sans nom, sans badge de rôle et sans chevron. Son
  `aria-label` et son `title` continuent de dire « Profil de Prénom Nom,
  <rôle> » pour qu'un lecteur d'écran et la infobulle conservent l'identité.
* Le clic déroule une carte de `300px` en trois bandes : **en-tête** sur dégradé
  bleu clair (pastille d'initiales agrandie, nom complet, e-mail et bouton `✕`
  `.agent-profile-fermer`, la classe déjà utilisée par les fiches de la page
  Utilisateurs), **corps** `.user-profile-details` en lignes `dt`/`dd` — libellé
  à gauche, valeur alignée à droite, séparées par un filet — portant le **rôle**
  libellé par `roleDefinition` (importé de
  [`../../backofficeadmin/utils/roles.utils.js`](../../backofficeadmin/utils/roles.utils.js),
  badge `conforme`, `surveillance` ou `critique`), le **centre de rattachement**
  (`nom_centre`, sinon « Aucun centre affecté ») et le **périmètre** du rôle
  (`droits`) ; enfin **pied de carte** sur fond `#f7fafc` regroupant les trois
  commandes.
* Le bouton de thème n'est plus une simple pastille d'icône : `.theme-toggle`
  porte désormais l'icône **et** le mot « Mode clair » / « Mode sombre », pour
  que la commande se lise sans deviner le glyphe. Les variantes sombres de la
  carte (bande dégradé `#1c3350`, filet `#24313f`, pied `#131c28`) suivent le
  même `.dark-theme` que le reste de l'application.
* **Troisième commande : « 🔑 Changer mon mot de passe »** (`.user-profile-
  motdepasse`, entre le thème et la déconnexion, le pied de carte étant passé en
  `flex-wrap: wrap` pour que les trois boutons tiennent). Elle ouvre une
  [`ModaleConfirmation`](ModaleConfirmation.jsx) avec trois champs `.field` —
  actuel, nouveau, confirmation — chacun muni du bouton « Afficher / Masquer »
  `.login-password-toggle` repris de l'écran de connexion. Validation locale
  avant tout appel (trois champs remplis, confirmation identique, 4 caractères
  minimum, nouveau différent de l'actuel), puis
  `changeOwnPassword({ password_actuel, password_nouveau, password_confirmation })`
  → `POST /api/auth/change-password`. Erreur serveur et message de succès
  s'affichent dans la modale ; après succès, les champs disparaissent et le pied
  ne garde plus que « Fermer ». La limite du limiteur backend (6 tentatives par
  agent et par 15 min) remonte par le même canal.
* Ces trois commandes n'existent plus dans la barre elle-même : le `Header` les
  reçoit de `App.jsx` et les redescend ici. Le panneau reste ouvert après une
  bascule de thème **et** après l'ouverture de la modale de mot de passe :
  celle-ci est rendue dans le conteneur `.user-profile`, donc ses clics ne
  tombent pas « hors » du composant, et le gestionnaire `Échap` du panneau cède
  la priorité à la modale tant qu'elle est ouverte.
* Fermeture du panneau par le `✕` de l'en-tête, par clic hors du composant
  (`mousedown` sur `document`) ou par la touche `Échap` ; le bouton rond expose
  `aria-expanded`, `aria-controls` et un `aria-label` nommé.
* Styles dans [`../../App.css`](../../App.css) (bloc `.user-profile*` et leurs
  variantes `.dark-theme`) ; le panneau est ancré sur `.topbar nav`, et non sur
  la puce, pour rester dans l'écran quand la barre revient à la ligne.

| Prop | Type | Rôle |
| --- | --- | --- |
| `user` | `object \| null` | Agent connecté renvoyé par la session |
| `onLogout` | `function` | Déconnexion |
| `isDarkMode` | `boolean` | Thème courant, pour l'icône et le libellé du bouton |
| `onToggleTheme` | `function` | Bascule clair / sombre |

## [`ModaleConfirmation.jsx`](ModaleConfirmation.jsx)

Export par défaut `ModaleConfirmation`. Modale de confirmation générique chargée
de **dire avant de faire** : elle résume la ou les modifications, puis n'exécute
l'action que sur « Valider ». Deux consommateurs :
[`../../backofficeadmin/utilisateurs/pages/AdminUtilisateurs.jsx`](../../backofficeadmin/utilisateurs/pages/AdminUtilisateurs.jsx)
(cinq cas — enregistrement du brouillon, blocage / activation, mot de passe
temporaire, suppression, abandon d'un brouillon) et la modale de mot de passe de
[`UserProfile.jsx`](UserProfile.jsx).

* Rendue seulement si `ouvert` ; le contenu (`children`) est glissé entre
  l'introduction et le message d'erreur, ce qui permet un simple texte ou un
  formulaire complet.
* `modifications` est une liste de `{ label, avant, apres }` : chaque entrée
  devient une ligne `.modale-confirmation-liste li` « AVANT → APRÈS ». Une modale
  sans `onValider` ne propose que « Fermer » (utilisé après un succès, pour que
  l'utilisateur relise le message avant de le laisser disparaître).
* `variante="danger"` déplace la carte vers un liseré `#b42318`, une tête
  rougeâtre et un bouton de validation `.admin-danger-button` — employé pour le
  blocage, la suppression et l'abandon du brouillon.
* `messageErreur` / `messageSucces` s'affichent **dans** la modale : la bannière
  de la page serait cachée derrière l'obscurcissement, et une erreur serveur
  laisse la modale ouverte avec son brouillon pour correction.
* `enCours` désactive les deux boutons du pied et rebaptise « Valider » en
  « Enregistrement... ».
* Accessibilité : `role="dialog"`, `aria-modal="true"`, `aria-label` porté par le
  titre, `tabIndex={-1}` et [`../../hooks/useModalA11y.js`](../../hooks/useModalA11y.js)
  (focus volé à l'ouverture, `Échap` qui ferme, focus restitué à l'appelant) ; le
  message d'erreur est en `role="alert"` et le succès en `role="status"`.
* Styles dans [`../../App.css`](../../App.css), bloc `.modale-confirmation*`
  et ses variantes `.dark-theme`, posé sur l'arrière-plan `.rappel-modal-overlay`
  déjà utilisé par les autres modales.

| Prop | Type | Rôle |
| --- | --- | --- |
| `ouvert` | `boolean` | Contrôle l'affichage |
| `etiquette` | `string` | Texte du badge de tête (« 1 modification(s) », « Mot de passe », « Action irréversible ») ; défaut « À confirmer », ou « Action délicate » en variante `danger` |
| `titre` | `string` | Titre `h2` de la modale |
| `intro` | `string` | Phrase d'explication sous le titre |
| `modifications` | `Array<{ label, avant, apres }>` | Liste des changements comparés (défaut `[]`) |
| `messageErreur` | `string` | Affiche l'erreur et garde la modale ouverte |
| `messageSucces` | `string` | Affiche le succès ; passe le pied en « Fermer » si `onValider` est `null` |
| `variante` | `'normale' \| 'danger'` | Habillage d'avertissement (défaut `'normale'`) |
| `texteValider` | `string` | Libellé du bouton d'action (défaut `'Valider'`) |
| `enCours` | `boolean` | Demande d'action en vol : boutons désactivés, texte « Enregistrement... » |
| `onValider` | `function \| null` | Exécute l'action ; absent = modale en lecture seule |
| `onFermer` | `function` | Annuler, `✕`, clic sur l'arrière-plan et touche `Échap` |

## [`NotificationModal.jsx`](NotificationModal.jsx)

Export par défaut `NotificationModal`. Modale plein écran présentant un document fiscal officiel (en-tête République de Madagascar / DGI, décompte du redressement, cadre légal, signatures) et permettant son impression via `window.print()`.

* Renvoie `null` si `!isOpen` ou si `declaration` est absente.
* `type` vaut `'primitive'` (défaut) ou `'definitive'` : le titre, la référence légale (CPF art. V-19 / CGI 2026) et le bloc de délais changent en conséquence.
* Montants : `principal` (repli sur `declaration.montant_redressement`), `amende` (repli sur 40 % du principal), `penalite` (défaut `0`), `total` (repli sur la somme des trois), `montant_impute` et `montant_net_a_payer` lus sur la déclaration. Les lignes d'imputation et de net à payer ne sont affichées que pour une notification définitive.
* Dates formatées en `fr-FR` : date d'émission issue de `date_notification_primitive` ou `date_notification_definitive` (repli sur la date du jour) et date limite issue de `date_limite_reponse` (repli sur aujourd'hui + 30 jours).
* Boutons « Imprimer / Exporter PDF » et « Fermer » ; la barre d'outils porte la classe `no-print`, prévue pour être masquée à l'impression par [`../../App.css`](../../App.css).
* Accessibilité clavier : le conteneur `.notification-modal-card` porte `role="dialog"`, `aria-modal="true"`, un `aria-label` selon le type et `tabIndex={-1}` ; il est focalisé à l'ouverture et Échap appelle `onClose` (voir [`../../hooks/useModalA11y.js`](../../hooks/useModalA11y.js)).
* Les montants sont formatés par `formatAriary` importé depuis [`../../utils/formatters.js`](../../utils/formatters.js).
* Remarque : `printRef` est déclaré (`useRef`) et attaché au bloc `.notification-sheet`, mais n'est jamais lu.

Props :

| Prop | Type | Rôle |
| --- | --- | --- |
| `isOpen` | `boolean` | Contrôle l'affichage |
| `onClose` | `function` | Fermeture (clic sur l'arrière-plan, bouton ou touche Échap) |
| `type` | `'primitive' \| 'definitive'` | Nature de la notification (défaut `'primitive'`) |
| `declaration` | `object` | Déclaration / dossier concerné (obligatoire) |
| `redressementDetails` | `object` | Surcharge des montants `principal`, `amende`, `penalite`, `total` (défaut `{}`) |

Utilisé par `src/frontofficeagent/suivi-fiscal/pages/DeclarationDetail.jsx` et `src/frontofficeagent/collecte/components/TheoreticalForm.jsx`.

## [`DemandeEclaircissementModal.jsx`](DemandeEclaircissementModal.jsx)

Export par défaut `DemandeEclaircissementModal`. Modale reprenant la mise en page
de [`NotificationModal.jsx`](NotificationModal.jsx) (mêmes classes
`.notification-sheet`, `.sheet-header`, `.legal-notice`, `.no-print`) pour le
document « Demande d'Éclaircissements et de Justifications » prévu par l'art.
V-17 du Code des Procédures Fiscales — le premier acte contradictoire, qui
précède la notification primitive.

* Renvoie `null` si `!isOpen` ou si `declaration` est absente.
* Trois sections : « CONTEXTE » (TVA payée et théorique de la déclaration, via
  `formatAriary`), « POINTS APPELANT VOS ÉCLAIRCISSEMENTS » (le texte libre de
  `questions`, affiché en `pre-line`, avec un message de repli s'il est vide) et
  « PROCÉDURE ET DÉLAI DE RÉPONSE ».
* Le délai n'est pas saisi : `delaiJours` vaut 30 par défaut et la date limite
  est calculée à partir de `dateEmission`. Sans date d'émission — donc avant
  l'envoi de la demande — l'en-tête et la date limite affichent `—`.
* Le document est relisible après émission : la fiche `/suivi/:id` le recharge
  depuis la table `relances` (`type_relance = 'demande_eclaircissement'`), où
  `observations` porte les points demandés et `date_emission` la date du document.

Props :

| Prop | Type | Rôle |
| --- | --- | --- |
| `isOpen` | `boolean` | Contrôle l'affichage |
| `onClose` | `function` | Fermeture (clic sur l'arrière-plan, bouton ou touche Échap) |
| `declaration` | `object` | Déclaration / dossier concerné (obligatoire) |
| `questions` | `string` | Points appelant les éclaircissements du contribuable |
| `dateEmission` | `string \| Date \| null` | Date du document ; sert aussi de point de départ du délai |
| `delaiJours` | `number` | Délai de réponse, en jours (défaut `30`) |

Utilisé par `src/frontofficeagent/suivi-fiscal/pages/DeclarationDetail.jsx`.
