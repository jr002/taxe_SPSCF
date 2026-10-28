import { useState } from 'react';
import * as XLSX from 'xlsx';

import { exportRapprochementsPdf, getErrorMessage } from '@/api';
import {
  buildPeriodOptions,
  declarationOf,
  ecartSens,
  formatAriary,
  formatEcart,
  matchTypeLabel,
  periodLabel,
  periodOptionLabel,
  recoupementOf,
  sourceLabel,
  statusClass,
  statusLabel,
} from '@/frontofficeagent/confrontation/utils/confrontation.utils.js';

const STATUS_OPTIONS = ['rapproche', 'a_verifier', 'ecart', 'valide', 'rejete', 'annule'];
const TYPE_OPTIONS = ['exact', 'tolerance', 'partiel', 'manuel'];

export default function RapprochementsList({
  rows,
  total,
  totalPages,
  page,
  loading,
  error,
  filters,
  onFilterChange,
  onPageChange,
  onRefresh,
  onOpenDetail,
  onGoToLaunch,
  contribuable,
  apercu = null,
}) {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const hasFilters = Boolean(filters.search || filters.periode || filters.statut || filters.type);
  const { annees: periodesAnnee, mois: periodesMois } = buildPeriodOptions(apercu);
  const periodesConnues = new Set([
    ...periodesAnnee.map((entree) => entree.value),
    ...periodesMois.map((entree) => entree.value),
  ]);
  const resetFilters = () => {
    onFilterChange('search', '');
    onFilterChange('periode', '');
    onFilterChange('statut', '');
    onFilterChange('type', '');
  };

  const exportExcel = () => {
    const sheet = XLSX.utils.json_to_sheet(rows.map((row) => ({
      Période: periodLabel(row),
      'Déclaration': declarationOf(row).id_declaration ? `#${declarationOf(row).id_declaration}` : '—',
      Recoupement: sourceLabel(recoupementOf(row).source),
      Référence: recoupementOf(row).reference || '—',
      Type: matchTypeLabel(row.type_rapprochement),
      'CA déclaré': Number(row.montant_declare || 0),
      'Montant recoupé (TTC)': Number(row.montant_recoupe || 0),
      'Écart (CA déclaré − recoupé)': Number(row.ecart || 0),
      Sens: ecartSens(row.ecart),
      Score: `${row.score || 0} %`,
      Statut: statusLabel(row.statut),
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, 'Rapprochements');
    XLSX.writeFile(workbook, `rapprochements-${contribuable.nif}.xlsx`);
  };

  const exportPdf = async () => {
    setExporting(true);
    setExportError('');
    try {
      const response = await exportRapprochementsPdf({
        id_contribuable: contribuable.id_contribuable,
        ...(filters.search && { search: filters.search }),
        ...(filters.periode && { periode: filters.periode }),
        ...(filters.statut && { statut: filters.statut }),
        ...(filters.type && { type_rapprochement: filters.type }),
      });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `confrontation-${contribuable.nif}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      setExportError(getErrorMessage(error));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <div className="section-heading">
        <span className="section-number">3</span>
        <div>
          <h2>Résultats de la confrontation</h2>
          <p>{total} rapprochement(s) enregistré(s). Cliquez sur une ligne pour ouvrir le détail.</p>
        </div>
      </div>

      <div className="datatable-toolbar cf-toolbar">
        <input
          placeholder="Référence, NIF ou raison sociale…"
          aria-label="Rechercher dans les rapprochements"
          value={filters.search}
          onChange={(event) => onFilterChange('search', event.target.value)}
        />
        <select
          aria-label="Filtrer par période"
          value={filters.periode}
          onChange={(event) => onFilterChange('periode', event.target.value)}
        >
          <option value="">Toutes les périodes</option>
          {filters.periode && !periodesConnues.has(filters.periode) && (
            <option value={filters.periode}>{periodOptionLabel(filters.periode)}</option>
          )}
          {periodesAnnee.length > 0 && (
            <optgroup label="Exercices">
              {periodesAnnee.map((entree) => (
                <option key={entree.value} value={entree.value}>{entree.label}</option>
              ))}
            </optgroup>
          )}
          {periodesMois.length > 0 && (
            <optgroup label="Mois">
              {periodesMois.map((entree) => (
                <option key={entree.value} value={entree.value}>{entree.label}</option>
              ))}
            </optgroup>
          )}
        </select>
        <select
          aria-label="Filtrer par statut"
          value={filters.statut}
          onChange={(event) => onFilterChange('statut', event.target.value)}
        >
          <option value="">Tous les statuts</option>
          {STATUS_OPTIONS.map((value) => <option key={value} value={value}>{statusLabel(value)}</option>)}
        </select>
        <select
          aria-label="Filtrer par type"
          value={filters.type}
          onChange={(event) => onFilterChange('type', event.target.value)}
        >
          <option value="">Tous les types</option>
          {TYPE_OPTIONS.map((value) => <option key={value} value={value}>{matchTypeLabel(value)}</option>)}
        </select>
        <button type="button" onClick={onRefresh} disabled={loading}>Actualiser</button>
        {hasFilters && <button type="button" onClick={resetFilters}>Effacer les filtres</button>}
        <button type="button" onClick={exportExcel} disabled={!rows.length}>Exporter Excel</button>
        <button type="button" onClick={exportPdf} disabled={!rows.length || exporting}>
          {exporting ? 'Génération du PDF…' : 'Exporter PDF'}
        </button>
      </div>

      {exportError && <p className="form-submit-message error" role="alert">{exportError}</p>}

      <div className="rule-box">
        <strong>Lecture de l’écart</strong>
        <span>
          Écart = chiffre d’affaires déclaré − montant recoupé (TTC). « Déclaré supérieur »
          signifie que les sources externes signalent moins que la déclaration ; « Recoupé
          supérieur » signifie l’inverse. Jusqu’à 1 000 Ar l’écart est toléré ; jusqu’à 5 % du
          chiffre d’affaires déclaré il reste partiel ; au-delà il devient significatif.
        </span>
      </div>

      {error && <p className="empty error">{error}</p>}

      {loading ? (
        <p className="status">Chargement…</p>
      ) : total === 0 && !hasFilters ? (
        <div className="result-card alert">
          <h3>Aucun rapprochement enregistré</h3>
          <p>Aucune confrontation n’a encore été calculée pour ce contribuable.</p>
          <button type="button" className="primary" onClick={onGoToLaunch}>Lancer une confrontation</button>
        </div>
      ) : !rows.length ? (
        <div className="result-card">
          <h3>Aucun résultat pour ces filtres</h3>
          <p>
            La recherche, la période, le statut et le type s’appliquent à l’ensemble des
            rapprochements du contribuable. Aucun ne correspond aux critères choisis.
          </p>
          <button type="button" onClick={resetFilters}>Effacer les filtres</button>
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Période</th>
                  <th>Déclaration</th>
                  <th>Recoupement</th>
                  <th>Type</th>
                  <th>CA déclaré</th>
                  <th>Recoupé (TTC)</th>
                  <th>Écart (CA − recoupé)</th>
                  <th>Statut</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const declaration = declarationOf(row);
                  const recoupement = recoupementOf(row);

                  return (
                    <tr className="clickable-row" key={row.id_rapprochement} onClick={() => onOpenDetail(row)}>
                      <td><strong>{periodLabel(row)}</strong></td>
                      <td>
                        <strong>#{declaration.id_declaration ?? '—'}</strong>
                        <span className="cf-mini">{declaration.type_declaration || 'Déclaration'}</span>
                      </td>
                      <td>
                        <strong>{sourceLabel(recoupement.source)}</strong>
                        <span className="cf-mini">{recoupement.reference || 'Sans référence'}</span>
                      </td>
                      <td>
                        <span className="cfb cfb-x">{matchTypeLabel(row.type_rapprochement)}</span>
                        <span className="cf-mini">{row.score ?? '—'} %</span>
                      </td>
                      <td>{formatAriary(row.montant_declare)}</td>
                      <td>{formatAriary(row.montant_recoupe)}</td>
                      <td>
                        <strong>{formatEcart(row.ecart)}</strong>
                        <span className="cf-mini">{ecartSens(row.ecart)}</span>
                      </td>
                      <td><span className={statusClass(row.statut)}>{statusLabel(row.statut)}</span></td>
                      <td>
                        <button
                          type="button"
                          className="table-action"
                          onClick={(event) => { event.stopPropagation(); onOpenDetail(row); }}
                        >
                          Détail
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="datatable-pagination">
            <span>{total} résultat(s)</span>
            <div>
              <button type="button" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>Précédent</button>
              <span>Page {page} / {totalPages}</span>
              <button type="button" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>Suivant</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
