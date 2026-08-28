import { nomComplet, trouverEleve, signalementsDe } from "./aides.js";
import { EtiquetteUrgence } from "./Etiquettes.jsx";
import { CircleDashed } from "lucide-react";

// « Ma liste de suivis à faire » : générée automatiquement à partir des
// dossiers. Une tâche disparaît d'elle-même quand l'action est faite
// (observation ajoutée, signalement mis à jour, dossier pris en charge…),
// donc la liste reflète toujours la réalité.

export function tachesEnseignant(db, utilisateur, mesEleves) {
  const taches = [];
  for (const eleve of mesEleves) {
    for (const s of signalementsDe(db, eleve.id)) {
      if (s.statut === "clos") continue;
      const estAuteur = s.auteurId === utilisateur.id;
      if (!estAuteur && !s.indicateurCaVa && !s.observations.some((o) => o.auteurId === utilisateur.id)) {
        taches.push({
          cle: `obs-${s.id}`,
          categorie: "Observations à ajouter",
          titre: `Ajouter mes observations · ${nomComplet(eleve)} (${eleve.groupe})`,
          detail: "Un collègue a signalé cet élève et l'indicateur est à risque.",
          eleveId: eleve.id,
          date: s.date,
        });
      }
      if (estAuteur && !s.dejaFait.rencontreEleve) {
        taches.push({
          cle: `ren-${s.id}`,
          categorie: "Suivis de mes signalements",
          titre: `Rencontrer l'élève · ${nomComplet(eleve)} (${eleve.groupe})`,
          detail: "Puis mettre à jour mon signalement (étape 2).",
          eleveId: eleve.id,
          date: s.date,
        });
      }
      if (estAuteur && !s.dejaFait.communicationParents) {
        taches.push({
          cle: `par-${s.id}`,
          categorie: "Suivis de mes signalements",
          titre: `Communiquer avec les parents · ${nomComplet(eleve)} (${eleve.groupe})`,
          detail: "Courriel, téléphone ou en personne, puis mise à jour du signalement.",
          eleveId: eleve.id,
          date: s.date,
        });
      }
    }
  }
  taches.sort((a, b) => a.date.localeCompare(b.date));
  return taches;
}

export function tachesEquipe(db, utilisateur, direction) {
  const taches = [];
  for (const s of db.signalements) {
    if (s.statut === "clos") continue;
    const eleve = trouverEleve(db, s.eleveId);
    if (!direction && s.statut === "nouveau") {
      taches.push({
        cle: `nv-${s.id}`,
        categorie: "Nouveaux signalements à prendre en charge",
        titre: `Prendre en charge · ${nomComplet(eleve)} (${eleve.groupe})`,
        detail: `Signalé le ${s.date}.`,
        urgence: s.niveauUrgence,
        signId: s.id,
        date: s.date,
      });
    }
    if (direction && s.statut === "transfere_direction") {
      taches.push({
        cle: `dir-${s.id}`,
        categorie: "Dossiers transférés à traiter",
        titre: `${s.prochaineEtape || "Prendre en charge"} · ${nomComplet(eleve)} (${eleve.groupe})`,
        detail: `Signalé le ${s.date} · Étape ${s.niveauIntervention}.`,
        urgence: s.niveauUrgence,
        signId: s.id,
        date: s.date,
      });
    }
    if (s.responsableId === utilisateur.id && s.prochaineEtape && s.statut === "pris_en_charge") {
      taches.push({
        cle: `et-${s.id}`,
        categorie: "Mes prochaines étapes",
        titre: `${s.prochaineEtape} · ${nomComplet(eleve)} (${eleve.groupe})`,
        detail: `Étape ${s.niveauIntervention} du suivi.`,
        urgence: s.niveauUrgence,
        signId: s.id,
        date: s.date,
      });
    }
  }
  taches.sort((a, b) => (b.urgence ?? 0) - (a.urgence ?? 0) || a.date.localeCompare(b.date));
  return taches;
}

// Rendu : les tâches regroupées par catégorie, avec l'action qui mène
// au bon endroit.
export default function ListeAFaire({ db, taches, libelleAction, surAction }) {
  if (taches.length === 0) {
    return (
      <div className="panneau">
        <p style={{ margin: 0 }}><strong>Tout est à jour.</strong> Aucun suivi en attente pour l'instant.</p>
      </div>
    );
  }
  const categories = [...new Set(taches.map((t) => t.categorie))];
  return (
    <>
      <p className="callout-note">
        {taches.length} suivi{taches.length > 1 ? "s" : ""} à faire. Cette liste se met à jour toute seule :
        une tâche disparaît dès que l'action est faite dans le dossier.
      </p>
      {categories.map((categorie) => (
        <div key={categorie} className="panneau">
          <h3 style={{ marginTop: 0 }}>
            {categorie} <span className="compte-section">· {taches.filter((t) => t.categorie === categorie).length}</span>
          </h3>
          <ul className="taches">
            {taches.filter((t) => t.categorie === categorie).map((t) => (
              <li key={t.cle} className="tache">
                <CircleDashed size={16} strokeWidth={1.5} className="tache-icone" aria-hidden="true" />
                <span className="tache-corps">
                  <span className="tache-titre">
                    {t.titre}
                    {t.urgence !== undefined && <> <EtiquetteUrgence niveau={t.urgence} echelle={db.echelleUrgence} /></>}
                  </span>
                  <span className="tache-detail">{t.detail}</span>
                </span>
                <button className="bouton discret" onClick={() => surAction(t)}>{libelleAction}</button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}
