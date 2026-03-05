import { useMemo } from "react";
import { Club } from "@/types";
import { GANTS_COULEUR, getCategorieAge, getCategoriePoids, getGantStyle } from "@/lib/categories";
import { getCurrentYear } from "@/lib/ui-helpers";
import { useBottomSheetDrag } from "@/hooks/useBottomSheetDrag";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useEscapeKey } from "@/hooks/useEscapeKey";

/** Données du formulaire d'inscription d'un tireur */
interface FormData {
  nom: string;
  prenom: string;
  anneeNaissance: string;
  sexe: string;
  poids: string;
  gant: string;
  clubId: string;
  typeCompetition: string;
}

interface ModalTireurProps {
  show: boolean;
  form: FormData;
  clubs: Club[];
  saving: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onChange: (form: FormData) => void;
  onOpenClubModal: () => void;
}

/** Modale d'inscription d'un tireur avec preview en temps réel des catégories */
export function ModalTireur({
  show,
  form,
  clubs,
  saving,
  onClose,
  onSubmit,
  onChange,
  onOpenClubModal,
}: ModalTireurProps) {
  const { modalRef, onTouchStart, onTouchMove, onTouchEnd } = useBottomSheetDrag(onClose);
  useBodyScrollLock(show);
  useEscapeKey(show, onClose);

  // Preview en temps réel
  const preview = useMemo(() => {
    const annee = parseInt(form.anneeNaissance);
    const poids = parseFloat(form.poids);
    if (!annee || !poids) return null;
    const ageSaison = getCurrentYear() - annee;
    return {
      age: ageSaison,
      catAge: getCategorieAge(annee),
      catPoids: getCategoriePoids(poids, form.sexe, annee),
      gantInfo: GANTS_COULEUR.find((g) => g.value === form.gant),
    };
  }, [form.anneeNaissance, form.poids, form.sexe, form.gant]);

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-tireur-title"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="modal-handle" />
        <div className="modal-header">
          <h2 id="modal-tireur-title" className="modal-title">INSCRIPTION TIREUR</h2>
          <button className="modal-close" onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </div>

        <div className="modal-body">
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="tireur-nom">Nom</label>
            <input
              id="tireur-nom"
              placeholder="Ex: Dupont"
              value={form.nom}
              onChange={(e) => onChange({ ...form, nom: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label htmlFor="tireur-prenom">Prénom</label>
            <input
              id="tireur-prenom"
              placeholder="Ex: Mohamed"
              value={form.prenom}
              onChange={(e) => onChange({ ...form, prenom: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label htmlFor="tireur-sexe">Sexe</label>
            <select
              id="tireur-sexe"
              value={form.sexe}
              onChange={(e) => onChange({ ...form, sexe: e.target.value })}
            >
              <option value="M">Homme (Tireur)</option>
              <option value="F">Femme (Tireuse)</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="tireur-type">Type</label>
            <select
              id="tireur-type"
              value={form.typeCompetition}
              onChange={(e) => onChange({ ...form, typeCompetition: e.target.value })}
            >
              <option value="TOURNOI">Tournoi</option>
              <option value="INTERCLUB">Interclub</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="tireur-annee">Année de naissance</label>
            <input
              id="tireur-annee"
              type="number"
              placeholder="Ex: 2001"
              min="1920"
              max={getCurrentYear()}
              value={form.anneeNaissance}
              onChange={(e) =>
                onChange({ ...form, anneeNaissance: e.target.value })
              }
            />
          </div>
          <div className="form-group">
            <label htmlFor="tireur-poids">Poids (kg)</label>
            <input
              id="tireur-poids"
              type="number"
              step="0.1"
              min="20"
              max="200"
              placeholder="Ex: 72.5"
              value={form.poids}
              onChange={(e) => onChange({ ...form, poids: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label htmlFor="tireur-gant">Gant (grade)</label>
            <select
              id="tireur-gant"
              value={form.gant}
              onChange={(e) => onChange({ ...form, gant: e.target.value })}
            >
              {GANTS_COULEUR.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label} — {g.degre}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group full-width">
            <label htmlFor="tireur-club">Club</label>
            {clubs.length === 0 ? (
              <button
                className="btn btn-ghost btn-justify-center"
                onClick={onOpenClubModal}
              >
                + Créer un club d&apos;abord
              </button>
            ) : (
              <select
                id="tireur-club"
                value={form.clubId}
                onChange={(e) => onChange({ ...form, clubId: e.target.value })}
              >
                <option value="">-- Choisir un club --</option>
                {clubs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom} ({c.ville})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* PREVIEW EN TEMPS RÉEL */}
          {preview && (
            <div className="preview-box">
              <h4>📋 Catégories calculées automatiquement</h4>
              <div className="preview-grid">
                <div className="preview-item">
                  <span className="preview-label">Âge saison</span>
                  <span className="preview-value">{preview.age} ans</span>
                </div>
                <div className="preview-item">
                  <span className="preview-label">Catégorie d&apos;âge</span>
                  <span className="preview-value">{preview.catAge}</span>
                </div>
                <div className="preview-item">
                  <span className="preview-label">Catégorie de poids</span>
                  <span className="preview-value">{preview.catPoids}</span>
                </div>
              </div>
              {preview.gantInfo && (
                <div className="preview-gant-row">
                  <span className="badge-gant" style={getGantStyle(preview.gantInfo.value)}>
                    {preview.gantInfo.label}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>
            Annuler
          </button>
          <button
            className="btn btn-primary"
            onClick={onSubmit}
            disabled={saving}
          >
            {saving ? "Enregistrement..." : <><span aria-hidden="true">🥊</span> Inscrire</>}
          </button>
        </div>
      </div>
    </div>
  );
}
