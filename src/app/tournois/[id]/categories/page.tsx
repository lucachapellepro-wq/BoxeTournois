"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { sortByWeight } from "@/lib/ui-helpers";

interface Boxeur {
  id: number;
  nom: string;
  prenom: string;
  sexe: string;
  poids: number;
  categoriePoids: string;
  categorieAge: string;
  gant: string;
  typeCompetition: string;
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
  const [typeFilter, setTypeFilter] = useState<"TOUS" | "TOURNOI" | "INTERCLUB">("TOUS");

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
      if (typeFilter !== "TOUS" && boxeur.typeCompetition !== typeFilter) return;
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
      F: Array.from(femmes.entries()).sort(([a], [b]) => sortByWeight(a, b)),
      M: Array.from(hommes.entries()).sort(([a], [b]) => sortByWeight(a, b)),
    };
  }, [tournoi, typeFilter]);

  const totalBoxeurs = tournoi?.boxeurs.length || 0;
  const totalFemmes = categoriesBySexe.F.reduce((acc, [, boxeurs]) => acc + boxeurs.length, 0);
  const totalHommes = categoriesBySexe.M.reduce((acc, [, boxeurs]) => acc + boxeurs.length, 0);

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: 40 }}>
        <div className="card">
          <div className="loading-state"><div className="spinner" /></div>
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
        <div className="page-header-actions">
          <Link href={`/tournois/${tournoiId}`} className="btn btn-ghost">
            ← Retour au tournoi
          </Link>
          <Link href={`/tournois/${tournoiId}/affrontements`} className="btn btn-primary">
            🥊 Affrontements
          </Link>
        </div>
      </div>

      {/* Stats globales */}
      <div className="card stats-bar section-gap">
        <div className="stats-bar-item">
          <div className="stats-bar-value" style={{ color: "var(--gold)" }}>{totalBoxeurs}</div>
          <div className="stats-bar-label">Total tireurs</div>
        </div>
        <div className="stats-bar-item">
          <div className="stats-bar-value" style={{ color: "var(--accent)" }}>{totalFemmes}</div>
          <div className="stats-bar-label">Femmes</div>
        </div>
        <div className="stats-bar-item">
          <div className="stats-bar-value" style={{ color: "var(--blue)" }}>{totalHommes}</div>
          <div className="stats-bar-label">Hommes</div>
        </div>
        <div className="stats-bar-item">
          <div className="stats-bar-value" style={{ color: "var(--text-secondary)" }}>{categoriesBySexe.F.length + categoriesBySexe.M.length}</div>
          <div className="stats-bar-label">Catégories</div>
        </div>
      </div>

      {/* Filtre Tournoi/Interclub */}
      <div className="filter-group section-gap">
        {(["TOUS", "TOURNOI", "INTERCLUB"] as const).map((t) => (
          <button
            key={t}
            className={`btn btn-sm ${typeFilter === t ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setTypeFilter(t)}
          >
            {t === "TOUS" ? "Tous" : t === "TOURNOI" ? "Tournoi" : "Interclub"}
          </button>
        ))}
      </div>

      {/* Femmes */}
      {categoriesBySexe.F.length > 0 && (
        <div className="section-gap-lg">
          <h2 className="section-header section-header-femmes">
            👩 FEMMES ({totalFemmes} tireuses)
          </h2>

          <div className="category-grid">
            {categoriesBySexe.F.map(([category, boxeurs]) => (
              <div key={category} className="card category-card category-card-femme">
                <div className="category-card-title" style={{ color: "var(--accent)" }}>
                  {category}
                </div>
                <div className="category-card-count">{boxeurs.length}</div>
                <div className="category-card-label">
                  {boxeurs.length === 1 ? "tireuse" : "tireuses"}
                </div>

                <div className="category-card-list">
                  {boxeurs.map((boxeur) => (
                    <div key={boxeur.id} className="category-card-row">
                      <div>
                        <strong>{boxeur.nom.toUpperCase()}</strong> {boxeur.prenom}
                      </div>
                      <div style={{ display: "flex", gap: 4 }}>
                        <span className={`badge ${boxeur.typeCompetition === "INTERCLUB" ? "badge-interclub" : "badge-tournoi"}`} style={{ fontSize: 11 }}>
                          {boxeur.typeCompetition === "INTERCLUB" ? "Interclub" : "Tournoi"}
                        </span>
                        <span className="badge badge-sexe" style={{ fontSize: 11 }}>
                          {boxeur.poids}kg
                        </span>
                        <span className="badge badge-category" style={{ fontSize: 11 }}>
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
        <div className="section-gap-lg">
          <h2 className="section-header section-header-hommes">
            👨 HOMMES ({totalHommes} tireurs)
          </h2>

          <div className="category-grid">
            {categoriesBySexe.M.map(([category, boxeurs]) => (
              <div key={category} className="card category-card category-card-homme">
                <div className="category-card-title" style={{ color: "var(--blue)" }}>
                  {category}
                </div>
                <div className="category-card-count">{boxeurs.length}</div>
                <div className="category-card-label">
                  {boxeurs.length === 1 ? "tireur" : "tireurs"}
                </div>

                <div className="category-card-list">
                  {boxeurs.map((boxeur) => (
                    <div key={boxeur.id} className="category-card-row">
                      <div>
                        <strong>{boxeur.nom.toUpperCase()}</strong> {boxeur.prenom}
                      </div>
                      <div style={{ display: "flex", gap: 4 }}>
                        <span className={`badge ${boxeur.typeCompetition === "INTERCLUB" ? "badge-interclub" : "badge-tournoi"}`} style={{ fontSize: 11 }}>
                          {boxeur.typeCompetition === "INTERCLUB" ? "Interclub" : "Tournoi"}
                        </span>
                        <span className="badge badge-sexe" style={{ fontSize: 11 }}>
                          {boxeur.poids}kg
                        </span>
                        <span className="badge badge-category" style={{ fontSize: 11 }}>
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
        <div className="card section-gap">
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <p>Aucun tireur inscrit pour le moment</p>
            <p className="empty-hint">
              Ajoute des tireurs au tournoi pour voir les catégories
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
