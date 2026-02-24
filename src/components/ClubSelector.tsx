import { Club } from "@/types";

/** Props du sélecteur de club */
interface ClubSelectorProps {
  clubs: Club[];
  selectedId: number | null;
  onChange: (id: number | null) => void;
}

/** Dropdown de sélection d'un club */
export function ClubSelector({
  clubs,
  selectedId,
  onChange,
}: ClubSelectorProps) {
  return (
    <div className="club-selector">
      <label htmlFor="club-select">Sélectionner un club :</label>
      <select
        id="club-select"
        value={selectedId || ""}
        onChange={(e) => { const val = parseInt(e.target.value); onChange(isNaN(val) ? null : val); }}
        className="select-club"
      >
        <option value="">-- Choisir un club --</option>
        {clubs.map((club) => (
          <option key={club.id} value={club.id}>
            {club.nom} ({club.ville})
          </option>
        ))}
      </select>
    </div>
  );
}
