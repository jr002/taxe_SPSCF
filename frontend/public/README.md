# Ressources publiques

Fichiers servis tels quels par Vite depuis la racine du site, sans passer par le
bundler (contrairement à [`../src/assets/`](../src/assets/), dont les fichiers
sont importés dans les composants).

## Contenu

| Fichier | Usage |
| --- | --- |
| `imgministeradgi.jpg` | Visuel du Ministère auprès de la Présidence chargé des Finances et du Budget (DGI) |
| `imgrepublique.jpg` | Visuel institutionnel de la République de Madagascar |

> Remarque : [`../index.html`](../index.html) référence une icône
> `/favicon.svg` qui n'existe pas dans ce dossier ; le navigateur renvoie donc
> une erreur 404 sur cette ressource. Déposez le fichier ici ou corrigez la
> balise `<link rel="icon">`.
