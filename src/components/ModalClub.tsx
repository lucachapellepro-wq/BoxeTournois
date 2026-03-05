import { useBottomSheetDrag } from "@/hooks/useBottomSheetDrag";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useEscapeKey } from "@/hooks/useEscapeKey";

/** Données du formulaire de création de club */
interface ClubFormData {
  nom: string;
  ville: string;
  coach: string;
  couleur: string;
}

/** Couleurs prédéfinies proposées dans le sélecteur */
const PRESET_COLORS = [
  "#e63946", "#f59e0b", "#22c55e", "#3b82f6", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16",
];

/** Noms lisibles pour les couleurs (accessibilité screen reader) */
const COLOR_NAMES: Record<string, string> = {
  "#e63946": "Rouge",
  "#f59e0b": "Ambre",
  "#22c55e": "Vert",
  "#3b82f6": "Bleu",
  "#8b5cf6": "Violet",
  "#ec4899": "Rose",
  "#14b8a6": "Turquoise",
  "#f97316": "Orange",
  "#6366f1": "Indigo",
  "#84cc16": "Citron vert",
};

/** Props de la modale de création de club */
interface ModalClubProps {
  show: boolean;
  form: ClubFormData;
  onClose: () => void;
  onSubmit: () => void;
  onChange: (form: ClubFormData) => void;
}

/** Modale de création d'un club avec sélecteur de couleur (presets + custom) */
export function ModalClub({
  show,
  form,
  onClose,
  onSubmit,
  onChange,
}: ModalClubProps) {
  const { modalRef, onTouchStart, onTouchMove, onTouchEnd } = useBottomSheetDrag(onClose);
  useBodyScrollLock(show);
  useEscapeKey(show, onClose);

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-club-title"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="modal-handle" />
        <div className="modal-header">
          <h2 id="modal-club-title" className="modal-title">NOUVEAU CLUB</h2>
          <button className="modal-close" onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </div>
        <div className="modal-body">
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="club-nom">Nom du club</label>
            <input
              id="club-nom"
              placeholder="Ex: Savate Club Marseille"
              value={form.nom}
              onChange={(e) => onChange({ ...form, nom: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label htmlFor="club-ville">Ville</label>
            <input
              id="club-ville"
              placeholder="Ex: Marseille"
              value={form.ville}
              onChange={(e) => onChange({ ...form, ville: e.target.value })}
            />
          </div>
          <div className="form-group full-width">
            <label htmlFor="club-coach">Coach (optionnel)</label>
            <input
              id="club-coach"
              placeholder="Ex: Jean Dupont"
              value={form.coach}
              onChange={(e) => onChange({ ...form, coach: e.target.value })}
            />
          </div>
          <div className="form-group full-width">
            <label htmlFor="club-couleur">Couleur du club</label>
            <div className="color-picker-row">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`color-swatch${form.couleur === c ? " color-swatch-active" : ""}`}
                  style={{ backgroundColor: c }}
                  onClick={() => onChange({ ...form, couleur: c })}
                  aria-label={`Couleur ${COLOR_NAMES[c] ?? c}`}
                />
              ))}
              <input
                id="club-couleur"
                type="color"
                value={form.couleur || "#22c55e"}
                onChange={(e) => onChange({ ...form, couleur: e.target.value })}
                className="color-input"
              />
              {form.couleur && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => onChange({ ...form, couleur: "" })}
                  aria-label="Supprimer la couleur"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
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
