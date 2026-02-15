import { Boxeur, Club } from "@/types";

interface StatsProps {
  boxeurs: Boxeur[];
  clubs: Club[];
  statsByAge: [string, number][];
}

export function Stats({ boxeurs, clubs, statsByAge }: StatsProps) {
  const hommes = boxeurs.filter((b) => b.sexe === "M").length;
  const femmes = boxeurs.filter((b) => b.sexe === "F").length;

  return (
    <div className="stats-row">
      <div className="stat-card">
        <div className="stat-value" style={{ color: "var(--gold)" }}>{boxeurs.length}</div>
        <div className="stat-label">Tireurs inscrits</div>
      </div>
      <div className="stat-card">
        <div className="stat-value" style={{ color: "var(--interclub-green)" }}>{clubs.length}</div>
        <div className="stat-label">Clubs</div>
      </div>
      <div className="stat-card">
        <div className="stat-value" style={{ color: "var(--blue)" }}>{hommes}</div>
        <div className="stat-label">Tireurs (H)</div>
      </div>
      <div className="stat-card">
        <div className="stat-value" style={{ color: "var(--accent)" }}>{femmes}</div>
        <div className="stat-label">Tireuses (F)</div>
      </div>
      {statsByAge.slice(0, 2).map(([cat, count]) => (
        <div className="stat-card" key={cat}>
          <div className="stat-value">{count}</div>
          <div className="stat-label">{cat}</div>
        </div>
      ))}
    </div>
  );
}
