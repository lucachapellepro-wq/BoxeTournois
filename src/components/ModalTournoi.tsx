import { useBottomSheetDrag } from "@/hooks/useBottomSheetDrag";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

/** Props de la modale tournoi (création ou édition) */
interface ModalTournoiProps {
  show: boolean;
  form: {
    nom: string;
    date: string;
  };
  isEditing: boolean;
  saving: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onChange: (form: { nom: string; date: string }) => void;
}

/** Modale de création/édition d'un tournoi (nom + date) */
export function ModalTournoi({
  show,
  form,
  isEditing,
  saving,
  onClose,
  onSubmit,
  onChange,
}: ModalTournoiProps) {
  const { modalRef, onTouchStart, onTouchMove, onTouchEnd } = useBottomSheetDrag(onClose);
  useBodyScrollLock(show);

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="modal-handle" />
        <div className="modal-header">
          <h2 className="modal-title">{isEditing ? "Modifier le tournoi" : "Nouveau tournoi"}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="nom">Nom du tournoi</label>
            <input
              id="nom"
              type="text"
              placeholder="Ex: Championnat Savoie 2026"
              value={form.nom}
              onChange={(e) => onChange({ ...form, nom: e.target.value })}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="date">Date du tournoi</label>
            <input
              id="date"
              type="date"
              value={form.date}
              onChange={(e) => onChange({ ...form, date: e.target.value })}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>
            Annuler
          </button>
          <button
            className="btn btn-primary"
            onClick={onSubmit}
            disabled={saving || !form.nom || !form.date}
          >
            {saving ? "Enregistrement..." : isEditing ? "Sauvegarder" : "Créer"}
          </button>
        </div>
      </div>
    </div>
  );
}
