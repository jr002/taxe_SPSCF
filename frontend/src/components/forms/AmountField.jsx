/**
 * Champ de saisie monétaire avec libellé et suffixe en Ariary (Ar)
 */
export default function AmountField({
  intitule,
  nomChamp,
  valeur,
  surChangement,
  requis = false,
  min = 0,
}) {
  return (
    <label className="field">
      <span>
        {intitule} {requis && <b className="text-red-500">*</b>}
      </span>
      <div className="input-wrap">
        <input
          type="number"
          min={min}
          name={nomChamp}
          value={valeur}
          onChange={surChangement}
          placeholder="0"
        />
        <small>Ar</small>
      </div>
    </label>
  );
}
