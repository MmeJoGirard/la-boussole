import { useMemo, useState } from "react";
import { nomComplet, trouverEleve } from "./aides.js";

// Vue dans le temps : un calendrier mensuel des signalements et des
// interventions. Cliquer sur une journée affiche son détail.
// Couleurs reprises de la palette validée des graphiques :
// bleu = signalements, sarcelle = interventions.
const COULEURS = {
  clair: { signalement: "#3568A8", intervention: "#0D9488" },
  sombre: { signalement: "#5588DB", intervention: "#1D9D8F" },
};

const MOIS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];
const JOURS = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"];

// Les dates sont des chaînes « AAAA-MM-JJ » : on les découpe nous-mêmes
// pour éviter les surprises de fuseau horaire.
const decouper = (date) => date.slice(0, 10).split("-").map(Number);

// eleveIds : limite aux élèves donnés (vue enseignant).
// confidentiel : cache les interventions et le niveau d'urgence
// (l'enseignant sait qu'un signalement existe, sans le détail du dossier).
export default function Calendrier({ db, ouvrirDossier, sombre, eleveIds = null, confidentiel = false }) {
  const COULEUR_SIGNALEMENT = COULEURS[sombre ? "sombre" : "clair"].signalement;
  const COULEUR_INTERVENTION = COULEURS[sombre ? "sombre" : "clair"].intervention;
  // Tous les événements datés, regroupés par jour.
  const evenements = useMemo(() => {
    const parJour = new Map();
    const ajouter = (date, ev) => {
      const jour = date.slice(0, 10);
      if (!parJour.has(jour)) parJour.set(jour, []);
      parJour.get(jour).push(ev);
    };
    for (const s of db.signalements) {
      if (eleveIds && !eleveIds.includes(s.eleveId)) continue;
      const eleve = trouverEleve(db, s.eleveId);
      ajouter(s.date, {
        genre: "signalement",
        signId: s.id,
        eleveId: s.eleveId,
        libelle: `Signalement · ${nomComplet(eleve)} (${eleve.groupe})`,
        detail: confidentiel ? "" : `Urgence ${s.niveauUrgence} (${s.urgenceLibelle})`,
      });
      if (confidentiel) continue;
      for (const inter of s.interventions) {
        ajouter(inter.date, {
          genre: "intervention",
          signId: s.id,
          eleveId: s.eleveId,
          libelle: `${inter.type} · ${nomComplet(eleve)} (${eleve.groupe})`,
          detail: `Étape ${inter.niveau}`,
        });
      }
    }
    return parJour;
  }, [db, eleveIds, confidentiel]);

  // Mois affiché au départ : le plus récent qui contient des événements.
  const [moisCourant, setMoisCourant] = useState(() => {
    const jours = [...evenements.keys()].sort();
    const dernier = jours[jours.length - 1];
    if (!dernier) return { annee: 2026, mois: 8 }; // septembre 2026 par défaut
    const [a, m] = decouper(dernier);
    return { annee: a, mois: m - 1 };
  });
  const [jourChoisi, setJourChoisi] = useState(null);

  const changerMois = (delta) => {
    setJourChoisi(null);
    setMoisCourant(({ annee, mois }) => {
      const total = annee * 12 + mois + delta;
      return { annee: Math.floor(total / 12), mois: ((total % 12) + 12) % 12 };
    });
  };

  // La grille : semaines du lundi au dimanche, avec les jours voisins en grisé.
  const grille = useMemo(() => {
    const { annee, mois } = moisCourant;
    const premier = new Date(annee, mois, 1);
    const decalage = (premier.getDay() + 6) % 7; // lundi = 0
    const nbJours = new Date(annee, mois + 1, 0).getDate();
    const cases = [];
    for (let i = 0; i < decalage; i++) cases.push(null);
    for (let j = 1; j <= nbJours; j++) {
      cases.push(`${annee}-${String(mois + 1).padStart(2, "0")}-${String(j).padStart(2, "0")}`);
    }
    while (cases.length % 7 !== 0) cases.push(null);
    return cases;
  }, [moisCourant]);

  const totalDuMois = grille.reduce((somme, jour) => somme + (jour && evenements.has(jour) ? evenements.get(jour).length : 0), 0);
  const listeChoisie = jourChoisi ? evenements.get(jourChoisi) || [] : [];

  return (
    <>
      <div className="calendrier-entete">
        <button className="bouton secondaire" onClick={() => changerMois(-1)} aria-label="Mois précédent">‹ Mois précédent</button>
        <h3 style={{ margin: 0 }} aria-live="polite">
          {MOIS[moisCourant.mois].charAt(0).toUpperCase() + MOIS[moisCourant.mois].slice(1)} {moisCourant.annee}
        </h3>
        <button className="bouton secondaire" onClick={() => changerMois(1)} aria-label="Mois suivant">Mois suivant ›</button>
      </div>
      <p className="sous-titre">
        {totalDuMois} événement{totalDuMois > 1 ? "s" : ""} ce mois-ci.
        Cliquez sur une journée pour voir le détail.
      </p>
      <ul className="legende legende-calendrier" aria-hidden="true">
        <li><span className="pastille-couleur" style={{ background: COULEUR_SIGNALEMENT }} /> <span className="legende-nom">Signalements</span></li>
        {!confidentiel && <li><span className="pastille-couleur" style={{ background: COULEUR_INTERVENTION }} /> <span className="legende-nom">Interventions</span></li>}
      </ul>

      <div className="panneau" style={{ padding: "10px" }}>
        <div className="calendrier" role="grid" aria-label={`Calendrier de ${MOIS[moisCourant.mois]} ${moisCourant.annee}`}>
          {JOURS.map((j) => <div key={j} className="calendrier-jour-nom">{j}</div>)}
          {grille.map((jour, i) => {
            if (!jour) return <div key={`vide-${i}`} className="calendrier-case vide" aria-hidden="true" />;
            const liste = evenements.get(jour) || [];
            const nbSign = liste.filter((e) => e.genre === "signalement").length;
            const nbInter = liste.filter((e) => e.genre === "intervention").length;
            const numero = Number(jour.slice(8));
            return (
              <button
                key={jour}
                className="calendrier-case"
                aria-pressed={jourChoisi === jour}
                aria-label={`${numero} ${MOIS[moisCourant.mois]} : ${nbSign} signalement${nbSign > 1 ? "s" : ""}, ${nbInter} intervention${nbInter > 1 ? "s" : ""}`}
                onClick={() => setJourChoisi(jourChoisi === jour ? null : jour)}
              >
                <span className="calendrier-numero num">{numero}</span>
                <span className="calendrier-points">
                  {nbSign > 0 && <span className="point-evenement" style={{ background: COULEUR_SIGNALEMENT }}>{nbSign}</span>}
                  {nbInter > 0 && <span className="point-evenement" style={{ background: COULEUR_INTERVENTION }}>{nbInter}</span>}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {jourChoisi && (
        <div className="panneau">
          <h3 style={{ marginTop: 0 }}>
            Le {Number(jourChoisi.slice(8))} {MOIS[moisCourant.mois]} {moisCourant.annee}
          </h3>
          {listeChoisie.length === 0 && <p className="sous-titre">Aucun événement ce jour-là.</p>}
          <ul className="journal">
            {listeChoisie.map((ev, i) => (
              <li key={i}>
                <span className="pastille-couleur" style={{ background: ev.genre === "signalement" ? COULEUR_SIGNALEMENT : COULEUR_INTERVENTION, marginRight: "6px" }} aria-hidden="true" />
                <span className="qui">{ev.libelle}</span>{" "}
                <span className="quand">{ev.detail}</span>{" "}
                <button className="bouton discret" onClick={() => ouvrirDossier(ev)}>{confidentiel ? "Ouvrir le profil" : "Ouvrir le dossier"}</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
