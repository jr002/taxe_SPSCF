// ---------------------------------------------------------------------------
// Point d'entrée centralisé pour les composants Pages de l'application
// Architecture modulaire par domaine fonctionnel (SP2CF / TVA•SSIF)
// ---------------------------------------------------------------------------

// Accueil
export { default as Accueil } from './accueil/Accueil';

// Collecte & Simulation dynamique
export { default as Collecte } from './collecte/Collecte';
export { default as CollecterDeductible } from './collecte/modules/CollecterDeductible';
export { default as TheoreticalForm } from './collecte/modules/TheoreticalForm';
export { default as ReconciliationForm } from './collecte/modules/ReconciliationForm';
export { default as InsertionDeclaration } from './collecte/modules/InsertionDeclaration';

// Entreprises / Immatriculation
export { default as PhaseClassement } from './entreprises/PhaseClassement';
export { default as FormInformation } from './entreprises/FormInformation';

// Portefeuille Contribuables
export { default as Contribuables } from './contribuables/Contribuables';
export { default as ContribuableDetail } from './contribuables/ContribuableDetail';
export { default as Confrontation } from './contribuables/pages/Confrontation';

// Suivi fiscal & Contrôle contradictoire
export { default as SuiviFiscal } from './suivi-fiscal/SuiviFiscal';
export { default as DeclarationDetail } from './suivi-fiscal/DeclarationDetail';

// Registre & Centres fiscaux
export { default as Register } from './centres/Register';
export { default as CentreDetail } from './centres/CentreDetail';

// Tableau de bord décisionnel & KPIs
export { default as TableauDecisionnel } from './decisionnel/TableauDecisionnel';

// Relance Fiscale & Recouvrement
export { default as RelanceFiscale } from './relance/RelanceFiscale';
