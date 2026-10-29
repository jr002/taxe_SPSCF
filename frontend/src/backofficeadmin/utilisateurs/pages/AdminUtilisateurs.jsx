import { Fragment, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

import {
  deleteAgent,
  getAgents,
  getCentres,
  getErrorMessage,
  resetAgentPassword,
  updateAgentCentre,
  updateAgentIdentite,
  updateAgentRole,
  updateAgentStatut,
} from '@/api';
import { ModaleConfirmation, Pagination } from '@/components/common';
import { useTablePagination } from '@/hooks';
import { initialsOf } from '@/utils';
import AdminNav from '@/backofficeadmin/components/AdminNav';
import {
  ROLES_AGENTS,
  centreResume,
  getRoleLabel,
  isCentreScoped,
  roleDefinition,
} from '@/backofficeadmin/utils/roles.utils';

/** Statut d'un compte : libellé, pastille et couleur de ligne. */
const STATUTS = {
  actif: { label: 'Actif', badge: 'conforme', ligne: 'row-conforme' },
  en_attente: { label: 'En attente', badge: 'surveillance', ligne: 'row-surveillance' },
  inactif: { label: 'Bloqué', badge: 'critique', ligne: 'row-critique' },
};

const FILTRES = [
  ['Tous', 'Tous'],
  ['en_attente', 'En attente'],
  ['actif', 'Actifs'],
  ['inactif', 'Bloqués'],
];

const ACTION_BUTTON =
  'inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-bold rounded-lg border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
const BLUE_BUTTON = `${ACTION_BUTTON} text-blue-700 bg-blue-50 border-blue-300 hover:bg-blue-100`;
const GREEN_BUTTON = `${ACTION_BUTTON} text-emerald-700 bg-emerald-50 border-emerald-300 hover:bg-emerald-100`;
const AMBER_BUTTON = `${ACTION_BUTTON} text-amber-700 bg-amber-50 border-amber-300 hover:bg-amber-100`;
const RED_BUTTON = `${ACTION_BUTTON} text-red-700 bg-red-50 border-red-300 hover:bg-red-100`;

const EMAIL_VALIDE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getStatut = (statut) =>
  STATUTS[statut] || { label: statut || 'Inconnu', badge: 'surveillance', ligne: '' };

const formatDate = (value) => (value ? new Date(value).toLocaleDateString('fr-FR') : '—');

/**
 * Page de gestion des comptes agents (`/admin/utilisateurs`).
 *
 * La fiche d'un compte est un **brouillon** : nom, prénom, e-mail, rôle et centre
 * se modifient localement, aucune requête n'est envoyée avant le clic sur
 * « Enregistrer ». Ce clic ouvre une confirmation qui liste les changements
 * `avant → après` ; « Annuler » laisse le brouillon intact, « Valider » applique
 * les correctifs. Blocage, réactivation, suppression et mot de passe temporaire
 * passent par la même boîte de dialogue, donc aucune action irréversible ne peut
 * être déclenchée par un simple clic.
 *
 * Deux modes selon le rôle connecté :
 * - `admin` : tous les comptes, tous les droits ;
 * - `chef_centre` : **mode restreint** — les comptes du centre de rattachement
 *   uniquement (le serveur borne la liste), la fiche en lecture seule et une
 *   seule action possible, bloquer ou activer un subordonné. Pas de navigation
 *   d'administration, puisque les quatre autres écrans lui sont fermés.
 *
 * Les API répondent `403` à tout autre rôle, et le `Header` ne présente cette
 * écran qu'aux administrateurs et aux chefs de centre.
 */
export default function AdminUtilisateurs({ currentUser }) {
  const location = useLocation();
  const isAdmin = currentUser?.role === 'admin';
  const peutGererComptes = isAdmin || currentUser?.role === 'chef_centre';
  const currentUserId = currentUser?.id;
  /**
   * Un chef de centre consulte l'écran sans pouvoir éditer une fiche : le serveur
   * ne lui laisse que le statut des comptes de son centre.
   */
  const estSeulementChefDeCentre = !isAdmin && currentUser?.role === 'chef_centre';

  const [agents, setAgents] = useState([]);
  const [centres, setCentres] = useState([]);
  const [loading, setLoading] = useState(Boolean(peutGererComptes));
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [filter, setFilter] = useState('');
  const [statutFilter, setStatutFilter] = useState(location.state?.statut || 'Tous');
  const [profileId, setProfileId] = useState(null);
  const [brouillons, setBrouillons] = useState({});
  const [modale, setModale] = useState(null);
  const [modaleErreur, setModaleErreur] = useState('');
  const [motDePasseTemporaire, setMotDePasseTemporaire] = useState('');
  const [motDePasseVisible, setMotDePasseVisible] = useState(false);

  useEffect(() => {
    if (!peutGererComptes) return undefined;

    let isMounted = true;

    const load = async () => {
      // La liste des centres ne sert qu'à l'affectation du centre de
      // rattachement, réservée aux administrateurs.
      const demandes = [getAgents()];
      if (isAdmin) demandes.push(getCentres());

      const [agentsResult, centresResult] = await Promise.allSettled(demandes);

      if (!isMounted) return;

      if (agentsResult.status === 'fulfilled') {
        setAgents(Array.isArray(agentsResult.value) ? agentsResult.value : []);
      } else {
        setError(getErrorMessage(agentsResult.reason));
      }
      if (centresResult?.status === 'fulfilled') {
        setCentres(Array.isArray(centresResult.value) ? centresResult.value : []);
      }
      setLoading(false);
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [isAdmin, peutGererComptes]);

  const reloadAgents = async () => {
    const result = await getAgents();
    setAgents(Array.isArray(result) ? result : []);
  };

  const handleRefresh = async () => {
    setLoading(true);
    setError('');

    try {
      await reloadAgents();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  const counts = useMemo(
    () =>
      agents.reduce((accumulator, agent) => {
        const key = agent.statut || 'inconnu';
        accumulator[key] = (accumulator[key] || 0) + 1;
        return accumulator;
      }, {}),
    [agents],
  );

  const visibleAgents = useMemo(() => {
    const normalizedFilter = filter.trim().toLowerCase();

    return agents.filter((agent) => {
      if (statutFilter !== 'Tous' && agent.statut !== statutFilter) return false;
      if (!normalizedFilter) return true;

      return [agent.nom, agent.prenom, agent.email, agent.role].some((value) =>
        String(value || '').toLowerCase().includes(normalizedFilter),
      );
    });
  }, [agents, filter, statutFilter]);

  const pages = useTablePagination(visibleAgents, 10);

  const isSelf = (agent) => String(agent.id_agent) === String(currentUserId);

  /** Valeurs enregistrées d'un compte, telles qu'elles servent de base au brouillon. */
  const brouillonDe = (agent) => ({
    nom: agent.nom ?? '',
    prenom: agent.prenom ?? '',
    email: agent.email ?? '',
    role: agent.role ?? 'agent',
    id_centre: agent.id_centre ?? null,
  });

  const nomCentre = (idCentre) => {
    if (idCentre === null || idCentre === undefined || idCentre === '') return 'Aucun centre';
    const centre = centres.find((item) => item.id_centre === Number(idCentre));
    return centre?.nom_centre ?? `Centre #${idCentre}`;
  };

  /** Liste des écarts entre le brouillon et le compte tel qu'il est en base. */
  const modificationsDe = (agent) => {
    const brouillon = brouillons[agent.id_agent];
    if (!brouillon) return [];

    const liste = [];
    const comparer = (cle, groupe, label, avant, apres) => {
      const centre = cle === 'id_centre';
      const gauche = centre ? (avant ?? null) : String(avant ?? '');
      const droite = centre ? (apres ?? null) : String(apres ?? '');
      if (gauche !== droite) liste.push({ cle, groupe, label, avant: gauche, apres: droite });
    };

    comparer('nom', 'identite', 'Nom', agent.nom, brouillon.nom.trim());
    comparer('prenom', 'identite', 'Prénom', agent.prenom, brouillon.prenom.trim());
    comparer('email', 'identite', 'Adresse e-mail', agent.email, brouillon.email.trim().toLowerCase());
    comparer('role', 'role', 'Rôle / titre', agent.role, brouillon.role);
    comparer('id_centre', 'centre', 'Centre de rattachement', agent.id_centre ?? null, brouillon.id_centre);

    return liste;
  };

  const afficherValeur = (cle, valeur) => {
    if (cle === 'role') return getRoleLabel(valeur);
    if (cle === 'id_centre') return nomCentre(valeur);
    return String(valeur ?? '').trim() || '(vide)';
  };

  const ecrireBrouillon = (agent, cle, valeur) => {
    setError('');
    setSuccess('');
    setBrouillons((courant) => ({
      ...courant,
      [agent.id_agent]: { ...(courant[agent.id_agent] ?? brouillonDe(agent)), [cle]: valeur },
    }));
    // La fiche porte le bouton « Enregistrer » : on l'ouvre si elle est repliée.
    setProfileId(agent.id_agent);
  };

  const oublierBrouillon = (idAgent) => {
    setBrouillons((courant) => {
      const copie = { ...courant };
      delete copie[idAgent];
      return copie;
    });
  };

  const ouvrirFiche = (agent) => {
    setError('');
    setSuccess('');
    setBrouillons((courant) => ({
      ...courant,
      [agent.id_agent]: courant[agent.id_agent] ?? brouillonDe(agent),
    }));
    setProfileId(agent.id_agent);
  };

  const fermerFiche = (agent) => {
    oublierBrouillon(agent.id_agent);
    setProfileId(null);
  };

  const basculerFiche = (agent) => {
    if (profileId !== agent.id_agent) {
      ouvrirFiche(agent);
      return;
    }
    if (modificationsDe(agent).length) {
      setModaleErreur('');
      setModale({ type: 'abandon', agent });
      return;
    }
    fermerFiche(agent);
  };

  /** Repart des valeurs enregistrées sans toucher au serveur. */
  const reinitialiserBrouillon = (agent) => {
    setBrouillons((courant) => ({ ...courant, [agent.id_agent]: brouillonDe(agent) }));
    setError('');
  };

  const demanderEnregistrement = (agent) => {
    const brouillon = brouillons[agent.id_agent] ?? brouillonDe(agent);

    if (!brouillon.nom.trim() || !brouillon.prenom.trim()) {
      setError('Le nom et le prénom sont obligatoires.');
      return;
    }
    if (!EMAIL_VALIDE.test(brouillon.email.trim())) {
      setError('Adresse e-mail invalide.');
      return;
    }

    const modifications = modificationsDe(agent);
    if (!modifications.length) {
      setError('Aucune modification à enregistrer.');
      return;
    }

    setError('');
    setSuccess('');
    setModaleErreur('');
    setModale({ type: 'enregistrer', agent, modifications });
  };

  const demanderStatut = (agent) => {
    const prochainStatut = agent.statut === 'actif' ? 'inactif' : 'actif';
    setError('');
    setSuccess('');
    setModaleErreur('');
    setModale({ type: 'statut', agent, prochainStatut });
  };

  const demanderMotDePasse = (agent) => {
    setError('');
    setSuccess('');
    setModaleErreur('');
    setMotDePasseTemporaire('');
    setMotDePasseVisible(false);
    setModale({ type: 'motdepasse', agent });
  };

  const demanderSuppression = (agent) => {
    setError('');
    setSuccess('');
    setModaleErreur('');
    setModale({ type: 'suppression', agent });
  };

  const fermerModale = () => {
    setModale(null);
    setModaleErreur('');
  };

  /**
   * Exécute l'action validée dans la modale : l'erreur reste dans la boîte de
   * dialogue (la page est behind), le succès la ferme et alimente le bandeau.
   */
  const lancerActionValidee = async (agent, action, messageValide) => {
    setBusyId(agent.id_agent);
    setModaleErreur('');

    try {
      await action();
      await reloadAgents();
      setModale(null);
      setSuccess(messageValide);
      setError('');
      return true;
    } catch (actionError) {
      setModaleErreur(getErrorMessage(actionError));
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const validerEnregistrement = async () => {
    const { agent, modifications } = modale;
    const brouillon = { ...brouillonDe(agent), ...brouillons[agent.id_agent] };
    const groupes = new Set(modifications.map((modification) => modification.groupe));

    const action = async () => {
      if (groupes.has('identite')) {
        await updateAgentIdentite(agent.id_agent, {
          nom: brouillon.nom.trim(),
          prenom: brouillon.prenom.trim(),
          email: brouillon.email.trim().toLowerCase(),
        });
      }
      if (groupes.has('role')) await updateAgentRole(agent.id_agent, brouillon.role);
      if (groupes.has('centre')) await updateAgentCentre(agent.id_agent, brouillon.id_centre);
    };

    const avertissement =
      groupes.has('role') && isCentreScoped(brouillon.role) && !brouillon.id_centre
        ? ' Attention : ce rôle ne consulte que son centre, affectez-lui en un pour ouvrir l\'accès aux dossiers.'
        : '';

    const fait = await lancerActionValidee(
      agent,
      action,
      `Compte ${agent.email} enregistré : ${modifications
        .map((modification) => modification.label)
        .join(', ')} mis à jour.${avertissement}`,
    );

    if (fait) oublierBrouillon(agent.id_agent);
  };

  const validerStatut = async () => {
    const { agent, prochainStatut } = modale;

    const fait = await lancerActionValidee(
      agent,
      () => updateAgentStatut(agent.id_agent, prochainStatut),
      prochainStatut === 'actif'
        ? `Le compte ${agent.email} est activé : l'agent peut se connecter.`
        : `Le compte ${agent.email} est bloqué : la connexion est refusée.`,
    );

    if (fait) oublierBrouillon(agent.id_agent);
  };

  const validerSuppression = async () => {
    const { agent } = modale;

    const fait = await lancerActionValidee(
      agent,
      () => deleteAgent(agent.id_agent),
      `Le compte ${agent.email} a été supprimé.`,
    );

    if (fait) fermerFiche(agent);
  };

  const validerMotDePasse = async () => {
    const { agent } = modale;

    if (motDePasseTemporaire.length < 4) {
      setModaleErreur('Le mot de passe temporaire doit contenir au moins 4 caractères.');
      return;
    }

    const fait = await lancerActionValidee(
      agent,
      () => resetAgentPassword(agent.id_agent, motDePasseTemporaire),
      `Mot de passe temporaire défini pour ${agent.email}. Communiquez-le : l'agent pourra le remplacer lui-même depuis son profil.`,
    );

    if (fait) setMotDePasseTemporaire('');
  };

  const validerAbandon = () => {
    const { agent } = modale;
    fermerFiche(agent);
    setModale(null);
  };

  // La fiche vit dans une cellule du tableau ; sur écran étroit celui-ci déborde
  // horizontalement, donc on la ramène dans la zone visible à l'ouverture.
  useEffect(() => {
    if (profileId === null) return;
    const card = document.querySelector('.agent-profile');
    if (!card) return;
    card.closest('.table-wrap')?.scrollTo({ left: 0 });
    card.scrollIntoView({ block: 'nearest' });
  }, [profileId]);

  // Après une action validée, la fiche reste la zone de travail : on la ramène
  // dans le champ visible pour qu'elle ne paraisse pas refermée.
  useEffect(() => {
    if (!success) return;
    const card = document.querySelector('.agent-profile');
    if (!card) return;
    card.closest('.table-wrap')?.scrollTo({ left: 0 });
    card.scrollIntoView({ block: 'nearest' });
  }, [success]);

  if (!peutGererComptes) {
    return (
      <section className="page">
        <div className="page-heading">
          <p className="eyebrow">Administration</p>
          <h1>Utilisateurs</h1>
        </div>
        <p className="error">
          Cette page est réservée aux administrateurs et aux chefs de centre.
          Connectez-vous avec l'un de ces comptes pour gérer les utilisateurs.
        </p>
      </section>
    );
  }

  const proprietesModale = () => {
    if (!modale) return null;
    const { agent } = modale;

    if (modale.type === 'enregistrer') {
      return {
        etiquette: `${modale.modifications.length} modification(s)`,
        titre: `Enregistrer les modifications de ${agent.email}`,
        intro:
          'Rien n\'a encore été envoyé au serveur. Validez pour appliquer ces changements au compte.',
        modifications: modale.modifications.map((modification) => ({
          label: modification.label,
          avant: afficherValeur(modification.cle, modification.avant),
          apres: afficherValeur(modification.cle, modification.apres),
        })),
        texteValider: 'Valider',
        onValider: validerEnregistrement,
      };
    }

    if (modale.type === 'statut') {
      const bloque = modale.prochainStatut === 'inactif';
      const premiereActivation = agent.statut === 'en_attente';

      return {
        etiquette: bloque ? 'Blocage' : premiereActivation ? 'Activation' : 'Réactivation',
        variante: bloque ? 'danger' : 'normale',
        titre: `${bloque ? 'Bloquer' : 'Activer'} le compte ${agent.email}`,
        intro: bloque
          ? 'La connexion sera refusée immédiatement, même si l\'agent possède encore une session ouverte.'
          : premiereActivation
            ? 'L\'agent pourra se connecter avec le mot de passe choisi à l\'inscription.'
            : 'L\'agent pourra de nouveau se connecter avec ses identifiants.',
        modifications: [
          {
            label: 'Statut',
            avant: getStatut(agent.statut).label,
            apres: getStatut(modale.prochainStatut).label,
          },
        ],
        texteValider: 'Valider',
        onValider: validerStatut,
      };
    }

    if (modale.type === 'suppression') {
      return {
        etiquette: 'Action irréversible',
        variante: 'danger',
        titre: `Supprimer le compte ${agent.email}`,
        intro:
          'Le contrôle et les relances déjà réalisés seront conservés, mais dissociés de ce compte. Cette suppression est définitive.',
        texteValider: 'Oui, supprimer',
        onValider: validerSuppression,
      };
    }

    if (modale.type === 'motdepasse') {
      return {
        etiquette: 'Mot de passe',
        titre: `Mot de passe temporaire pour ${agent.email}`,
        intro:
          'Écrivez le mot de passe que vous communiquez à l\'agent. Il pourra ensuite le remplacer lui-même depuis son profil.',
        texteValider: 'Valider',
        onValider: validerMotDePasse,
        children: (
          <label className="field">
            <span>Mot de passe temporaire (4 caractères minimum)</span>
            <div className="login-field-control">
              <input
                type={motDePasseVisible ? 'text' : 'password'}
                value={motDePasseTemporaire}
                autoComplete="new-password"
                maxLength={72}
                placeholder="Saisissez un mot de passe temporaire"
                onChange={(event) => setMotDePasseTemporaire(event.target.value)}
              />
              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setMotDePasseVisible((precedent) => !precedent)}
                aria-pressed={motDePasseVisible}
              >
                {motDePasseVisible ? 'Masquer' : 'Afficher'}
              </button>
            </div>
          </label>
        ),
      };
    }

    if (modale.type === 'abandon') {
      return {
        etiquette: 'Modifications non enregistrées',
        variante: 'danger',
        titre: 'Fermer la fiche sans enregistrer ?',
        intro: `Les modifications apportées à la fiche de ${agent.email} n'ont pas été enregistrées. Elles seront perdues.`,
        modifications: modificationsDe(agent).map((modification) => ({
          label: modification.label,
          avant: afficherValeur(modification.cle, modification.avant),
          apres: afficherValeur(modification.cle, modification.apres),
        })),
        texteValider: 'Ignorer les modifications',
        onValider: validerAbandon,
      };
    }

    return null;
  };

  const configModale = proprietesModale();

  const nomCentreCourant = currentUser?.nom_centre;

  return (
    <section className="page">
      {isAdmin && <AdminNav />}

      <div className="page-heading">
        <p className="eyebrow">{isAdmin ? 'Backoffice Administration' : 'Mon centre'}</p>
        <h1>{isAdmin ? 'Gestion des Utilisateurs' : `Équipe du centre${nomCentreCourant ? ` — ${nomCentreCourant}` : ''}`}</h1>
        <p>
          {isAdmin
            ? 'Modifiez une fiche puis appuyez sur « Enregistrer » : chaque changement, blocage, suppression et mot de passe temporaire demande une validation dans une fenêtre de confirmation. Rien n\'est écrit avant ce clic.'
            : 'Les comptes rattachés à votre centre, consultables dans le détail mais sans modification possible : seul le bouton « Bloquer » ou « Activer » change un statut, après confirmation. Rôle, centre de rattachement, identité, mot de passe et suppression restent du ressort d\'un administrateur.'}
        </p>
      </div>

      <div className="categorie-tabs">
        {FILTRES.map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={`categorie-tab${statutFilter === value ? ' active' : ''}`}
            onClick={() => {
              setStatutFilter(value);
              pages.setCurrentPage(1);
            }}
          >
            {value === 'Tous' ? `Tous (${agents.length})` : `${label} (${counts[value] || 0})`}
          </button>
        ))}
      </div>

      <div className="datatable-toolbar contribuables-toolbar flex-wrap gap-2">
        <input
          value={filter}
          onChange={(event) => {
            setFilter(event.target.value);
            pages.setCurrentPage(1);
          }}
          placeholder="Rechercher par nom, prénom, e-mail ou rôle..."
        />
        <span>{visibleAgents.length} utilisateur(s)</span>
        <button type="button" onClick={handleRefresh} disabled={loading}>
          Actualiser
        </button>
      </div>

      {error && <p className="error">{error}</p>}
      {success && (
        <p className="success form-submit-message" role="status">
          {success}
        </p>
      )}

      {loading ? (
        <p className="status">Chargement des utilisateurs...</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Rôle / Titre</th>
                <th>Statut</th>
                <th>Créé le</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pages.pageItems.map((agent) => {
                const statut = getStatut(agent.statut);
                const self = isSelf(agent);
                const busy = busyId === agent.id_agent;
                const brouillon = brouillons[agent.id_agent] ?? brouillonDe(agent);
                const def = roleDefinition(brouillon.role);
                const horsCentre = centreResume(brouillon.role, agent.nom_centre);
                const open = profileId === agent.id_agent;
                const modifications = modificationsDe(agent);
                const enAttente = modifications.length > 0;

                return (
                  <Fragment key={agent.id_agent}>
                    <tr
                      className={`admin-row admin-row-clickable${open ? ' open' : ''} ${statut.ligne}`}
                      tabIndex={0}
                      aria-expanded={open}
                      title="Cliquer pour ouvrir la fiche de ce compte"
                      onClick={(event) => {
                        if (event.target.closest('button, select, input, a')) return;
                        basculerFiche(agent);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          basculerFiche(agent);
                        }
                      }}
                    >
                      <td>
                        <div className="admin-row-user">
                          <span className="user-profile-avatar" aria-hidden="true">
                            {initialsOf(agent)}
                          </span>
                          <div>
                            <strong>
                              {agent.prenom} {agent.nom}
                            </strong>
                            <small>
                              {agent.email}
                              {self ? ' · votre compte' : ''}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        {estSeulementChefDeCentre ? (
                          <span className="agent-profile-note">{getRoleLabel(agent.role)}</span>
                        ) : (
                          <select
                            className="admin-role-select"
                            value={brouillon.role}
                            disabled={busy || self}
                            title={
                              self
                                ? 'Vous ne pouvez pas modifier votre propre rôle.'
                                : 'Changer le rôle, puis « Enregistrer » dans la fiche'
                            }
                            onChange={(event) => ecrireBrouillon(agent, 'role', event.target.value)}
                          >
                            {ROLES_AGENTS.map((role) => (
                              <option key={role.role} value={role.role}>
                                {role.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${statut.badge}`}>{statut.label}</span>
                      </td>
                      <td>{formatDate(agent.date_creation)}</td>
                      <td>
                        <div className="admin-actions">
                          <button
                            type="button"
                            className={BLUE_BUTTON}
                            aria-expanded={open}
                            title={
                              open
                                ? 'Replier la fiche de ce compte'
                                : 'Ouvrir la fiche : identité, centre de rattachement et actions'
                            }
                            onClick={() => basculerFiche(agent)}
                          >
                            {open ? '▴ Replier' : '▾ Fiche'}
                          </button>
                          {enAttente && (
                            <span className="badge surveillance" title="Modifications non enregistrées">
                              {modifications.length} à enregistrer
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>

                    {open && (
                      <tr className="admin-inline-row">
                        <td colSpan={5}>
                          <div className="agent-profile">
                            <div className="agent-profile-head">
                              <span className="user-profile-avatar" aria-hidden="true">
                                {initialsOf({ ...agent, nom: brouillon.nom, prenom: brouillon.prenom })}
                              </span>
                              <div className="agent-profile-identite">
                                <strong>
                                  {brouillon.prenom} {brouillon.nom}
                                </strong>
                                <small>
                                  {brouillon.email}
                                  {self ? ' · votre compte' : ''}
                                </small>
                              </div>
                              <span className={`badge ${statut.badge}`}>{statut.label}</span>
                              <button
                                type="button"
                                className="agent-profile-fermer"
                                aria-label="Fermer la fiche de ce compte"
                                title="Fermer la fiche"
                                onClick={() => basculerFiche(agent)}
                              >
                                ✕
                              </button>
                            </div>

                            <dl className="agent-profile-champs">
                              {estSeulementChefDeCentre && (
                                <>
                                  <div>
                                    <dt>Nom</dt>
                                    <dd>{agent.nom || '—'}</dd>
                                  </div>
                                  <div>
                                    <dt>Prénom</dt>
                                    <dd>{agent.prenom || '—'}</dd>
                                  </div>
                                  <div>
                                    <dt>Adresse e-mail</dt>
                                    <dd>{agent.email}</dd>
                                  </div>
                                  <div>
                                    <dt>Rôle / titre</dt>
                                    <dd>{getRoleLabel(agent.role)}</dd>
                                  </div>
                                  <div>
                                    <dt>Centre de rattachement</dt>
                                    <dd>
                                      {isCentreScoped(agent.role)
                                        ? (agent.nom_centre ?? 'Aucun centre')
                                        : `${horsCentre?.icon ?? ''} ${horsCentre?.texte ?? ''}`}
                                    </dd>
                                  </div>
                                </>
                              )}
                              {!estSeulementChefDeCentre && (
                                <>
                                  <div>
                                    <dt>Nom</dt>
                                    <dd>
                                      <input
                                        type="text"
                                        value={brouillon.nom}
                                        maxLength={100}
                                        disabled={busy}
                                        onChange={(event) => ecrireBrouillon(agent, 'nom', event.target.value)}
                                      />
                                    </dd>
                                  </div>
                                  <div>
                                    <dt>Prénom</dt>
                                    <dd>
                                      <input
                                        type="text"
                                        value={brouillon.prenom}
                                        maxLength={100}
                                        disabled={busy}
                                        onChange={(event) =>
                                          ecrireBrouillon(agent, 'prenom', event.target.value)
                                        }
                                      />
                                    </dd>
                                  </div>
                                  <div>
                                    <dt>Adresse e-mail</dt>
                                    <dd>
                                      <input
                                        type="email"
                                        value={brouillon.email}
                                        maxLength={255}
                                        disabled={busy}
                                        onChange={(event) =>
                                          ecrireBrouillon(agent, 'email', event.target.value)
                                        }
                                      />
                                    </dd>
                                  </div>
                                  <div>
                                    <dt>Rôle / titre</dt>
                                    <dd>
                                      <select
                                        className="admin-role-select"
                                        value={brouillon.role}
                                        disabled={busy || self}
                                        title={
                                          self
                                            ? 'Vous ne pouvez pas modifier votre propre rôle.'
                                            : 'Changer le rôle de cet utilisateur'
                                        }
                                        onChange={(event) => ecrireBrouillon(agent, 'role', event.target.value)}
                                      >
                                        {ROLES_AGENTS.map((role) => (
                                          <option key={role.role} value={role.role}>
                                            {role.label}
                                          </option>
                                        ))}
                                      </select>
                                    </dd>
                                  </div>
                                  <div>
                                    <dt>Centre de rattachement</dt>
                                    <dd>
                                      {isCentreScoped(brouillon.role) ? (
                                        <select
                                          className="admin-role-select"
                                          value={brouillon.id_centre ?? ''}
                                          disabled={busy}
                                          title={`${centres.length} centres disponibles`}
                                          onChange={(event) =>
                                            ecrireBrouillon(
                                              agent,
                                              'id_centre',
                                              event.target.value === '' ? null : Number(event.target.value),
                                            )
                                          }
                                        >
                                          <option value="">Aucun centre (accès fermé)</option>
                                          {centres.map((centre) => (
                                            <option key={centre.id_centre} value={centre.id_centre}>
                                              {centre.nom_centre}
                                            </option>
                                          ))}
                                        </select>
                                      ) : (
                                        <span
                                          className="agent-profile-note"
                                          style={{ color: horsCentre?.couleur }}
                                        >
                                          {horsCentre?.icon} {horsCentre?.texte}
                                        </span>
                                      )}
                                    </dd>
                                  </div>
                                </>
                              )}
                              <div>
                                <dt>Périmètre de consultation</dt>
                                <dd>{def.droits}</dd>
                              </div>
                              <div>
                                <dt>Compte créé le</dt>
                                <dd>{formatDate(agent.date_creation)}</dd>
                              </div>
                              <div>
                                <dt>Identifiant</dt>
                                <dd>#{agent.id_agent}</dd>
                              </div>
                            </dl>

                            <p className="agent-profile-description">{def.description}</p>

                            {!estSeulementChefDeCentre && (
                              <div className="agent-profile-pied">
                                <p className="agent-profile-brouillon">
                                  {enAttente
                                    ? `${modifications.length} modification(s) non enregistrée(s)`
                                    : 'Aucune modification en attente'}
                                </p>
                                <div className="agent-profile-boutons">
                                  {enAttente && (
                                    <button
                                      type="button"
                                      className="modale-confirmation-annuler"
                                      onClick={() => reinitialiserBrouillon(agent)}
                                    >
                                      Reprendre les valeurs enregistrées
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    className="primary"
                                    disabled={!enAttente || busy}
                                    title={
                                      enAttente
                                        ? 'Appliquer les modifications après confirmation'
                                        : 'Modifiez un champ pour activer ce bouton'
                                    }
                                    onClick={() => demanderEnregistrement(agent)}
                                  >
                                    {busy ? 'Enregistrement...' : '💾 Enregistrer'}
                                  </button>
                                </div>
                              </div>
                            )}

                            <div className="agent-profile-actions">
                              <button
                                type="button"
                                className={agent.statut === 'actif' ? AMBER_BUTTON : GREEN_BUTTON}
                                disabled={busy || self}
                                title={
                                  self
                                    ? 'Vous ne pouvez pas modifier le statut de votre propre compte.'
                                    : agent.statut === 'actif'
                                      ? 'Bloquer ce compte : la connexion sera refusée'
                                      : 'Activer ce compte : la connexion sera autorisée'
                                }
                                onClick={() => demanderStatut(agent)}
                              >
                                {agent.statut === 'actif' ? '🚫 Bloquer' : '✓ Activer'}
                              </button>
                              {isAdmin && (
                                <>
                                  <button
                                    type="button"
                                    className={BLUE_BUTTON}
                                    disabled={busy}
                                    title="Définir un mot de passe temporaire pour cet utilisateur"
                                    onClick={() => demanderMotDePasse(agent)}
                                  >
                                    🔑 Mot de passe temporaire
                                  </button>
                                  <button
                                    type="button"
                                    className={RED_BUTTON}
                                    disabled={busy || self}
                                    title={
                                      self
                                        ? 'Vous ne pouvez pas supprimer votre propre compte.'
                                        : 'Supprimer définitivement ce compte'
                                    }
                                    onClick={() => demanderSuppression(agent)}
                                  >
                                    🗑 Supprimer
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}

              {!visibleAgents.length && (
                <tr>
                  <td colSpan="5" className="empty">
                    {agents.length
                      ? 'Aucun utilisateur ne correspond à cette recherche.'
                      : 'Aucun utilisateur enregistré.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading && (
        <Pagination
          currentPage={pages.currentPage}
          onPageChange={pages.setCurrentPage}
          totalPages={pages.totalPages}
          showSinglePage={Boolean(visibleAgents.length)}
        />
      )}

      <ModaleConfirmation
        ouvert={Boolean(modale)}
        enCours={Boolean(busyId)}
        messageErreur={modaleErreur}
        onFermer={fermerModale}
        {...configModale}
      />
    </section>
  );
}
