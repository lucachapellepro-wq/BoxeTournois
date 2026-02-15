"use client";

import { useEffect, useState, useMemo } from "react";
import { useBoxeurs } from "@/hooks/useBoxeurs";
import { useClubs } from "@/hooks/useClubs";
import { useToast } from "@/hooks/useToast";
import { Stats } from "@/components/Stats";
import { TireursTable } from "@/components/TireursTable";
import { TireursRecap } from "@/components/TireursRecap";
import { ModalTireur } from "@/components/ModalTireur";
import { ModalClub } from "@/components/ModalClub";
import { Toast } from "@/components/Toast";
import { Boxeur } from "@/types";
import { sortByWeight } from "@/lib/ui-helpers";

export default function TireursPage() {
  const { boxeurs, loading, fetchBoxeurs, deleteBoxeur, updateBoxeur } =
    useBoxeurs();
  const { clubs, fetchClubs } = useClubs();
  const { toast, showToast } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [showClubModal, setShowClubModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"liste" | "recap">("liste");
  const [saving, setSaving] = useState(false);

  // Filtres
  const [searchText, setSearchText] = useState("");
  const [filterClub, setFilterClub] = useState("");
  const [filterSexe, setFilterSexe] = useState("");
  const [filterType, setFilterType] = useState("");

  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    anneeNaissance: "",
    sexe: "M",
    poids: "",
    gant: "bleu",
    clubId: "",
    typeCompetition: "TOURNOI",
  });

  const [clubForm, setClubForm] = useState({
    nom: "",
    ville: "",
    coach: "",
    couleur: "",
  });

  useEffect(() => {
    fetchBoxeurs();
    fetchClubs();
  }, [fetchBoxeurs, fetchClubs]);

  // Filtrage des boxeurs
  const filteredBoxeurs = useMemo(() => {
    return boxeurs
      .filter((b) => {
        if (searchText) {
          const s = searchText.toLowerCase();
          if (
            !b.nom.toLowerCase().includes(s) &&
            !b.prenom.toLowerCase().includes(s) &&
            !b.club.nom.toLowerCase().includes(s)
          ) return false;
        }
        if (filterClub && b.club.id !== parseInt(filterClub)) return false;
        if (filterSexe && b.sexe !== filterSexe) return false;
        if (filterType && b.typeCompetition !== filterType) return false;
        return true;
      })
      .sort((a, b) => {
        // Sort by club name, then by category, then by name
        const clubCmp = a.club.nom.localeCompare(b.club.nom);
        if (clubCmp !== 0) return clubCmp;
        const catCmp = sortByWeight(
          `${a.categorieAge} — ${a.categoriePoids}`,
          `${b.categorieAge} — ${b.categoriePoids}`
        );
        if (catCmp !== 0) return catCmp;
        return a.nom.localeCompare(b.nom);
      });
  }, [boxeurs, searchText, filterClub, filterSexe, filterType]);

  const hasFilters = searchText || filterClub || filterSexe || filterType;

  const resetFilters = () => {
    setSearchText("");
    setFilterClub("");
    setFilterSexe("");
    setFilterType("");
  };

  const handleSubmit = async () => {
    if (
      !form.nom ||
      !form.prenom ||
      !form.anneeNaissance ||
      !form.poids ||
      !form.clubId
    ) {
      showToast("Remplis tous les champs !", "error");
      return;
    }

    // Détection doublons côté client
    const duplicate = boxeurs.find(
      (b) =>
        b.nom.toLowerCase() === form.nom.toLowerCase() &&
        b.prenom.toLowerCase() === form.prenom.toLowerCase()
    );
    if (duplicate) {
      showToast(
        `Ce tireur existe déjà : ${duplicate.nom.toUpperCase()} ${duplicate.prenom} (${duplicate.club.nom})`,
        "error"
      );
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/boxeurs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        showToast("Tireur inscrit ✓", "success");
        setForm({
          nom: "",
          prenom: "",
          anneeNaissance: "",
          sexe: "M",
          poids: "",
          gant: "bleu",
          clubId: "",
          typeCompetition: "TOURNOI",
        });
        setShowModal(false);
        fetchBoxeurs();
      } else {
        const err = await res.json();
        showToast(err.error || "Erreur", "error");
      }
    } catch {
      showToast("Erreur réseau", "error");
    }
    setSaving(false);
  };

  const handleAddClub = async () => {
    if (!clubForm.nom || !clubForm.ville) {
      showToast("Nom et ville obligatoires", "error");
      return;
    }
    const res = await fetch("/api/clubs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(clubForm),
    });
    if (res.ok) {
      showToast("Club ajouté ✓", "success");
      setClubForm({ nom: "", ville: "", coach: "", couleur: "" });
      setShowClubModal(false);
      fetchClubs();
    }
  };

  const handleDelete = async (id: number) => {
    // Sauvegarder les données du tireur pour undo
    const boxeur = boxeurs.find((b) => b.id === id);
    if (!boxeur) return;

    const success = await deleteBoxeur(id);
    if (success) {
      showToast(`${boxeur.nom.toUpperCase()} ${boxeur.prenom} supprimé`, "success", {
        action: {
          label: "Annuler",
          onClick: async () => {
            // Recréer le tireur
            try {
              const year = boxeur.dateNaissance
                ? new Date(boxeur.dateNaissance).getFullYear()
                : 2000;
              const res = await fetch("/api/boxeurs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  nom: boxeur.nom,
                  prenom: boxeur.prenom,
                  anneeNaissance: String(year),
                  sexe: boxeur.sexe,
                  poids: String(boxeur.poids),
                  gant: boxeur.gant,
                  clubId: String(boxeur.club.id),
                  typeCompetition: boxeur.typeCompetition,
                }),
              });
              if (res.ok) {
                showToast("Tireur restauré ✓", "success");
                fetchBoxeurs();
              }
            } catch {
              showToast("Erreur lors de la restauration", "error");
            }
          },
        },
      });
    } else {
      showToast("Erreur suppression", "error");
    }
  };

  const handleUpdate = async (
    id: number,
    field: string,
    value: string | number | boolean
  ) => {
    const success = await updateBoxeur(id, { [field]: value });
    if (success) {
      showToast("Modifié ✓", "success");
    } else {
      showToast("Erreur modification", "error");
    }
  };

  // Stats par catégorie d'âge
  const statsByAge = useMemo(() => {
    const map: Record<string, number> = {};
    boxeurs.forEach((b) => {
      map[b.categorieAge || "?"] = (map[b.categorieAge || "?"] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [boxeurs]);

  // Groupement par catégorie pour le récap (utilise filteredBoxeurs)
  const groupedByCategory = useMemo(() => {
    const map: Record<string, Boxeur[]> = {};
    filteredBoxeurs.forEach((b) => {
      const key = `${b.categorieAge} — ${b.categoriePoids}`;
      if (!map[key]) map[key] = [];
      map[key].push(b);
    });
    return Object.entries(map).sort(([a], [b]) => sortByWeight(a, b));
  }, [filteredBoxeurs]);

  return (
    <>
      <Stats boxeurs={boxeurs} clubs={clubs} statsByAge={statsByAge} />

      <div className="page-header">
        <div>
          <h1 className="page-title">👥 Gestion des Tireurs</h1>
          <p className="page-subtitle">
            Liste complète avec édition directe dans le tableau
          </p>
        </div>
        <div className="page-header-actions">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setShowClubModal(true)}
          >
            + Club
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + Nouveau tireur
          </button>
        </div>
      </div>

      {/* Barre de filtres */}
      <div className="filter-bar">
        <input
          type="text"
          placeholder="Rechercher par nom, prénom ou club..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <select
          value={filterClub}
          onChange={(e) => setFilterClub(e.target.value)}
        >
          <option value="">Tous les clubs</option>
          {clubs.map((c) => (
            <option key={c.id} value={c.id}>{c.nom}</option>
          ))}
        </select>
        <select
          value={filterSexe}
          onChange={(e) => setFilterSexe(e.target.value)}
        >
          <option value="">H / F</option>
          <option value="M">Hommes</option>
          <option value="F">Femmes</option>
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">Tous types</option>
          <option value="TOURNOI">Tournoi</option>
          <option value="INTERCLUB">Interclub</option>
        </select>
        {hasFilters && (
          <>
            <button className="btn btn-ghost btn-sm" onClick={resetFilters}>
              Réinitialiser
            </button>
            <span className="filter-count">
              {filteredBoxeurs.length} / {boxeurs.length}
            </span>
          </>
        )}
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === "liste" ? "active" : ""}`}
          onClick={() => setActiveTab("liste")}
        >
          Liste éditable
        </button>
        <button
          className={`tab ${activeTab === "recap" ? "active" : ""}`}
          onClick={() => setActiveTab("recap")}
        >
          Récapitulatif par catégorie
        </button>
      </div>

      {activeTab === "liste" && (
        <TireursTable
          boxeurs={filteredBoxeurs}
          loading={loading}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
          onOpenModal={() => setShowModal(true)}
        />
      )}

      {activeTab === "recap" && (
        <TireursRecap groupedByCategory={groupedByCategory} />
      )}

      <ModalTireur
        show={showModal}
        form={form}
        clubs={clubs}
        saving={saving}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        onChange={setForm}
        onOpenClubModal={() => {
          setShowModal(false);
          setShowClubModal(true);
        }}
      />

      <ModalClub
        show={showClubModal}
        form={clubForm}
        onClose={() => setShowClubModal(false)}
        onSubmit={handleAddClub}
        onChange={setClubForm}
      />

      {toast.visible && <Toast message={toast.message} type={toast.type} action={toast.action} />}
    </>
  );
}
