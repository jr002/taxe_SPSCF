# Contrôleurs

Les contrôleurs traduisent les requêtes HTTP en appels aux services ou modèles,
puis renvoient les statuts et les données JSON.

- [`contribuable.controller.js`](contribuable.controller.js)
- [`declaration.controller.js`](declaration.controller.js) (dont la procédure
  contradictoire : notifications primitive et définitive, imputation du crédit
  d'impôt). Son `create` conserve un `tva_theorique` déjà déterminé par le
  collecteur — le module « TVA collectée / déductible » n'a pas de chiffre
  d'affaires à réformer — et ne replie sur `FiscalService.calculerTVATheorique`
  que lorsque ce champ est absent ; il enregistre également `observations_agent`,
  seul endroit où le module « Insertion d'une déclaration » peut consigner les
  impôts payés et les autres charges, faute de colonne dédiée.
- [`controle.controller.js`](controle.controller.js)
- [`recoupement.controller.js`](recoupement.controller.js)
- [`droit-communication.controller.js`](droit-communication.controller.js) :
  CRUD et statistiques par statut ; le `create` horodate `id_agent` depuis la
  session (`req.user?.id`).
- [`relance.controller.js`](relance.controller.js)
- [`acces-contribuable.controller.js`](acces-contribuable.controller.js) : les
  trois temps du portail. `generer` (route agent) borne la durée à 1–30 jours,
  exige un e-mail enregistré sur le dossier, émet le jeton et ne le renvoie
  qu'ici — l'audit `ACCES_CONTRIBUABLE` n'en consigne ni le jeton ni l'empreinte ;
  `statut` (route publique) ne répond qu'une validité, une échéance, une raison
  sociale masquée et le centre ; `ouvrir` (route publique) normalise NIF et
  e-mail, les compare au dossier, répond `403` sur correspondance insuffisante
  (`nb_echecs` incrémenté), `404` avec un message unique pour un lien inconnu,
  expiré ou révoqué, et réinitialise les limiteurs après succès. Aucun des trois
  ne consomme `req.dataScope` : la garde du portail est le jeton, pas la session.
- [`etat-contribuable.controller.js`](etat-contribuable.controller.js)
- [`rapprochement.controller.js`](rapprochement.controller.js)
- [`centre.controller.js`](centre.controller.js) : le `delete` refuse le centre
  `SSIF` (`400`) — la clé étrangère `agents.id_centre` étant en
  `ON DELETE SET NULL`, sa suppression viderait en silence l'affiliation de tous
  les administrateurs.
- [`agent.controller.js`](agent.controller.js) : administration des comptes
  (activation, rôle, centre de rattachement `PATCH /:id/centre`, identité
  `PATCH /:id/identite`, mot de passe, suppression), avec les garde-fous sur son
  propre compte et sur le dernier administrateur actif. `PATCH /:id/role`
  réécrit aussi l'affiliation : entrer dans `admin` rattache au centre `SSIF`,
  en sortir le libère (`AgentModel.findIdCentreAdministrateurs()`), les autres
  rôles conservent leur centre. Chaque changement est
  tracé dans `historique_utilisateurs` (`ROLE_CHANGE`, `CENTRE_UPDATE`,
  `IDENTITE_UPDATE`, `ACTIVATION`, `BLOCAGE`, `MDP_RESET`, `SUPPRESSION`).
  `IDENTITE_UPDATE` ne consigne que les clés réellement modifiées et renvoie
  `409` quand l'e-mail appartient déjà à un autre compte ; `ROLE_CHANGE` consigne
  `id_centre` avant et après.

**Transversal** : chaque contrôleur métier transmet `req.dataScope` (calculé par
[`../middlewares/auth.middleware.js`](../middlewares/auth.middleware.js)) au modèle
ou au service, et `contribuable.controller.js` verrouille le `id_centre` de ses
écritures avec `forceCentreOnWrite` : un agent centré ne peut ni créer un dossier
dans un autre centre ni en déplacer un existant.

La logique d'authentification n'a pas de contrôleur : elle est écrite
directement dans [`../routes/auth.routes.js`](../routes/auth.routes.js).
