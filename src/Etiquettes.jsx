// Petites étiquettes visuelles réutilisées partout : urgence, statut,
// indicateur, étape, ES.
import { STATUTS } from "./aides.js";

export function EtiquetteUrgence({ niveau, echelle }) {
  const info = echelle.find((e) => e.niveau === niveau);
  // Le rouge est réservé au signal réellement critique (urgence 3 et 4).
  const classe = niveau <= 1 ? "neutre" : niveau === 2 ? "ok" : "rouge";
  return (
    <span className={`etiquette ${classe}`} title={info?.indicateurs || ""}>
      {niveau} · {info ? info.libelle : "?"}
    </span>
  );
}

export function EtiquetteStatut({ statut }) {
  const classe =
    statut === "clos" ? "neutre" : statut === "nouveau" ? "haut" : statut === "transfere_direction" ? "moyen" : "ok";
  return <span className={`etiquette ${classe}`}>{STATUTS[statut] || statut}</span>;
}

// L'indicateur visible : formulation différente selon le public.
// Enseignants : « Ça va / À risque ». Équipe et direction : « Ça va / À risque · suivi ».
export function Indicateur({ caVa, equipe }) {
  const libelle = caVa ? "Ça va" : equipe ? "À risque · suivi" : "À risque";
  return <span className={`etiquette ${caVa ? "ok" : "haut"}`}>{libelle}</span>;
}

export function EtiquetteEtape({ n }) {
  return <span className="etiquette neutre">Étape {n}</span>;
}

export function EtiquetteES() {
  return <span className="etiquette eed" title="Élève identifié ES (éducation spécialisée)">ES</span>;
}
