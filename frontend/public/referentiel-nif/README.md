# `public/referentiel-nif/` — fichiers JSON de référence pour la vérification NIF

Ce dossier est servi **tel quel** par le frontend (Vite copie `public/` à la
racine du site). Un fichier déposé ici est donc joignable par une URL simple,
`/referentiel-nif/<nom-du-fichier>.json`, et peut être déclaré comme **API JSON**
sur la page `Admin > Vérification NIF > 3 · Synchronisation Base JSON`.

## Contenu

| Fichier | URL | Rôle |
| --- | --- | --- |
| `modele-de-verificationnif.json` | `/referentiel-nif/modele-de-verificationnif.json` | Gabarit d'une entrée : le format minimal accepté par l'import. Le bouton « Télécharger le modèle JSON » de la page 3 produit le même contenu sous le nom `modele de verificationnif.json`. |
| `referentiel-nif-exemple.json` | `/referentiel-nif/referentiel-nif-exemple.json` | Jeu de démonstration (mêmes NIFs de contrôle que `verification.utils.js`) pour tester une liaison sans serveur externe. |

## Format accepté

Un fichier de référentiel est **soit un tableau**, soit **un objet portant une
clé `data`, `resultats` ou `referentiel`** contenant ce tableau :

```json
[
  { "NIF": "3000000004", "RaisonSociale": "PHARMACIE CENTRALE", "Centre": "SRE 1 Analamanga" }
]
```

Les colonnes reconnues sont celles du modèle Excel — `NIF` (ou `nif`, `Numero`,
`numero`), `RaisonSociale` (ou `raison_sociale`, `Nom`, `nom`), `Centre` (ou
`centre`) — plus deux facultatives : `statut` et `source`, qui alimentent les
colonnes homonymes du référentiel administrateur. Les lignes sans NIF sont
ignorées ; un fichier dont aucune ligne n'a de NIF est refusé avec une erreur.

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
