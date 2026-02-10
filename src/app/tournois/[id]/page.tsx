"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useBoxeurs } from "@/hooks/useBoxeurs";
import { useToast } from "@/hooks/useToast";
import { Toast } from "@/components/Toast";
import { Boxeur, TournoiDetail } from "@/types";
import { formatDate, calculateAge } from "@/lib/ui-helpers";
import Link from "next/link";

export default function TournoiDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { boxeurs: allBoxeurs, fetchBoxeurs } = useBoxeurs();
  const { toast, showToast } = useToast();

  const [tournoi, setTournoi] = useState<TournoiDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchBoxeurs();
    fetchTournoi();
  }, [params.id]);

  const fetchTournoi = async () => {
    try {
      const res = await fetch(`/api/tournois/${params.id}`);
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

  const handleAddBoxeur = async (boxeurId: number) => {
    try {
      const res = await fetch(`/api/tournois/${params.id}/boxeurs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boxeurId }),
      });

      if (res.ok) {
        showToast("Boxeur ajouté au tournoi ✓", "success");
        fetchTournoi();
      } else {
        showToast("Erreur lors de l'ajout", "error");
      }
    } catch {
      showToast("Erreur réseau", "error");
    }
  };

  const handleRemoveBoxeur = async (boxeurId: number) => {
    if (!confirm("Retirer ce boxeur du tournoi ?")) return;

    try {
      const res = await fetch(`/api/tournois/${params.id}/boxeurs/${boxeurId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        showToast("Boxeur retiré du tournoi", "success");
        fetchTournoi();
      } else {
        showToast("Erreur lors du retrait", "error");
      }
    } catch {
      showToast("Erreur réseau", "error");
    }
  };

  // Boxeurs déjà inscrits au tournoi
  const enrolledBoxeursIds = tournoi?.boxeurs.map((tb) => tb.boxeur.id) || [];

  // Boxeurs disponibles pour ajout (non inscrits)
  const availableBoxeurs = allBoxeurs.filter(
    (b) => !enrolledBoxeursIds.includes(b.id)
  );

  // Filtrer par recherche
  const filteredBoxeurs = availableBoxeurs.filter((b) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      b.nom.toLowerCase().includes(searchLower) ||
      b.prenom.toLowerCase().includes(searchLower) ||
      b.club.nom.toLowerCase().includes(searchLower)
    );
  });

  // Grouper les boxeurs par club
  const boxeursByClub = tournoi?.boxeurs.reduce((acc, tb) => {
    const clubNom = tb.boxeur.club.nom;
    if (!acc[clubNom]) acc[clubNom] = [];
    acc[clubNom].push(tb.boxeur);
    return acc;
  }, {} as Record<string, Boxeur[]>);

  if (loading) {
    return (
      <div className="card">
        <p style={{ textAlign: "center", padding: "40px" }}>Chargement...</p>
      </div>
    );
  }

  if (!tournoi) {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="empty-state-icon">❌</div>
          <p>Tournoi non trouvé</p>
          <button className="btn btn-primary" onClick={() => router.push("/")}>
            ← Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => router.push("/")}
            style={{ marginBottom: "8px" }}
          >
            ← Retour aux tournois
          </button>
          <h1 className="page-title">🏆 {tournoi.nom}</h1>
          <p className="page-subtitle">{formatDate(tournoi.date)}</p>
        </div>
        <div className="page-header-actions" style={{ display: "flex", gap: "12px" }}>
          <Link href={`/tournois/${params.id}/categories`} className="btn btn-secondary">
            📊 Catégories
          </Link>
          <Link href={`/tournois/${params.id}/affrontements`} className="btn btn-primary">
            🥊 Affrontements
          </Link>
          <button className="btn btn-ghost" onClick={() => setShowAddModal(true)}>
            + Ajouter des boxeurs
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="stats-row" style={{ marginTop: 16 }}>
        <div className="stat-card">
          <div className="stat-value" style={{ color: "#3B82F6" }}>
            {tournoi.boxeurs.length}
          </div>
          <div className="stat-label">Boxeurs inscrits</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: "#22C55E" }}>
            {Object.keys(boxeursByClub || {}).length}
          </div>
          <div className="stat-label">Clubs participants</div>
        </div>
      </div>

      {/* Liste par club */}
      <div className="section-header">
        <h2>Participants par club</h2>
      </div>

      {tournoi.boxeurs.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <p>Aucun boxeur inscrit pour le moment</p>
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              + Ajouter des boxeurs
            </button>
          </div>
        </div>
      ) : (
        Object.entries(boxeursByClub || {}).map(([clubNom, boxeurs]) => (
          <div key={clubNom} className="card" style={{ marginBottom: "16px" }}>
            <h3 style={{ marginBottom: "16px", color: "#3B82F6" }}>
              🏢 {clubNom} ({boxeurs.length})
            </h3>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Sexe</th>
                    <th>Âge</th>
                    <th>Poids</th>
                    <th>Gant</th>
                    <th>Cat. Poids</th>
                    <th>Cat. Âge</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {boxeurs.map((b) => (
                    <tr key={b.id}>
                      <td data-label="Nom">
                        <strong>{b.nom.toUpperCase()}</strong> {b.prenom}
                      </td>
                      <td data-label="Sexe">
                        <span className="badge badge-sexe">
                          {b.sexe === "M" ? "H" : "F"}
                        </span>
                      </td>
                      <td data-label="Âge">{calculateAge(b.dateNaissance)} ans</td>
                      <td data-label="Poids">{b.poids} kg</td>
                      <td data-label="Gant">
                        <span className="badge">{b.gant}</span>
                      </td>
                      <td data-label="Cat. Poids">
                        <span className="badge badge-category">{b.categoriePoids}</span>
                      </td>
                      <td data-label="Cat. Âge" className="mobile-hide">
                        <span className="badge badge-category">{b.categorieAge}</span>
                      </td>
                      <td data-label="">
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleRemoveBoxeur(b.id)}
                        >
                          Retirer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}

      {/* Modal d'ajout de boxeurs */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Ajouter des boxeurs au tournoi</h2>
              <button className="btn-close" onClick={() => setShowAddModal(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <input
                  type="text"
                  placeholder="🔍 Rechercher par nom, prénom ou club..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>

              <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                {filteredBoxeurs.length === 0 ? (
                  <p style={{ textAlign: "center", color: "#888", padding: "20px" }}>
                    {searchTerm
                      ? "Aucun boxeur trouvé"
                      : "Tous les boxeurs sont déjà inscrits"}
                  </p>
                ) : (
                  <div className="table-wrapper"><table>
                    <thead>
                      <tr>
                        <th>Nom</th>
                        <th>Club</th>
                        <th>Sexe</th>
                        <th>Âge</th>
                        <th>Poids</th>
                        <th>Gant</th>
                        <th>Cat. Poids</th>
                        <th>Cat. Âge</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBoxeurs.map((b) => (
                        <tr key={b.id}>
                          <td data-label="Nom">
                            <strong>{b.nom.toUpperCase()}</strong> {b.prenom}
                          </td>
                          <td data-label="Club">
                            <span className="badge badge-club">{b.club.nom}</span>
                          </td>
                          <td data-label="Sexe">
                            <span className="badge badge-sexe">
                              {b.sexe === "M" ? "H" : "F"}
                            </span>
                          </td>
                          <td data-label="Âge">{calculateAge(b.dateNaissance)} ans</td>
                          <td data-label="Poids">{b.poids} kg</td>
                          <td data-label="Gant">
                            <span className="badge">{b.gant}</span>
                          </td>
                          <td data-label="Cat. Poids">
                            <span className="badge badge-category">
                              {b.categoriePoids}
                            </span>
                          </td>
                          <td data-label="Cat. Âge" className="mobile-hide">
                            <span className="badge badge-category">
                              {b.categorieAge}
                            </span>
                          </td>
                          <td data-label="">
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => {
                                handleAddBoxeur(b.id);
                                setSearchTerm("");
                              }}
                            >
                              + Ajouter
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table></div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setShowAddModal(false);
                  setSearchTerm("");
                }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {toast.visible && <Toast message={toast.message} type={toast.type} />}
    </>
  );
}
