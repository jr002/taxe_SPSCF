# 🏛️ Module Unités opérationnelles (`/src/frontofficeagent/centres`)

Un seul écran pour répondre à « quelle unité gère quels dossiers, où est-elle et comment la joindre ? ». Deux sources décrivaient le même objet — la table `centres` (registre administré) et `unitefiscal.json` (cartographie institutionnelle) — sur deux entrées de la barre latérale ; elles sont désormais fusionnées.

---

## 📁 Structure du dossier

```text
centres/
├── pages/
│   ├── UnitesOperationnelles.jsx      # Liste fusionnée (cartographie + registre)
│   └── UniteOperationnelleDetail.jsx  # Fiche d'une unité + dossiers rattachés
├── utils/
│   ├── uniteOperationnelle.utils.js   # Jointure des deux sources
│   └── uniteFiscale.utils.js          # Lecture du référentiel `unitefiscal.json`
└── README.md
```

---

## ⚙️ Deux sources, une ligne

| | Registre administré | Cartographie institutionnelle |
| --- | --- | --- |
| Source | table `centres` via `GET /api/centres` | `unitefiscal.json` (`unites_operationnelles`) |
| Apport | `numero_centre`, contacts saisis, dossiers rattachés (`_count.contribuables`) | régions couvertes, DRI de rattachement, adresse, téléphones multiples, attributs DGE |
| Clé de jointure | `type_centre` → `cle_unite`, puis `nom_centre` | `cle_unite`, puis `nom` |

`construireUnites(centres)` ([`utils/uniteOperationnelle.utils.js`](utils/uniteOperationnelle.utils.js)) produit une ligne par unité cartographiée, enrichie de sa ligne de registre quand les deux se reconnaissent, puis ajoute les centres enregistrés que le référentiel ne cartographie pas (créations administratives, centre SSIF). Une unité cartographiée mais absente du registre **reste visible** : c'est le trou que le registre doit combler, pas un fantôme à masquer.

Rien n'est inventé pour la source absente — `null` veut dire « non renseigné » et s'affiche `—`.

---

## 🧭 Routes (`App.jsx`)

| Route | Composant | Contenu |
| --- | --- | --- |
| `/unites-operationnelles` | `UnitesOperationnelles` | Tableau paginé : recherche, filtre par type, tri par colonne |
| `/unites-operationnelles/:type/:nom` | `UniteOperationnelleDetail` | Fiche de l'unité et dossiers fiscaux rattachés |
| `/register`, `/centres-fiscaux` | `Navigate` | Redirection vers la liste (anciennes entrées de la barre) |
| `/centres/:id`, `/centres-fiscaux/:type/:index` | `Navigate` | Redirection des anciennes fiches — l'URL est désormais adressée par `cle/nom`, plus par un index positionnel dans le tableau JSON |

Point d'entrée du domaine : [`index.js`](index.js).

---

## 🔍 Écrans

### `UnitesOperationnelles.jsx`

Recherche indifférente (nom, type, région, DRI, numéro, téléphone, e-mail), filtre par type, tri sur les huit colonnes, pagination à 10 lignes — état conservé dans l'URL par `useFiltresUrl` (`q`, `type`, `tri`, `sens`, `page`). Une ligne s'ouvre au clic, à `Entrée` ou à `Espace`.

Le cartouche s'adapte au périmètre de l'agent :

- `admin` et `inspecteur` voient l'ensemble du registre, donc le badge **« non enregistré »** est une affirmation vérifiée ;
- les rôles centrés ne reçoivent de `GET /api/centres` que leur propre centre : étaler « non enregistré » sur 111 lignes serait faux. Le numéro y vaut `—` et l'en-tête annonce que seul leur centre est visible du registre.

### `UniteOperationnelleDetail.jsx`

L'unité est retrouvée depuis l'URL par `trouverUnite({ cle, nom, centres })`. Deux requêtes indépendantes, toutes deux annulables, chacune avec son état d'erreur (`erreurRegistre`, `erreurDossiers`) : le registre d'abord, puis les dossiers.

Le rattachement fiscal porte deux colonnes synchronisées côté backend (`contribuables.id_centre` et `contribuables.centre_fiscal_ref`). La fiche demande `{ centre_fiscal_ref: ligne.reference }` quand l'unité est cartographiée ; pour un centre créé hors référentiel, elle charge les dossiers et filtre sur `id_centre` côté client. C'est ce qui ferme le doublon ancien : les deux fiches comptaient les mêmes dossiers avec deux clés différentes, et les dossiers d'un centre pouvaient être invisibles sur l'une des deux.

Le cartouche réunit enregistrement au registre, régions, DRI, adresse, contacts et dossiers rattachés, plus les attributs propres à la DGE (rôle, critère de rattachement, portail, télédéclaration, contact DGI). Un clic sur un dossier ouvre `/contribuables/:id` avec l'objet passé en `location.state`.

---

## 🔗 Liens avec les autres modules

* **Lien avec `accueil/` :** le raccourci « Unités opérationnelles » du tableau de bord ([`../accueil/pages/Accueil.jsx`](../accueil/pages/Accueil.jsx)) mène ici ; il ne promet plus les contribuables du registre, qu'il ne montrait pas.
* **Lien avec `contribuables/` :** depuis la fiche de l'unité, un clic sur un dossier ouvre la fiche complète du contribuable rattaché ([`../contribuables/pages/ContribuableDetail.jsx`](../contribuables/pages/ContribuableDetail.jsx)).
* **Lien avec `entreprises/` :** lors de l'immatriculation d'une nouvelle entreprise ([`../entreprises/pages/FormInformation.jsx`](../entreprises/pages/FormInformation.jsx)), les unités opérationnelles servent de référence pour le rattachement administratif.
* **Lien avec la navigation :** l'entrée `unites` de [`../../data/navigationAgent.data.js`](../../data/navigationAgent.data.js) porte les alias `/register`, `/centres-fiscaux` et `/centres` pour que la barre latérale reste allumée sur les URLs héritées.
