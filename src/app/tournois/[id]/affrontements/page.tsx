"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useMatches } from "@/hooks/useMatches";
import { useToast } from "@/hooks/useToast";
import { Toast } from "@/components/Toast";
import { BracketView } from "@/components/BracketView";
import { PoolView } from "@/components/PoolView";
import { BoxeursSeulsView } from "@/components/BoxeursSeulsView";
import Link from "next/link";
import { Boxeur, TournoiDetail } from "@/types";

export default function AffrontementsPage() {
  const params = useParams();
  const tournoiId = parseInt(params.id as string);
  const { matches, loading, stats, fetchMatches, generateMatches, createManualMatch } = useMatches(tournoiId);
  const { toast, showToast } = useToast();

  const [tournoi, setTournoi] = useState<TournoiDetail | null>(null);
  const [activeTab, setActiveTab] = useState<"BRACKET" | "POOL">("BRACKET");
  const [showConfirmGenerate, setShowConfirmGenerate] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [matchBuilder, setMatchBuilder] = useState<{ boxeur1: Boxeur | null }>({ boxeur1: null });
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchSearch, setMatchSearch] = useState("");

  useEffect(() => {
    fetchTournoi();
    fetchMatches();
  }, [fetchMatches]);

  const fetchTournoi = async () => {
    try {
      const res = await fetch(`/api/tournois/${tournoiId}`);
      if (res.ok) {
        const data = await res.json();
        setTournoi(data);
      }
    } catch (error) {
      console.error("Erreur fetch tournoi:", error);
    }
  };

  const handleGenerateMatches = async (regenerate: boolean = false) => {
    setGenerating(true);
    try {
      const success = await generateMatches(regenerate);
      if (success) {
        showToast(
          regenerate ? "Matchs régénérés ✓" : "Matchs générés ✓",
          "success"
        );
        setShowConfirmGenerate(false);
      } else {
        showToast("Erreur lors de la génération", "error");
      }
    } catch {
      showToast("Erreur réseau", "error");
    } finally {
      setGenerating(false);
    }
  };

  const handleOpenMatchBuilder = (boxeur?: Boxeur) => {
    setMatchBuilder({ boxeur1: boxeur || null });
    setShowMatchModal(true);
    setMatchSearch("");
  };

  const handleSelectBoxeur = async (boxeur: Boxeur) => {
    if (!matchBuilder.boxeur1) {
      // Étape 1 : sélectionner boxeur 1
      setMatchBuilder({ boxeur1: boxeur });
      setMatchSearch("");
    } else {
      // Étape 2 : créer le match
      const success = await createManualMatch(matchBuilder.boxeur1.id, boxeur.id);
      if (success) {
        showToast("Combat ajouté ✓", "success");
        setShowMatchModal(false);
        setMatchBuilder({ boxeur1: null });
        setMatchSearch("");
      } else {
        showToast("Erreur lors de la création", "error");
      }
    }
  };

  // Filtrer les matchs par type
  const bracketMatches = useMemo(
    () => matches.filter((m) => m.matchType === "BRACKET"),
    [matches]
  );

  const poolMatches = useMemo(
    () => matches.filter((m) => m.matchType === "POOL"),
    [matches]
  );

  // Grouper par sexe puis catégorie
  const bracketsBySexe = useMemo(() => {
    const femmes = new Map<string, typeof bracketMatches>();
    const hommes = new Map<string, typeof bracketMatches>();

    bracketMatches.forEach((m) => {
      // Utiliser le sexe du match directement
      const groups = m.sexe === "F" ? femmes : hommes;

      if (!groups.has(m.categoryDisplay)) {
        groups.set(m.categoryDisplay, []);
      }
      groups.get(m.categoryDisplay)!.push(m);
    });

    return {
      F: Array.from(femmes.entries()).sort(([a], [b]) => a.localeCompare(b)),
      M: Array.from(hommes.entries()).sort(([a], [b]) => a.localeCompare(b)),
    };
  }, [bracketMatches]);

  const poolsBySexe = useMemo(() => {
    const femmes = new Map<string, typeof poolMatches>();
    const hommes = new Map<string, typeof poolMatches>();

    poolMatches.forEach((m) => {
      // Utiliser le sexe du match directement
      const groups = m.sexe === "F" ? femmes : hommes;

      if (!groups.has(m.categoryDisplay)) {
        groups.set(m.categoryDisplay, []);
      }
      groups.get(m.categoryDisplay)!.push(m);
    });

    return {
      F: Array.from(femmes.entries()).sort(([a], [b]) => a.localeCompare(b)),
      M: Array.from(hommes.entries()).sort(([a], [b]) => a.localeCompare(b)),
    };
  }, [poolMatches]);

  // Boxeurs sans adversaire (pas dans les matchs)
  const boxeursSeuls = useMemo(() => {
    if (!tournoi) return [];

    // IDs de tous les boxeurs qui ont au moins un match
    const boxeursWithMatchIds = new Set<number>();
    matches.forEach((m) => {
      if (m.boxeur1Id) {
        boxeursWithMatchIds.add(m.boxeur1Id);
      }
      if (m.boxeur2Id) {
        boxeursWithMatchIds.add(m.boxeur2Id);
      }
    });

    // Retourner les boxeurs inscrits au tournoi mais sans match
    return tournoi.boxeurs
      .map((tb) => tb.boxeur)
      .filter((b) => !boxeursWithMatchIds.has(b.id));
  }, [tournoi, matches]);

  if (loading && !tournoi) {
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
            🥊 Affrontements - {tournoi?.nom || "Tournoi"}
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
        <div className="page-header-actions" style={{ display: "flex", gap: 12 }}>
          <Link href={`/tournois/${tournoiId}`} className="btn btn-ghost">
            ← Retour
          </Link>
          <Link href={`/tournois/${tournoiId}/categories`} className="btn btn-ghost">
            📊 Catégories
          </Link>
          {matches.length > 0 && (
            <Link href={`/tournois/${tournoiId}/feuille`} className="btn btn-secondary">
              📋 Feuille
            </Link>
          )}
          <button
            className="btn btn-primary"
            onClick={() => handleOpenMatchBuilder()}
          >
            + Combat manuel
          </button>
          {matches.length === 0 ? (
            <button
              className="btn btn-primary"
              onClick={() => handleGenerateMatches(false)}
              disabled={generating}
            >
              {generating ? "Génération..." : "Générer le tirage"}
            </button>
          ) : (
            <button
              className="btn btn-danger"
              onClick={() => setShowConfirmGenerate(true)}
            >
              Régénérer
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      {stats && matches.length > 0 && (
        <div
          className="card"
          style={{ marginTop: 24, display: "flex", gap: 32, padding: 20 }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 32, fontWeight: "bold", color: "#e63946" }}>
              {stats.total}
            </div>
            <div style={{ fontSize: 13, color: "#888" }}>Matchs total</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 32, fontWeight: "bold", color: "#d4a337" }}>
              {stats.byType.BRACKET}
            </div>
            <div style={{ fontSize: 13, color: "#888" }}>Tableaux</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 32, fontWeight: "bold", color: "#2ecc71" }}>
              {stats.byType.POOL}
            </div>
            <div style={{ fontSize: 13, color: "#888" }}>Poules</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 32, fontWeight: "bold", color: "#888" }}>
              {stats.categories.length}
            </div>
            <div style={{ fontSize: 13, color: "#888" }}>Catégories</div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {matches.length === 0 && (
        <div className="card" style={{ marginTop: 24 }}>
          <div className="empty-state">
            <div className="empty-state-icon">🥊</div>
            <p>Aucun match généré pour le moment</p>
            <p style={{ fontSize: 14, color: "#666", marginTop: 8 }}>
              Clique sur "Générer le tirage" pour créer les affrontements
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      {matches.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <div className="tabs">
            <button
              className={`tab ${activeTab === "BRACKET" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("BRACKET")}
            >
              Élimination directe ({bracketMatches.length})
            </button>
            <button
              className={`tab ${activeTab === "POOL" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("POOL")}
            >
              Poules ({poolMatches.length})
            </button>
          </div>

          {/* Brackets */}
          {activeTab === "BRACKET" && (
            <div>
              {bracketMatches.length === 0 ? (
                <div className="card">
                  <div className="empty-state">
                    <div className="empty-state-icon">🏆</div>
                    <p>Aucun tableau d'élimination</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Femmes */}
                  {bracketsBySexe.F.length > 0 && (
                    <div style={{ marginTop: 24 }}>
                      <h2
                        style={{
                          fontSize: 28,
                          marginBottom: 24,
                          color: "#e63946",
                          borderBottom: "3px solid #e63946",
                          paddingBottom: 12,
                        }}
                      >
                        👩 FEMMES
                      </h2>
                      {bracketsBySexe.F.map(([category, categoryMatches]) => (
                        <BracketView
                          key={category}
                          matches={categoryMatches}
                          category={category}
                        />
                      ))}
                    </div>
                  )}

                  {/* Hommes */}
                  {bracketsBySexe.M.length > 0 && (
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
                        👨 HOMMES
                      </h2>
                      {bracketsBySexe.M.map(([category, categoryMatches]) => (
                        <BracketView
                          key={category}
                          matches={categoryMatches}
                          category={category}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Pools */}
          {activeTab === "POOL" && (
            <div>
              {poolMatches.length === 0 ? (
                <div className="card">
                  <div className="empty-state">
                    <div className="empty-state-icon">🔄</div>
                    <p>Aucune poule</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Femmes */}
                  {poolsBySexe.F.length > 0 && (
                    <div style={{ marginTop: 24 }}>
                      <h2
                        style={{
                          fontSize: 28,
                          marginBottom: 24,
                          color: "#e63946",
                          borderBottom: "3px solid #e63946",
                          paddingBottom: 12,
                        }}
                      >
                        👩 FEMMES
                      </h2>
                      {poolsBySexe.F.map(([category, categoryMatches]) => (
                        <PoolView
                          key={category}
                          matches={categoryMatches}
                          category={category}
                        />
                      ))}
                    </div>
                  )}

                  {/* Hommes */}
                  {poolsBySexe.M.length > 0 && (
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
                        👨 HOMMES
                      </h2>
                      {poolsBySexe.M.map(([category, categoryMatches]) => (
                        <PoolView
                          key={category}
                          matches={categoryMatches}
                          category={category}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Boxeurs sans adversaire */}
      {boxeursSeuls.length > 0 && (
        <BoxeursSeulsView boxeurs={boxeursSeuls} onAddMatch={handleOpenMatchBuilder} />
      )}

      {/* Modal sélection adversaire */}
      {showMatchModal && (
        <div className="modal-overlay" onClick={() => { setShowMatchModal(false); setMatchBuilder({ boxeur1: null }); setMatchSearch(""); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {matchBuilder.boxeur1
                  ? `Adversaire de ${matchBuilder.boxeur1.nom.toUpperCase()} ${matchBuilder.boxeur1.prenom}`
                  : "Sélectionner le 1er boxeur"}
              </h2>
              <button
                className="modal-close"
                onClick={() => { setShowMatchModal(false); setMatchBuilder({ boxeur1: null }); setMatchSearch(""); }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: "0 24px 24px" }}>
              <input
                type="text"
                placeholder="Rechercher par nom, prénom ou club..."
                value={matchSearch}
                onChange={(e) => setMatchSearch(e.target.value)}
                autoFocus
                style={{ width: "100%", marginBottom: 16 }}
              />
              <div style={{ maxHeight: 400, overflowY: "auto" }}>
                {tournoi?.boxeurs
                  .map((tb) => tb.boxeur)
                  .filter((b) => {
                    if (matchBuilder.boxeur1 && b.id === matchBuilder.boxeur1.id) return false;
                    if (!matchSearch) return true;
                    const s = matchSearch.toLowerCase();
                    return b.nom.toLowerCase().includes(s) || b.prenom.toLowerCase().includes(s) || b.club.nom.toLowerCase().includes(s);
                  })
                  .map((b) => (
                    <div
                      key={b.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 12px",
                        borderBottom: "1px solid var(--border)",
                        gap: 12,
                      }}
                    >
                      <div>
                        <strong>{b.nom.toUpperCase()}</strong> {b.prenom}
                        <span style={{ color: "#888", marginLeft: 8, fontSize: 13 }}>
                          {b.club.nom} — {b.categoriePoids} — {b.sexe === "M" ? "H" : "F"}
                        </span>
                      </div>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleSelectBoxeur(b)}
                      >
                        {matchBuilder.boxeur1 ? "Sélectionner" : "Choisir"}
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmation régénération */}
      {showConfirmGenerate && (
        <div className="modal-overlay" onClick={() => setShowConfirmGenerate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Régénérer les matchs ?</h2>
              <button
                className="modal-close"
                onClick={() => setShowConfirmGenerate(false)}
              >
                ×
              </button>
            </div>
            <p style={{ color: "#888", marginBottom: 24 }}>
              ⚠️ Cela supprimera tous les matchs existants et tous les résultats
              enregistrés. Cette action est irréversible.
            </p>
            <div className="modal-actions">
              <button
                className="btn btn-ghost"
                onClick={() => setShowConfirmGenerate(false)}
                disabled={generating}
              >
                Annuler
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleGenerateMatches(true)}
                disabled={generating}
              >
                {generating ? "Génération..." : "Régénérer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast.visible && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
