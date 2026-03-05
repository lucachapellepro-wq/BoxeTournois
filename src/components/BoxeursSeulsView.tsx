import { Boxeur } from "@/types";
import { getGantStyle, getGantLabel } from "@/lib/categories";

/** Props de la vue des tireurs sans adversaire */
interface BoxeursSeulsViewProps {
  boxeurs: Boxeur[];
  onAddMatch?: (boxeur: Boxeur) => void;
}

/** Liste des tireurs en attente d'adversaire, groupés par sexe et catégorie */
export function BoxeursSeulsView({ boxeurs, onAddMatch }: BoxeursSeulsViewProps) {
  if (boxeurs.length === 0) return null;

  // Grouper par sexe puis catégorie
  const boxeursBySexe = boxeurs.reduce((acc, boxeur) => {
    const sexe = boxeur.sexe;
    if (!acc[sexe]) acc[sexe] = {};

    const key = `${boxeur.categorieAge} - ${boxeur.categoriePoids}`;
    if (!acc[sexe][key]) acc[sexe][key] = [];
    acc[sexe][key].push(boxeur);
    return acc;
  }, {} as Record<string, Record<string, Boxeur[]>>);

  const femmes = boxeursBySexe["F"] || {};
  const hommes = boxeursBySexe["M"] || {};

  const renderBoxeurCard = (boxeur: Boxeur) => (
    <div key={boxeur.id} className="match-card match-tbd boxeur-seul-card">
      <div className="boxeur-seul-header">
        {onAddMatch && (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => onAddMatch(boxeur)}
            aria-label={`Ajouter un combat pour ${boxeur.nom} ${boxeur.prenom}`}
          >
            +
          </button>
        )}
        {!onAddMatch && <div className="boxeur-seul-icon">⏳</div>}
        <div className="boxeur-seul-info">
          <div className="boxeur-seul-name">
            {boxeur.nom.toUpperCase()} {boxeur.prenom}
          </div>
          <div className="boxeur-seul-club">{boxeur.club.nom}</div>
        </div>
      </div>

      <div className="boxeur-seul-badges">
        <span className="badge badge-sexe">{boxeur.sexe === "M" ? "H" : "F"}</span>
        <span className="badge badge-poids">{boxeur.categoriePoids}</span>
        <span className="badge badge-age">{boxeur.categorieAge}</span>
        <span className="badge-gant" style={getGantStyle(boxeur.gant)}>
          {getGantLabel(boxeur.gant)}
        </span>
      </div>
    </div>
  );

  const renderSection = (
    categories: Record<string, Boxeur[]>,
    sexeLabel: string,
    sectionClass: string,
    icon: string
  ) => {
    if (Object.keys(categories).length === 0) return null;
    return (
      <div className="section-gap-lg">
        <h3 className={`section-header ${sectionClass}`}>
          {icon} {sexeLabel}
        </h3>
        {Object.entries(categories).map(([category, categoryBoxeurs]) => (
          <div key={category} className="boxeurs-seuls-category">
            <h4 className="subcategory-title">
              {category} ({categoryBoxeurs.length} tireur{categoryBoxeurs.length > 1 ? "s" : ""})
            </h4>
            <div className="boxeurs-seuls-grid">
              {categoryBoxeurs.map(renderBoxeurCard)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="section-gap-lg boxeurs-seuls-section-wrapper">
      <h3 className="boxeurs-seuls-title">
        ⏳ Tireurs en attente d&apos;adversaire
      </h3>
      <p className="empty-hint boxeurs-seuls-hint">
        Ces tireurs n&apos;ont pas d&apos;adversaire dans leur catégorie pour le moment.
      </p>

      {renderSection(femmes, "FEMMES", "section-header-femmes", "👩")}
      {renderSection(hommes, "HOMMES", "section-header-hommes", "👨")}
    </div>
  );
}
