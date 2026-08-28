import { useMemo } from "react";
import { nomComplet, trouverEleve, trouverMembre } from "./aides.js";

// La chronologie : tous les événements de l'année scolaire sur une ligne
// du temps verticale, du plus récent au plus ancien.
const COULEURS = {
  clair: { signalement: "#2F5AA8", intervention: "#0D9488" },
  sombre: { signalement: "#5588DB", intervention: "#1D9D8F" },
};

const MOIS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

const dateLisible = (date) => {
  const [a, m, j] = date.split("-").map(Number);
  return `${j} ${MOIS[m - 1]} ${a}`;
};

export default function Chronologie({ db, ouvrirDossier, sombre }) {
  const couleurs = COULEURS[sombre ? "sombre" : "clair"];

  const jours = useMemo(() => {
    const evenements = [];
    for (const s of db.signalements) {
      const eleve = trouverEleve(db, s.eleveId);
      const auteur = trouverMembre(db, s.auteurId);
      evenements.push({
        date: s.date.slice(0, 10),
        genre: "signalement",
        signId: s.id,
        titre: `Signalement · ${nomComplet(eleve)} (${eleve.groupe})`,
        detail: `Par ${nomComplet(auteur)} · urgence ${s.niveauUrgence} (${s.urgenceLibelle})`,
      });
      for (const inter of s.interventions) {
        evenements.push({
          date: inter.date.slice(0, 10),
          genre: "intervention",
          signId: s.id,
          titre: `${inter.type} · ${nomComplet(eleve)} (${eleve.groupe})`,
          detail: `Étape ${inter.niveau} · ${nomComplet(trouverMembre(db, inter.responsableId))}`,
        });
      }
    }
    evenements.sort((a, b) => b.date.localeCompare(a.date));
    // Regroupés par journée, la plus récente en premier.
    const parJour = [];
    for (const ev of evenements) {
      const dernier = parJour[parJour.length - 1];
      if (dernier && dernier.date === ev.date) dernier.evenements.push(ev);
      else parJour.push({ date: ev.date, evenements: [ev] });
    }
    return parJour;
  }, [db]);

  const total = jours.reduce((somme, j) => somme + j.evenements.length, 0);

  return (
    <>
      <p className="callout-note">
        {total} événements sur l'année scolaire, du plus récent au plus ancien.
      </p>
      <ul className="legende legende-calendrier" aria-hidden="true">
        <li><span className="pastille-couleur" style={{ background: couleurs.signalement }} /> <span className="legende-nom">Signalements</span></li>
        <li><span className="pastille-couleur" style={{ background: couleurs.intervention }} /> <span className="legende-nom">Interventions</span></li>
      </ul>
      <div className="panneau">
        <ol className="chronologie">
          {jours.map((jour) => (
            <li key={jour.date}>
              <h3 className="chrono-jour">{dateLisible(jour.date)}</h3>
              <ul className="chrono-liste">
                {jour.evenements.map((ev, i) => (
                  <li key={i} className="chrono-ev">
                    <span className="chrono-point" style={{ background: couleurs[ev.genre] }} aria-hidden="true" />
                    <span className="chrono-titre">{ev.titre}</span>
                    <span className="chrono-detail">{ev.detail}</span>
                    <button className="bouton discret" onClick={() => ouvrirDossier(ev.signId)}>Ouvrir le dossier</button>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}
