interface ClubFormData {
  nom: string;
  ville: string;
  coach: string;
}

interface ModalClubProps {
  show: boolean;
  form: ClubFormData;
  onClose: () => void;
  onSubmit: () => void;
  onChange: (form: ClubFormData) => void;
}

export function ModalClub({
  show,
  form,
  onClose,
  onSubmit,
  onChange,
}: ModalClubProps) {
  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">NOUVEAU CLUB</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label>Nom du club</label>
            <input
              placeholder="Ex: Savate Club Marseille"
              value={form.nom}
              onChange={(e) => onChange({ ...form, nom: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Ville</label>
            <input
              placeholder="Ex: Marseille"
              value={form.ville}
              onChange={(e) => onChange({ ...form, ville: e.target.value })}
            />
          </div>
          <div className="form-group full-width">
            <label>Coach (optionnel)</label>
            <input
              placeholder="Ex: Jean Dupont"
              value={form.coach}
              onChange={(e) => onChange({ ...form, coach: e.target.value })}
            />
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>
            Annuler
          </button>
          <button className="btn btn-primary" onClick={onSubmit}>
            ✓ Créer le club
          </button>
        </div>
      </div>
    </div>
  );
}
