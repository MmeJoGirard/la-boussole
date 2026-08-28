import { nomComplet, trouverEleve, STATUTS } from "./aides.js";
import { EtiquetteUrgence, Indicateur, EtiquetteES } from "./Etiquettes.jsx";

// Vue Kanban : où en est chaque élève. Les dossiers avancent de gauche
// à droite : Nouveau → Pris en charge → Transféré à la direction → Clos.
// Cliquer une carte ouvre le dossier complet.
export default function Kanban({ db, ouvrirDossier }) {
  const colonnes = Object.entries(STATUTS);
  return (
    <>
      <p className="callout-note">
        Chaque colonne est une étape du parcours : les dossiers avancent de gauche à droite.
        Cliquez une carte pour ouvrir le dossier (le statut se change dans la fiche).
      </p>
      <div className="kanban">
        {colonnes.map(([cle, nom]) => {
          const cartes = db.signalements
            .filter((s) => s.statut === cle)
            .sort((a, b) => b.niveauUrgence - a.niveauUrgence || a.date.localeCompare(b.date));
          return (
            <section key={cle} className="kanban-colonne" aria-label={`${nom} : ${cartes.length} dossier${cartes.length > 1 ? "s" : ""}`}>
              <h3 className="kanban-titre">
                {nom} <span className="compte-section">· {cartes.length}</span>
              </h3>
              {cartes.map((s) => {
                const eleve = trouverEleve(db, s.eleveId);
                return (
                  <button key={s.id} className="kanban-carte" onClick={() => ouvrirDossier(s.id)}>
                    <span className="kanban-nom">{nomComplet(eleve)} {eleve.eed && <EtiquetteES />}</span>
                    <span className="kanban-meta">{eleve.annee}e · {eleve.groupe} · Étape {s.niveauIntervention} · {s.date}</span>
                    <span className="kanban-etiquettes">
                      <EtiquetteUrgence niveau={s.niveauUrgence} echelle={db.echelleUrgence} />
                      {cle !== "clos" && <Indicateur caVa={s.indicateurCaVa} equipe />}
                    </span>
                  </button>
                );
              })}
              {cartes.length === 0 && <p className="aide">Aucun dossier ici.</p>}
            </section>
          );
        })}
      </div>
    </>
  );
}
