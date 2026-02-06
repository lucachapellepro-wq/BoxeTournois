"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Boxeur {
  id: number;
  nom: string;
  prenom: string;
  sexe: string;
  poids: number;
  categoriePoids: string;
  categorieAge: string;
  gant: string;
  club: {
    nom: string;
  };
}

interface TournoiDetail {
  id: number;
  nom: string;
  date: string;
  boxeurs: Array<{
    boxeur: Boxeur;
  }>;
}

export default function CategoriesPage() {
  const params = useParams();
  const tournoiId = parseInt(params.id as string);
  const [tournoi, setTournoi] = useState<TournoiDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTournoi();
  }, [tournoiId]);

  const fetchTournoi = async () => {
    try {
      const res = await fetch(`/api/tournois/${tournoiId}`);
      if (res.ok) {
        const data = await res.json();
        setTournoi(data);
      }
    } catch (error) {
      console.error("Erreur fetch tournoi:", error);
    } finally {
      setLoading(false);
    }
  };

  // Grouper par sexe puis catégorie de poids
  const categoriesBySexe = useMemo(() => {
    if (!tournoi) return { F: [], M: [] };

    const femmes = new Map<string, Boxeur[]>();
    const hommes = new Map<string, Boxeur[]>();

    tournoi.boxeurs.forEach((tb) => {
      const boxeur = tb.boxeur;
      const key = boxeur.categoriePoids;

      if (boxeur.sexe === "F") {
        if (!femmes.has(key)) femmes.set(key, []);
        femmes.get(key)!.push(boxeur);
      } else {
        if (!hommes.has(key)) hommes.set(key, []);
        hommes.get(key)!.push(boxeur);
      }
    });

    return {
      F: Array.from(femmes.entries()).sort(([a], [b]) => a.localeCompare(b)),
      M: Array.from(hommes.entries()).sort(([a], [b]) => a.localeCompare(b)),
    };
  }, [tournoi]);

  const totalBoxeurs = tournoi?.boxeurs.length || 0;
  const totalFemmes = categoriesBySexe.F.reduce((acc, [, boxeurs]) => acc + boxeurs.length, 0);
  const totalHommes = categoriesBySexe.M.reduce((acc, [, boxeurs]) => acc + boxeurs.length, 0);

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: 40 }}>
        <div className="card">
          <p style={{ textAlign: "center", padding: 40, color: "#888" }}>
            Chargement...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 40 }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            📊 Catégories - {tournoi?.nom || "Tournoi"}
          </h1>
          <p className="page-subtitle">
            {tournoi && new Date(tournoi.date).toLocaleDateString("fr-FR", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href={`/tournois/${tournoiId}`} className="btn btn-ghost">
            ← Retour au tournoi
          </Link>
          <Link href={`/tournois/${tournoiId}/affrontements`} className="btn btn-primary">
            🥊 Affrontements
          </Link>
        </div>
      </div>

      {/* Stats globales */}
      <div
        className="card"
        style={{
          marginTop: 24,
          display: "flex",
          justifyContent: "space-around",
          padding: 20,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, fontWeight: "bold", color: "#d4a337" }}>
            {totalBoxeurs}
          </div>
          <div style={{ fontSize: 13, color: "#888" }}>Total tireurs</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, fontWeight: "bold", color: "#e63946" }}>
            {totalFemmes}
          </div>
          <div style={{ fontSize: 13, color: "#888" }}>Femmes</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, fontWeight: "bold", color: "#3498db" }}>
            {totalHommes}
          </div>
          <div style={{ fontSize: 13, color: "#888" }}>Hommes</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, fontWeight: "bold", color: "#888" }}>
            {categoriesBySexe.F.length + categoriesBySexe.M.length}
          </div>
          <div style={{ fontSize: 13, color: "#888" }}>Catégories</div>
        </div>
      </div>

      {/* Femmes */}
      {categoriesBySexe.F.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h2
            style={{
              fontSize: 28,
              marginBottom: 24,
              color: "#e63946",
              borderBottom: "3px solid #e63946",
              paddingBottom: 12,
            }}
          >
            👩 FEMMES ({totalFemmes} tireuses)
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {categoriesBySexe.F.map(([category, boxeurs]) => (
              <div
                key={category}
                className="card"
                style={{
                  padding: 20,
                  borderLeft: "4px solid #e63946",
                }}
              >
                <div style={{ fontSize: 20, fontWeight: "bold", marginBottom: 8, color: "#e63946" }}>
                  {category}
                </div>
                <div style={{ fontSize: 32, fontWeight: "bold", color: "#d4a337", marginBottom: 12 }}>
                  {boxeurs.length}
                </div>
                <div style={{ fontSize: 14, color: "#888", marginBottom: 16 }}>
                  {boxeurs.length === 1 ? "tireuse" : "tireuses"}
                </div>

                {/* Liste des boxeurs */}
                <div style={{ borderTop: "1px solid #2a2a2a", paddingTop: 12 }}>
                  {boxeurs.map((boxeur) => (
                    <div
                      key={boxeur.id}
                      style={{
                        fontSize: 13,
                        marginBottom: 8,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <strong>{boxeur.nom.toUpperCase()}</strong> {boxeur.prenom}
                      </div>
                      <div style={{ display: "flex", gap: 4 }}>
                        <span
                          className="badge"
                          style={{
                            fontSize: 11,
                            backgroundColor: "#88888820",
                            color: "#888",
                          }}
                        >
                          {boxeur.poids}kg
                        </span>
                        <span
                          className="badge"
                          style={{
                            fontSize: 11,
                            backgroundColor: "#3498db20",
                            color: "#3498db",
                          }}
                        >
                          {boxeur.gant}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hommes */}
      {categoriesBySexe.M.length > 0 && (
        <div style={{ marginTop: 48 }}>
          <h2
            style={{
              fontSize: 28,
              marginBottom: 24,
              color: "#3498db",
              borderBottom: "3px solid #3498db",
              paddingBottom: 12,
            }}
          >
            👨 HOMMES ({totalHommes} tireurs)
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {categoriesBySexe.M.map(([category, boxeurs]) => (
              <div
                key={category}
                className="card"
                style={{
                  padding: 20,
                  borderLeft: "4px solid #3498db",
                }}
              >
                <div style={{ fontSize: 20, fontWeight: "bold", marginBottom: 8, color: "#3498db" }}>
                  {category}
                </div>
                <div style={{ fontSize: 32, fontWeight: "bold", color: "#d4a337", marginBottom: 12 }}>
                  {boxeurs.length}
                </div>
                <div style={{ fontSize: 14, color: "#888", marginBottom: 16 }}>
                  {boxeurs.length === 1 ? "tireur" : "tireurs"}
                </div>

                {/* Liste des boxeurs */}
                <div style={{ borderTop: "1px solid #2a2a2a", paddingTop: 12 }}>
                  {boxeurs.map((boxeur) => (
                    <div
                      key={boxeur.id}
                      style={{
                        fontSize: 13,
                        marginBottom: 8,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <strong>{boxeur.nom.toUpperCase()}</strong> {boxeur.prenom}
                      </div>
                      <div style={{ display: "flex", gap: 4 }}>
                        <span
                          className="badge"
                          style={{
                            fontSize: 11,
                            backgroundColor: "#88888820",
                            color: "#888",
                          }}
                        >
                          {boxeur.poids}kg
                        </span>
                        <span
                          className="badge"
                          style={{
                            fontSize: 11,
                            backgroundColor: "#3498db20",
                            color: "#3498db",
                          }}
                        >
                          {boxeur.gant}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {totalBoxeurs === 0 && (
        <div className="card" style={{ marginTop: 24 }}>
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <p>Aucun tireur inscrit pour le moment</p>
            <p style={{ fontSize: 14, color: "#666", marginTop: 8 }}>
              Ajoute des tireurs au tournoi pour voir les catégories
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
