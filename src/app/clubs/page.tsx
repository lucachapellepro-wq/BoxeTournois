"use client";

import { useEffect, useState } from "react";
import { useBoxeurs } from "@/hooks/useBoxeurs";
import { useClubs } from "@/hooks/useClubs";
import { useToast } from "@/hooks/useToast";
import { ClubSelector } from "@/components/ClubSelector";
import { ClubDetail } from "@/components/ClubDetail";
import { TireursTable } from "@/components/TireursTable";
import { ModalClub } from "@/components/ModalClub";
import { ModalTireur } from "@/components/ModalTireur";
import { Toast } from "@/components/Toast";

export default function ClubsPage() {
  const { boxeurs, fetchBoxeurs, updateBoxeur, deleteBoxeur } = useBoxeurs();
  const { clubs, fetchClubs, updateClub } = useClubs();
  const { toast, showToast } = useToast();

  const [selectedClubId, setSelectedClubId] = useState<number | null>(null);
  const [showClubModal, setShowClubModal] = useState(false);
  const [showTireurModal, setShowTireurModal] = useState(false);
  const [savingTireur, setSavingTireur] = useState(false);

  const [clubForm, setClubForm] = useState({
    nom: "",
    ville: "",
    coach: "",
  });

  const [tireurForm, setTireurForm] = useState({
    nom: "",
    prenom: "",
    anneeNaissance: "",
    sexe: "M",
    poids: "",
    gant: "bleu",
    clubId: "",
    typeCompetition: "TOURNOI",
  });

  useEffect(() => {
    fetchBoxeurs();
    fetchClubs();
  }, [fetchBoxeurs, fetchClubs]);

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
      setClubForm({ nom: "", ville: "", coach: "" });
      setShowClubModal(false);
      fetchClubs();
    }
  };

  const handleUpdateClub = async (
    id: number,
    data: { nom?: string; ville?: string; coach?: string | null }
  ) => {
    const success = await updateClub(id, data);
    if (success) {
      showToast("Club modifié ✓", "success");
    } else {
      showToast("Erreur modification", "error");
    }
  };

  const handleUpdateBoxeur = async (
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

  const handleDeleteBoxeur = async (id: number) => {
    if (!confirm("Supprimer ce tireur ?")) return;
    const success = await deleteBoxeur(id);
    if (success) {
      showToast("Tireur supprimé", "success");
    } else {
      showToast("Erreur suppression", "error");
    }
  };

  const handleOpenTireurModal = () => {
    setTireurForm({
      nom: "", prenom: "", anneeNaissance: "", sexe: "M",
      poids: "", gant: "bleu",
      clubId: selectedClubId ? String(selectedClubId) : "",
      typeCompetition: "TOURNOI",
    });
    setShowTireurModal(true);
  };

  const handleAddTireur = async () => {
    if (!tireurForm.nom || !tireurForm.prenom || !tireurForm.anneeNaissance || !tireurForm.poids || !tireurForm.clubId) {
      showToast("Remplis tous les champs !", "error");
      return;
    }
    setSavingTireur(true);
    try {
      const res = await fetch("/api/boxeurs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tireurForm),
      });
      if (res.ok) {
        showToast("Tireur ajouté ✓", "success");
        setShowTireurModal(false);
        fetchBoxeurs();
      } else {
        showToast("Erreur lors de l'ajout", "error");
      }
    } catch {
      showToast("Erreur réseau", "error");
    }
    setSavingTireur(false);
  };

  const selectedClub = clubs.find((c) => c.id === selectedClubId);
  const filteredBoxeurs = selectedClubId
    ? boxeurs.filter((b) => b.club.id === selectedClubId)
    : [];

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">🏢 Gestion des Clubs</h1>
          <p className="page-subtitle">
            Sélectionne un club pour voir ses détails et ses tireurs
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowClubModal(true)}
        >
          + Nouveau club
        </button>
      </div>

      {clubs.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🏢</div>
            <p>Aucun club enregistré</p>
            <button
              className="btn btn-primary"
              onClick={() => setShowClubModal(true)}
            >
              + Ajouter le premier club
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="card">
            <ClubSelector
              clubs={clubs}
              selectedId={selectedClubId}
              onChange={setSelectedClubId}
            />
          </div>

          {selectedClub && (
            <>
              <ClubDetail club={selectedClub} onUpdate={handleUpdateClub} />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24, marginBottom: 16 }}>
                <h2 style={{ fontSize: 28 }}>
                  Tireurs de ce club ({filteredBoxeurs.length})
                </h2>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleOpenTireurModal}
                >
                  + Ajouter un tireur
                </button>
              </div>

              {filteredBoxeurs.length === 0 ? (
                <div className="card">
                  <div className="empty-state">
                    <div className="empty-state-icon">👥</div>
                    <p>Aucun tireur dans ce club</p>
                    <button className="btn btn-primary" onClick={handleOpenTireurModal}>
                      + Ajouter le premier tireur
                    </button>
                  </div>
                </div>
              ) : (
                <TireursTable
                  boxeurs={filteredBoxeurs}
                  loading={false}
                  onDelete={handleDeleteBoxeur}
                  onUpdate={handleUpdateBoxeur}
                  onOpenModal={handleOpenTireurModal}
                />
              )}
            </>
          )}
        </>
      )}

      <ModalClub
        show={showClubModal}
        form={clubForm}
        onClose={() => setShowClubModal(false)}
        onSubmit={handleAddClub}
        onChange={setClubForm}
      />

      <ModalTireur
        show={showTireurModal}
        form={tireurForm}
        clubs={clubs}
        saving={savingTireur}
        onClose={() => setShowTireurModal(false)}
        onSubmit={handleAddTireur}
        onChange={setTireurForm}
        onOpenClubModal={() => { setShowTireurModal(false); setShowClubModal(true); }}
      />

      {toast.visible && <Toast message={toast.message} type={toast.type} />}
    </>
  );
}
