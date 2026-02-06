import { useMemo } from "react";
import { Club } from "@/types";
import { GANTS_COULEUR } from "@/lib/categories";

interface FormData {
  nom: string;
  prenom: string;
  anneeNaissance: string;
  sexe: string;
  poids: string;
  gant: string;
  clubId: string;
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

// Fonctions de calcul côté client
function calcCatAge(annee: number | null): string {
  if (!annee) return "—";
  const age = new Date().getFullYear() - annee;
  if (age <= 9) return "Pré-poussins";
  if (age <= 11) return "Poussins";
  if (age <= 13) return "Benjamins";
  if (age <= 15) return "Minimes";
  if (age <= 17) return "Cadets";
  if (age <= 20) return "Juniors";
  if (age <= 34) return "Seniors";
  if (age <= 39) return "Vétérans Combat";
  return "Vétérans";
}

function calcCatPoids(poids: number, sexe: string, annee: number | null): string {
  if (!annee) return "—";
  const age = new Date().getFullYear() - annee;
  const estJeune = age <= 17;

  const jeunesCats = [
    { max: 24, nom: "Moustique" }, { max: 27, nom: "Pré-mini-mouche" },
    { max: 30, nom: "Pré-mini-coq" }, { max: 33, nom: "Pré-mini-plume" },
    { max: 36, nom: "Pré-mini-léger" }, { max: 39, nom: "Mini-mouche" },
    { max: 42, nom: "Mini-coq" }, { max: 45, nom: "Mini-plume" },
    { max: 48, nom: "Mini-léger" }, { max: 51, nom: "Mouche" },
    { max: 54, nom: "Coq" }, { max: 57, nom: "Plume" },
    { max: 60, nom: "Super-plume" }, { max: 63, nom: "Léger" },
    { max: 66, nom: "Super-léger" }, { max: 70, nom: "Mi-moyen" },
    { max: 74, nom: "Super-mi-moyen" }, { max: 79, nom: "Moyen" },
    { max: 85, nom: "Mi-lourd" }, { max: 9999, nom: "Lourd" },
  ];
  const hommesCats = [
    { max: 48, nom: "Mouche" }, { max: 52, nom: "Coq" },
    { max: 56, nom: "Plume" }, { max: 60, nom: "Léger" },
    { max: 65, nom: "Super-léger" }, { max: 70, nom: "Mi-moyen" },
    { max: 75, nom: "Super-mi-moyen" }, { max: 80, nom: "Moyen" },
    { max: 85, nom: "Mi-lourd" }, { max: 9999, nom: "Lourd" },
  ];
  const femmesCats = [
    { max: 48, nom: "Mouche" }, { max: 52, nom: "Coq" },
    { max: 56, nom: "Plume" }, { max: 60, nom: "Léger" },
    { max: 65, nom: "Super-léger" }, { max: 70, nom: "Mi-moyen" },
    { max: 75, nom: "Super-mi-moyen" }, { max: 9999, nom: "Moyen" },
  ];

  const cats = estJeune ? jeunesCats : sexe === "F" ? femmesCats : hommesCats;
  const cat = cats.find((c) => poids <= c.max);
  if (!cat) return "—";
  const idx = cats.indexOf(cat);
  const min = idx > 0 ? cats[idx - 1].max : 0;
  if (cat.max === 9999) return `${cat.nom} (+${min}kg)`;
  return `${cat.nom} (${min}-${cat.max}kg)`;
}

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
  // Preview en temps réel
  const preview = useMemo(() => {
    const annee = parseInt(form.anneeNaissance);
    const poids = parseFloat(form.poids);
    if (!annee || !poids) return null;
    const ageSaison = new Date().getFullYear() - annee;
    return {
      age: ageSaison,
      catAge: calcCatAge(annee),
      catPoids: calcCatPoids(poids, form.sexe, annee),
      gantInfo: GANTS_COULEUR.find((g) => g.value === form.gant),
    };
  }, [form.anneeNaissance, form.poids, form.sexe, form.gant]);

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">INSCRIPTION TIREUR</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>Nom</label>
            <input
              placeholder="Ex: Dupont"
              value={form.nom}
              onChange={(e) => onChange({ ...form, nom: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Prénom</label>
            <input
              placeholder="Ex: Mohamed"
              value={form.prenom}
              onChange={(e) => onChange({ ...form, prenom: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Sexe</label>
            <select
              value={form.sexe}
              onChange={(e) => onChange({ ...form, sexe: e.target.value })}
            >
              <option value="M">Homme (Tireur)</option>
              <option value="F">Femme (Tireuse)</option>
            </select>
          </div>
          <div className="form-group">
            <label>Année de naissance (optionnel)</label>
            <input
              type="number"
              placeholder="Ex: 2001 (optionnel)"
              min="1950"
              max={new Date().getFullYear()}
              value={form.anneeNaissance}
              onChange={(e) =>
                onChange({ ...form, anneeNaissance: e.target.value })
              }
            />
          </div>
          <div className="form-group">
            <label>Poids (kg)</label>
            <input
              type="number"
              step="0.1"
              placeholder="Ex: 72.5"
              value={form.poids}
              onChange={(e) => onChange({ ...form, poids: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Gant (grade)</label>
            <select
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
            <label>Club</label>
            {clubs.length === 0 ? (
              <button
                className="btn btn-ghost"
                style={{ justifyContent: "center" }}
                onClick={onOpenClubModal}
              >
                + Créer un club d&apos;abord
              </button>
            ) : (
              <select
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
                <div style={{ marginTop: 12 }}>
                  <span
                    className="badge-gant"
                    style={{
                      color:
                        preview.gantInfo.value === "blanc"
                          ? "#1a1a1a"
                          : preview.gantInfo.color,
                      borderColor: preview.gantInfo.color,
                      backgroundColor:
                        preview.gantInfo.value === "blanc"
                          ? preview.gantInfo.color
                          : `${preview.gantInfo.color}20`,
                    }}
                  >
                    <span
                      className="gant-dot"
                      style={{ backgroundColor: preview.gantInfo.color }}
                    ></span>
                    {preview.gantInfo.label}
                  </span>
                </div>
              )}
            </div>
          )}
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
            {saving ? "Enregistrement..." : "🥊 Inscrire"}
          </button>
        </div>
      </div>
    </div>
  );
}
