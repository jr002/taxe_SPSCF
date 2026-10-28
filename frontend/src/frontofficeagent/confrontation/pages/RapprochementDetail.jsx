import { Link } from 'react-router-dom';

import { ModaleConfirmation } from '@/components/common';
import {
  declarationOf,
  ecartSens,
  formatAriary,
  formatDate,
  formatEcart,
  matchTypeLabel,
  operationLabel,
  periodLabel,
  recoupementOf,
  sourceLabel,
  statusClass,
  statusLabel,
} from '@/frontofficeagent/confrontation/utils/confrontation.utils.js';

const fields = (values) => values.map(([label, value]) => (
  <li className="comparison-item" key={label}>
    <span>{label}</span>
    <strong>{value}</strong>
  </li>
));

export default function RapprochementDetail({
  data,
  loading,
  error,
  success,
  actionError,
  modal,
  motif,
  actionLoading,
  readOnly = false,
  onBack,
  onOpenModal,
  onCloseModal,
  onMotifChange,
  onConfirm,
}) {
  if (loading) return <p className="status">Chargement…</p>;
  if (error) return <p className="empty error">{error}</p>;
  if (!data) {
    return (
      <div>
        <p className="empty">Sélectionnez un rapprochement dans la liste pour consulter son détail.</p>
        <button type="button" className="table-action" onClick={onBack}>Retour à la liste</button>
      </div>
    );
  }

  const declaration = declarationOf(data);
  const recoupement = recoupementOf(data);
  const idContribuable = declaration.contribuables?.id_contribuable;
  const ecart = Number(data.ecart || 0);
  const isMatch = ecart === 0;
  const source = sourceLabel(recoupement.source);
  const exercice = declaration.annee ? `l’exercice ${declaration.annee}` : 'la déclaration';

  const phrase = isMatch
    ? `Le recoupement « ${source} » (${formatAriary(data.montant_recoupe)}) concorde avec le chiffre d’affaires déclaré pour ${exercice} (${formatAriary(data.montant_declare)}).`
    : `Le recoupement « ${source} » (${formatAriary(data.montant_recoupe)}) ${ecart < 0
      ? 'dépasse'
      : 'reste inférieur à'} le chiffre d’affaires déclaré pour ${exercice} (${formatAriary(data.montant_declare)}) de ${formatAriary(Math.abs(ecart))}.`;

  return (
    <div>
      <button type="button" className="table-action" onClick={onBack}>Retour à la liste</button>

      <div className="declaration-detail">
        <div className="declaration-detail-heading">
          <div>
            <p className="eyebrow">Rapprochement #{data.id_rapprochement}</p>
            <h2>Détail du rapprochement</h2>
            <p>
              Type : <strong>{matchTypeLabel(data.type_rapprochement)}</strong> — Statut :{' '}
              <span className={statusClass(data.statut)}>{statusLabel(data.statut)}</span>
            </p>
          </div>
          <div>
            <p className="eyebrow">Score de cohérence</p>
            <strong>{data.score ?? '—'} %</strong>
            <p>{formatDate(data.date_rapprochement)}</p>
          </div>
        </div>
      </div>

      <div className="result-card">
        <p className="eyebrow subtle">Lecture rapide</p>
        <p>{phrase}</p>
      </div>

      {success && <p className="success form-submit-message" role="status">{success}</p>}

      <div className="comparison-grid">
        <article className="comparison-panel">
          <div className="comparison-header">
            <h2>Ce que le contribuable a déclaré</h2>
            <span>{periodLabel(data)}</span>
          </div>
          <ul className="comparison-list">
            {fields([
              ['Déclaration', `#${data.id_declaration}`],
              ['Exercice', declaration.annee || '—'],
              ['Période', declaration.periode || 'Déclaration annuelle'],
              ['Type', declaration.type_declaration || '—'],
              ['Chiffre d’affaires déclaré', formatAriary(data.montant_declare)],
              ['TVA collectée (informative)', formatAriary(declaration.tva_collectee)],
              ['TVA déductible (informative)', formatAriary(declaration.tva_deductible)],
              ['TVA à payer (informative)', formatAriary(declaration.tva_payee)],
            ])}
            {idContribuable && (
              <li className="comparison-item">
                <span>Déclarations du contribuable</span>
                <strong>
                  <Link className="table-action" to={`/contribuables/${idContribuable}/declarations`}>
                    Ouvrir
                  </Link>
                </strong>
              </li>
            )}
          </ul>
        </article>

        <article className="comparison-panel">
          <div className="comparison-header">
            <h2>Ce qu’une autre source a déclaré</h2>
            <span>{source}</span>
          </div>
          <ul className="comparison-list">
            {fields([
              ['Recoupement', `#${data.id_recoupement}`],
              ['Source', source],
              ['Référence', recoupement.reference || '—'],
              ['Montant recoupé (TTC)', formatAriary(data.montant_recoupe)],
              ['Type d’opération', operationLabel(recoupement.type_operation)],
              ['NIF tiers', recoupement.nif_tiers || '—'],
              ['Période', recoupement.periode || '—'],
              ['Date d’opération', formatDate(recoupement.date_operation)],
            ])}
          </ul>
        </article>
      </div>

      <p className="cf-lead">
        Base de comparaison : chiffre d’affaires déclaré et montant recoupé toutes taxes comprises.
        Les montants de TVA sont informatifs et n’entrent pas dans le calcul de l’écart.
      </p>

      <div className="comparison-deltas">
        <div className="comparison-deltas-header">
          <h3>L’écart</h3>
        </div>
        <div className="comparison-delta-item">
          <span>Écart (CA déclaré − recoupé)</span>
          <strong className={isMatch ? 'match' : 'alert'}>
            {formatEcart(data.ecart)} · {ecartSens(data.ecart)}
          </strong>
        </div>
        {data.motif && (
          <div className="comparison-delta-item">
            <span>Motif enregistré</span>
            <strong>{data.motif}</strong>
          </div>
        )}
      </div>

      {readOnly ? (
        <div className="rule-box">
          <strong>Actions réservées</strong>
          <span>
            Le rôle Inspecteur consulte les rapprochements en lecture seule. La validation, le rejet
            et l’annulation sont réservés aux agents et responsables de centre.
          </span>
        </div>
      ) : (
        <>
          <div className="rule-box">
            <strong>Que faire de ce rapprochement ?</strong>
            <span>
              Valider acte la concordance. « À vérifier » demande une pièce justificative.
              Rejeter motive l’écart constaté. Annuler écarte un rapprochement erroné.
            </span>
          </div>

          <div className="cf-actions">
            <p className="eyebrow">Décider</p>
            {['a_verifier', 'ecart', 'rapproche'].includes(data.statut) && (
              <button className="primary" type="button" onClick={() => onOpenModal('valide', 'Valider')}>Valider</button>
            )}
            {['rapproche', 'valide', 'ecart'].includes(data.statut) && (
              <button type="button" onClick={() => onOpenModal('a_verifier', 'Marquer à vérifier')}>À vérifier</button>
            )}
            {!['rejete', 'annule'].includes(data.statut) && (
              <button type="button" onClick={() => onOpenModal('rejete', 'Rejeter')}>Rejeter</button>
            )}
            {data.statut !== 'annule' && (
              <button type="button" onClick={() => onOpenModal('annule', 'Annuler')}>Annuler</button>
            )}
          </div>
        </>
      )}

      <ModaleConfirmation
        ouvert={Boolean(modal)}
        titre={modal ? `Confirmer : ${modal.label}` : ''}
        etiquette="Confrontation"
        intro={modal ? `Le statut sera défini sur « ${statusLabel(modal.action)} ».` : ''}
        variante={['rejete', 'annule'].includes(modal?.action) ? 'danger' : 'normale'}
        messageErreur={actionError}
        enCours={actionLoading}
        texteValider="Confirmer"
        onValider={onConfirm}
        onFermer={onCloseModal}
      >
        <label className="field">
          Motif {['rejete', 'annule'].includes(modal?.action) && '(obligatoire)'}
          <textarea rows="3" value={motif} onChange={(event) => onMotifChange(event.target.value)} />
        </label>
      </ModaleConfirmation>
    </div>
  );
}
