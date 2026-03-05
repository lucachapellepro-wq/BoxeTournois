"use client";

import { useEffect, useState, useMemo } from "react";
import { useBoxeurs } from "@/hooks/useBoxeurs";
import { useClubs } from "@/hooks/useClubs";
import { useGlobalToast } from "@/contexts/ToastContext";
import { Stats } from "@/components/Stats";
import { TireursTable } from "@/components/TireursTable";
import dynamic from "next/dynamic";

const TireursRecap = dynamic(() => import("@/components/TireursRecap").then(m => ({ default: m.TireursRecap })));
const ModalTireur = dynamic(() => import("@/components/ModalTireur").then(m => ({ default: m.ModalTireur })));
const ModalClub = dynamic(() => import("@/components/ModalClub").then(m => ({ default: m.ModalClub })));
import { Boxeur } from "@/types";
import { sortByWeight } from "@/lib/ui-helpers";
import { useDebounce } from "@/hooks/useDebounce";

/** Page tireurs : tableau éditable avec filtres, stats et récapitulatif par catégorie */
export default function TireursPage() {
  const { boxeurs, loading, fetchBoxeurs, deleteBoxeur, updateBoxeur } =
    useBoxeurs();
  const { clubs, fetchClubs } = useClubs();
  const { showToast } = useGlobalToast();

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

  const debouncedSearch = useDebounce(searchText, 300);

  // Filtrage des boxeurs
  const filteredBoxeurs = useMemo(() => {
    return boxeurs
      .filter((b) => {
        if (debouncedSearch) {
          const s = debouncedSearch.toLowerCase();
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
  }, [boxeurs, debouncedSearch, filterClub, filterSexe, filterType]);

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

    // Détection doublons côté client (nom + prénom + année)
    const duplicate = boxeurs.find(
      (b) =>
        b.nom.toLowerCase() === form.nom.toLowerCase() &&
        b.prenom.toLowerCase() === form.prenom.toLowerCase() &&
        b.dateNaissance != null &&
        new Date(b.dateNaissance).getUTCFullYear() === parseInt(form.anneeNaissance)
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
        const err = await res.json().catch(() => null);
        showToast(err?.error || "Erreur", "error");
      }
    } catch {
      showToast("Erreur réseau", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAddClub = async () => {
    if (!clubForm.nom || !clubForm.ville) {
      showToast("Nom et ville obligatoires", "error");
      return;
    }
    try {
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
      } else {
        const err = await res.json().catch(() => null);
        showToast(err?.error || "Erreur création club", "error");
      }
    } catch {
      showToast("Erreur réseau", "error");
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
                ? new Date(boxeur.dateNaissance).getUTCFullYear()
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
                showToast("Tireur recréé (inscriptions tournois perdues)", "success");
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
    // Champ combiné "nom|prenom" envoyé en un seul PUT
    if (field === "nom" && typeof value === "string" && value.includes("|")) {
      const [nom, prenom] = value.split("|");
      const success = await updateBoxeur(id, { nom, prenom });
      if (success) { showToast("Modifié ✓", "success"); } else { showToast("Erreur modification", "error"); }
      return;
    }
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
          aria-label="Rechercher par nom, prénom ou club"
        />
        <select
          value={filterClub}
          onChange={(e) => setFilterClub(e.target.value)}
          aria-label="Filtrer par club"
        >
          <option value="">Tous les clubs</option>
          {clubs.map((c) => (
            <option key={c.id} value={c.id}>{c.nom}</option>
          ))}
        </select>
        <select
          value={filterSexe}
          onChange={(e) => setFilterSexe(e.target.value)}
          aria-label="Filtrer par sexe"
        >
          <option value="">H / F</option>
          <option value="M">Hommes</option>
          <option value="F">Femmes</option>
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          aria-label="Filtrer par type de compétition"
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

      <div className="tabs" role="tablist">
        <button
          id="tab-liste"
          className={`tab ${activeTab === "liste" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("liste")}
          role="tab"
          aria-selected={activeTab === "liste"}
          aria-controls="tabpanel-liste"
        >
          Liste éditable
        </button>
        <button
          id="tab-recap"
          className={`tab ${activeTab === "recap" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("recap")}
          role="tab"
          aria-selected={activeTab === "recap"}
          aria-controls="tabpanel-recap"
        >
          Récapitulatif par catégorie
        </button>
      </div>

      {activeTab === "liste" && (
        <div id="tabpanel-liste" role="tabpanel" aria-labelledby="tab-liste">
        <TireursTable
          boxeurs={filteredBoxeurs}
          loading={loading}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
          onOpenModal={() => setShowModal(true)}
        />
        </div>
      )}

      {activeTab === "recap" && (
        <div id="tabpanel-recap" role="tabpanel" aria-labelledby="tab-recap">
          <TireursRecap groupedByCategory={groupedByCategory} />
        </div>
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
    </>
  );
}
