# `public/referentiel-nif/` — fichiers JSON de référence pour la vérification NIF

Ce dossier est servi **tel quel** par le frontend (Vite copie `public/` à la
racine du site). Un fichier déposé ici est donc joignable par une URL simple,
`/referentiel-nif/<nom-du-fichier>.json`, et peut être déclaré comme **API JSON**
sur la page `Admin > Vérification NIF > 3 · Synchronisation Base JSON`.

## Contenu

| Fichier | URL | Rôle |
| --- | --- | --- |
| `modele-de-verificationnif.json` | `/referentiel-nif/modele-de-verificationnif.json` | Gabarit d'une entrée : le format minimal accepté par l'import. Le bouton « Télécharger le modèle JSON » de la page 3 produit le même contenu sous le nom `modele de verificationnif.json`. |

Aucun jeu de démonstration n'est livré dans ce dossier : une liaison JSON n'a de
sens que sur des NIFs réels, et des noms d'entreprises inventés affichés à côté de
vrais contribuables rendraient le tableau méconnaissable. Le gabarit ci-dessus
porte une entrée neutre — NIF `1234567890`, raison sociale vide de sens — à
remplacer avant usage.

## Format accepté

Un fichier de référentiel est **soit un tableau**, soit **un objet portant une
clé `data`, `resultats` ou `referentiel`** contenant ce tableau :

```json
[
  { "NIF": "1234567890", "RaisonSociale": "RAISON SOCIALE DU CONTRIBUTABLE", "Centre": "SRE 1 Analamanga" }
]
```

Les colonnes reconnues sont celles du modèle Excel — `NIF` (ou `nif`, `Numero`,
`numero`), `RaisonSociale` (ou `raison_sociale`, `Nom`, `nom`), `Centre` (ou
`centre`) — plus `source`, facultative. **`statut` n'est pas lu** : il est attribué
par l'application d'après la voie d'arrivée de la ligne (« Déclaré par le fichier »,
« Déclaré par l'API JSON »), parce qu'un fichier ne peut pas se certifier
lui-même. Les lignes sans NIF sont ignorées ; un fichier dont aucune ligne n'a de
NIF est refusé avec une erreur.

Le seul statut qui atteste une existence — « Présent dans la base » — est donné par
`GET /api/contribuables`, c'est-à-dire par la base contribuable elle-même, jamais
par un dépôt de fichier.

## Ajouter un référentiel

1. Déposer le `.json` dans ce dossier (ou exposer l'URL d'une API distante qui
   répond au format ci-dessus, en autorisant le CORS).
2. Sur la page « 3 · Synchronisation Base JSON », saisir l'adresse
   (`/referentiel-nif/mon-fichier.json` ou `https://…`) puis **Ajouter l'API**.
3. **Synchroniser** l'entrée ajoutée : ses NIFs sont fusionnés dans le
   référentiel partagé (première occurrence gardée) et l'opération rejoint
   l'historique des trois derniers liens.

Les API enregistrées le sont dans `localStorage` (`verif_nif_apis_json`) : elles
restent disponibles après un rechargement, uniquement sur ce navigateur.
