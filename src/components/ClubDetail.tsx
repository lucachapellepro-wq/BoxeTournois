import { useState } from "react";
import { Club } from "@/types";

interface ClubDetailProps {
  club: Club;
  onUpdate: (id: number, data: Partial<Club>) => Promise<void>;
}

export function ClubDetail({ club, onUpdate }: ClubDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nom: club.nom,
    ville: club.ville,
    coach: club.coach || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(club.id, formData);
      setIsEditing(false);
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      nom: club.nom,
      ville: club.ville,
      coach: club.coach || "",
    });
    setIsEditing(false);
  };

  return (
    <div className="club-detail">
      <div className="club-detail-header">
        <h2>📍 Informations du club</h2>
        {!isEditing && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setIsEditing(true)}
          >
            ✏️ Modifier
          </button>
        )}
      </div>

      <div className="club-detail-content">
        {isEditing ? (
          <>
            <div className="form-group">
              <label>Nom du club</label>
              <input
                type="text"
                value={formData.nom}
                onChange={(e) =>
                  setFormData({ ...formData, nom: e.target.value })
                }
                className="input"
              />
            </div>

            <div className="form-group">
              <label>Ville</label>
              <input
                type="text"
                value={formData.ville}
                onChange={(e) =>
                  setFormData({ ...formData, ville: e.target.value })
                }
                className="input"
              />
            </div>

            <div className="form-group">
              <label>Coach (optionnel)</label>
              <input
                type="text"
                value={formData.coach}
                onChange={(e) =>
                  setFormData({ ...formData, coach: e.target.value })
                }
                className="input"
              />
            </div>

            <div className="club-detail-actions">
              <button
                className="btn btn-secondary"
                onClick={handleCancel}
                disabled={saving}
              >
                Annuler
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Sauvegarde..." : "Sauvegarder"}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="club-detail-row">
              <span className="club-detail-label">Nom :</span>
              <span className="club-detail-value">{club.nom}</span>
            </div>

            <div className="club-detail-row">
              <span className="club-detail-label">Ville :</span>
              <span className="club-detail-value">{club.ville}</span>
            </div>

            <div className="club-detail-row">
              <span className="club-detail-label">Coach :</span>
              <span className="club-detail-value">{club.coach || "—"}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
