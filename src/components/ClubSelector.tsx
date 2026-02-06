import { Club } from "@/types";

interface ClubSelectorProps {
  clubs: Club[];
  selectedId: number | null;
  onChange: (id: number) => void;
}

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
        onChange={(e) => onChange(parseInt(e.target.value))}
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
