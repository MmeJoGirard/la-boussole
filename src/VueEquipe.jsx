import { useMemo, useState } from "react";
import { nomComplet, trouverEleve, trouverMembre, STATUTS, ETAPES, typesDe } from "./aides.js";
import { EtiquetteUrgence, EtiquetteStatut, Indicateur, EtiquetteES } from "./Etiquettes.jsx";
import FicheDossier from "./FicheDossier.jsx";
import TableauAudit from "./TableauAudit.jsx";
import TableauDeBord from "./Graphiques.jsx";
import Calendrier from "./Calendrier.jsx";

// Un groupe de filtres à sélection multiple : des boutons qu'on active
// ou désactive. Aucun bouton actif = tout est affiché.
function FiltreMultiple({ titre, options, actives, basculer }) {
  return (
    <fieldset className="filtre-multiple">
      <legend className="legende-champ">{titre}</legend>
      <div className="chips">
        {options.map((o) => (
          <button
            key={o.valeur}
            type="button"
            className="chip-filtre"
            aria-pressed={actives.includes(o.valeur)}
            onClick={() => basculer(o.valeur)}
          >
            {o.nom}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

// Vue partagée par l'équipe (ERRÉ + éducation spécialisée) et la direction.
// La direction a en plus l'onglet Journal d'audit.
export default function VueEquipe({ db, utilisateur, actions, direction }) {
  const [onglet, setOnglet] = useState("bord");
  const [fAnnees, setFAnnees] = useState([]);
  const [fEtapes, setFEtapes] = useState([]);
  const [fUrgences, setFUrgences] = useState([]);
  const [fStatut, setFStatut] = useState("actifs");
  const [fEleve, setFEleve] = useState("");
  const [dossierOuvert, setDossierOuvert] = useState(null);
  const [legendeOuverte, setLegendeOuverte] = useState(false);

  const basculer = (setListe) => (valeur) =>
    setListe((liste) => (liste.includes(valeur) ? liste.filter((x) => x !== valeur) : [...liste, valeur]));

  const dossiers = useMemo(() => {
    return db.signalements
      .map((s) => ({ s, eleve: trouverEleve(db, s.eleveId) }))
      .filter(({ s, eleve }) => {
        if (fStatut === "actifs" && s.statut === "clos") return false;
        if (fStatut !== "actifs" && fStatut !== "tous" && s.statut !== fStatut) return false;
        if (fAnnees.length && !fAnnees.includes(eleve.annee)) return false;
        if (fEtapes.length && !fEtapes.includes(s.niveauIntervention)) return false;
        if (fUrgences.length && !fUrgences.includes(s.niveauUrgence)) return false;
        if (fEleve && !nomComplet(eleve).toLowerCase().includes(fEleve.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => b.s.niveauUrgence - a.s.niveauUrgence || a.s.date.localeCompare(b.s.date));
  }, [db, fAnnees, fEtapes, fUrgences, fStatut, fEleve]);

  const actifs = db.signalements.filter((s) => s.statut !== "clos");
  const stats = {
    actifs: actifs.length,
    nouveaux: actifs.filter((s) => s.statut === "nouveau").length,
    urgents: actifs.filter((s) => s.niveauUrgence >= 3).length,
    transferes: actifs.filter((s) => s.statut === "transfere_direction").length,
    clos: db.signalements.filter((s) => s.statut === "clos").length,
  };

  // Les cartes de totaux sont cliquables : elles ouvrent l'onglet
  // Dossiers avec le bon filtre déjà appliqué.
  const allerAuxDossiers = (patch) => {
    setFAnnees([]); setFEtapes([]); setFUrgences([]); setFEleve("");
    setFStatut(patch.statut || "actifs");
    setFUrgences(patch.urgences || []);
    setOnglet("dossiers");
  };

  // Export : un fichier CSV encodé UTF-8 qui s'ouvre directement dans Excel.
  const exporter = async () => {
    const entetes = ["Élève", "Année", "Groupe", "ES", "Date", "Types", "Urgence", "Étape", "Statut", "Indicateur", "Responsable", "Prochaine étape"];
    const lignes = dossiers.map(({ s, eleve }) => [
      nomComplet(eleve), `${eleve.annee}e`, eleve.groupe, eleve.eed ? "Oui" : "Non", s.date,
      typesDe(s).join(" + "), `${s.niveauUrgence} (${s.urgenceLibelle})`, `Étape ${s.niveauIntervention}`,
      STATUTS[s.statut], s.indicateurCaVa ? "Ça va" : "À risque - suivi",
      s.responsableId ? nomComplet(trouverMembre(db, s.responsableId)) : "À assigner",
      s.prochaineEtape || "",
    ]);
    const csv = [entetes, ...lignes]
      .map((l) => l.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(";"))
      .join("\r\n");
    const nomFichier = `la-boussole-dossiers-${new Date().toISOString().slice(0, 10)}.csv`;
    const contenu = "\uFEFF" + csv;
    // Sur la page publi\u00E9e (claude.ai), le t\u00E9l\u00E9chargement passe par la
    // visionneuse, qui demande la confirmation \u00E0 la personne.
    const telechargements = window.claude ? await window.claude.use("downloads").catch(() => null) : null;
    if (telechargements) {
      try {
        await telechargements.save({ filename: nomFichier, data: contenu });
      } catch (e) {
        // La personne a refus\u00E9 ou ferm\u00E9 l'invite : rien d'autre \u00E0 faire.
      }
      return;
    }
    // En local (npm run dev), t\u00E9l\u00E9chargement direct du navigateur.
    const blob = new Blob([contenu], { type: "text/csv;charset=utf-8" });
    const lien = document.createElement("a");
    lien.href = URL.createObjectURL(blob);
    lien.download = nomFichier;
    lien.click();
    URL.revokeObjectURL(lien.href);
  };

  return (
    <>
      <h2>{direction ? "Tableau de bord de l'école" : "Élèves signalés"}</h2>
      <p className="sous-titre">
        {db.ecole.nom} · {db.ecole.anneeScolaire}, semestre {db.ecole.semestre}
      </p>

      <div className="grille-cartes">
        <button className="carte-stat cliquable" onClick={() => allerAuxDossiers({ statut: "actifs" })}>
          <div className="valeur">{stats.actifs}</div><div className="nom">Cycles actifs</div>
        </button>
        <button className="carte-stat cliquable" onClick={() => allerAuxDossiers({ statut: "nouveau" })}>
          <div className="valeur">{stats.nouveaux}</div><div className="nom">Nouveaux à traiter</div>
        </button>
        <button className="carte-stat cliquable" onClick={() => allerAuxDossiers({ statut: "actifs", urgences: [3, 4] })}>
          <div className="valeur">{stats.urgents}</div><div className="nom">Urgence 3 et plus</div>
        </button>
        <button className="carte-stat cliquable" onClick={() => allerAuxDossiers({ statut: "transfere_direction" })}>
          <div className="valeur">{stats.transferes}</div><div className="nom">À la direction</div>
        </button>
        <button className="carte-stat cliquable" onClick={() => allerAuxDossiers({ statut: "clos" })}>
          <div className="valeur">{stats.clos}</div><div className="nom">Cycles clos</div>
        </button>
      </div>

      <div className="onglets" role="tablist">
        <button role="tab" aria-selected={onglet === "bord"} className="onglet" onClick={() => setOnglet("bord")}>Tableau de bord</button>
        <button role="tab" aria-selected={onglet === "dossiers"} className="onglet" onClick={() => setOnglet("dossiers")}>Dossiers</button>
        <button role="tab" aria-selected={onglet === "calendrier"} className="onglet" onClick={() => setOnglet("calendrier")}>Calendrier</button>
        {direction && (
          <button role="tab" aria-selected={onglet === "audit"} className="onglet" onClick={() => setOnglet("audit")}>Journal d'audit</button>
        )}
      </div>

      {onglet === "bord" ? (
        <>
          <div className="panneau">
            <button
              className="bouton discret"
              aria-expanded={legendeOuverte}
              onClick={() => setLegendeOuverte(!legendeOuverte)}
              style={{ padding: 0 }}
            >
              {legendeOuverte ? "Masquer" : "Afficher"} la légende des étapes du suivi
            </button>
            {legendeOuverte && (
              <ol className="liste-etapes">
                {ETAPES.map((e) => (
                  <li key={e.n}><strong>{e.nom}.</strong> {e.description}</li>
                ))}
              </ol>
            )}
          </div>
          <TableauDeBord db={db} />
        </>
      ) : onglet === "calendrier" ? (
        <Calendrier db={db} ouvrirDossier={setDossierOuvert} />
      ) : onglet === "audit" && direction ? (
        <TableauAudit db={db} />
      ) : (
        <>
          <div className="filtres">
            <div>
              <label htmlFor="f-eleve">Élève</label>
              <input id="f-eleve" type="search" value={fEleve} onChange={(e) => setFEleve(e.target.value)} placeholder="Nom de l'élève" />
            </div>
            <div>
              <label htmlFor="f-statut">Statut</label>
              <select id="f-statut" value={fStatut} onChange={(e) => setFStatut(e.target.value)}>
                <option value="actifs">Actifs seulement</option>
                <option value="tous">Tous (avec clos)</option>
                {Object.entries(STATUTS).map(([cle, nom]) => <option key={cle} value={cle}>{nom}</option>)}
              </select>
            </div>
            <button className="bouton secondaire" onClick={exporter}>Exporter vers Excel</button>
          </div>
          <div className="filtres">
            <FiltreMultiple
              titre="Années (sélection multiple)"
              options={[7, 8, 9, 10, 11, 12].map((a) => ({ valeur: a, nom: `${a}e` }))}
              actives={fAnnees}
              basculer={basculer(setFAnnees)}
            />
            <FiltreMultiple
              titre="Étapes"
              options={ETAPES.map((e) => ({ valeur: e.n, nom: e.nom }))}
              actives={fEtapes}
              basculer={basculer(setFEtapes)}
            />
            <FiltreMultiple
              titre="Urgence"
              options={db.echelleUrgence.map((n) => ({ valeur: n.niveau, nom: `${n.niveau}` }))}
              actives={fUrgences}
              basculer={basculer(setFUrgences)}
            />
          </div>

          <p className="sous-titre" aria-live="polite">{dossiers.length} dossier{dossiers.length > 1 ? "s" : ""} affiché{dossiers.length > 1 ? "s" : ""}.</p>

          <div className="defile">
            <table>
              <thead>
                <tr>
                  <th>Élève</th><th>Année</th><th>Groupe</th><th>Date</th><th>Types</th>
                  <th>Urgence</th><th>Étape</th><th>Statut</th><th>Indicateur</th><th>Responsable</th><th></th>
                </tr>
              </thead>
              <tbody>
                {dossiers.length === 0 && (
                  <tr><td colSpan="11" style={{ color: "var(--gris)" }}>Aucun dossier ne correspond aux filtres.</td></tr>
                )}
                {dossiers.map(({ s, eleve }) => (
                  <tr key={s.id}>
                    <td>{nomComplet(eleve)} {eleve.eed && <EtiquetteES />}</td>
                    <td className="num">{eleve.annee}e</td>
                    <td>{eleve.groupe}</td>
                    <td className="num">{s.date}</td>
                    <td>{typesDe(s).join(", ")}</td>
                    <td><EtiquetteUrgence niveau={s.niveauUrgence} echelle={db.echelleUrgence} /></td>
                    <td>Étape {s.niveauIntervention}</td>
                    <td><EtiquetteStatut statut={s.statut} /></td>
                    <td><Indicateur caVa={s.indicateurCaVa} equipe /></td>
                    <td>{s.responsableId ? nomComplet(trouverMembre(db, s.responsableId)) : "À assigner"}</td>
                    <td><button className="bouton discret" onClick={() => setDossierOuvert(s.id)}>Ouvrir</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {dossierOuvert && (
        <FicheDossier
          db={db} signId={dossierOuvert} utilisateur={utilisateur} actions={actions}
          direction={direction} fermer={() => setDossierOuvert(null)}
        />
      )}
    </>
  );
}
