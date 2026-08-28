import { useMemo, useState } from "react";
import { nomComplet, coursDe, elevesDe, signalementsDe, ETAPES } from "./aides.js";
import { Indicateur, EtiquetteES } from "./Etiquettes.jsx";
import FormulaireSignalement from "./FormulaireSignalement.jsx";
import ProfilEleve from "./ProfilEleve.jsx";
import Calendrier from "./Calendrier.jsx";
import Chronologie from "./Chronologie.jsx";
import ListeAFaire, { tachesEnseignant } from "./ListeAFaire.jsx";
import { Barres } from "./Graphiques.jsx";
import { Users, Activity, FileText, MessageSquarePlus, ChevronDown } from "lucide-react";

const VUES = {
  tous: "Tous mes élèves",
  suivi: "Élèves avec un suivi actif",
  miens: "Élèves que j'ai signalés",
  contribuer: "Élèves où je peux contribuer",
};

// Le Kanban de l'enseignant : ses élèves, colonne par étape du suivi.
// Il ne montre que ce que l'enseignant voit déjà : étape, indicateur,
// nombre de cycles. Cliquer une carte ouvre le profil.
function KanbanEnseignant({ db, eleves, dossierActif, aContribuer, surProfil }) {
  const colonnes = [
    { cle: "sans", nom: "Sans suivi", garde: (e) => !dossierActif(e) },
    ...ETAPES.map((et) => ({ cle: et.n, nom: et.nom, garde: (e) => dossierActif(e)?.niveauIntervention === et.n })),
  ];
  return (
    <>
      <p className="callout-note">
        Où en sont mes élèves : sans suivi, puis étape 1 à 3. Cliquez une carte pour ouvrir le profil.
      </p>
      <div className="kanban">
        {colonnes.map((col) => {
          const cartes = eleves.filter(col.garde);
          return (
            <section key={col.cle} className="kanban-colonne" aria-label={`${col.nom} : ${cartes.length} élève${cartes.length > 1 ? "s" : ""}`}>
              <h3 className="kanban-titre">{col.nom} <span className="compte-section">· {cartes.length}</span></h3>
              {cartes.map((e) => {
                const actif = dossierActif(e);
                const cycles = signalementsDe(db, e.id).length;
                return (
                  <button key={e.id} className="kanban-carte" onClick={() => surProfil(e)}>
                    <span className="kanban-nom">{nomComplet(e)} {e.eed && <EtiquetteES />}</span>
                    <span className="kanban-meta">{e.annee}e · {e.groupe} · {cycles} cycle{cycles > 1 ? "s" : ""}</span>
                    {actif && (
                      <span className="kanban-etiquettes">
                        <Indicateur caVa={actif.indicateurCaVa} />
                        {aContribuer(e) && <span className="etiquette moyen">À contribuer</span>}
                      </span>
                    )}
                  </button>
                );
              })}
              {cartes.length === 0 && <p className="aide">Personne ici.</p>}
            </section>
          );
        })}
      </div>
    </>
  );
}

// Vue enseignant : les mêmes vues que l'équipe, mais pour ses propres
// élèves, avec la confidentialité respectée partout.
export default function VueEnseignant({ db, utilisateur, actions, sombre }) {
  const mesCours = coursDe(db, utilisateur);
  const mesEleves = useMemo(() => elevesDe(db, utilisateur), [db, utilisateur]);

  const [onglet, setOnglet] = useState("bord");
  const [vue, setVue] = useState("tous"); // choisie en cliquant une carte
  const [filtreGroupe, setFiltreGroupe] = useState("tous");
  const [fEtape, setFEtape] = useState("toutes");
  const [fCycles, setFCycles] = useState("tous");
  const [recherche, setRecherche] = useState("");
  const [formulaire, setFormulaire] = useState(null); // null | {eleve?}
  const [profil, setProfil] = useState(null);
  const [legendeOuverte, setLegendeOuverte] = useState(false);

  const dossierActif = (eleve) => signalementsDe(db, eleve.id).find((s) => s.statut !== "clos");

  // Un dossier « à contribuer » : signalé par un collègue, encore à risque,
  // et je n'ai pas encore ajouté mon observation.
  const aContribuer = (eleve) =>
    signalementsDe(db, eleve.id).some(
      (s) =>
        s.statut !== "clos" &&
        s.auteurId !== utilisateur.id &&
        !s.indicateurCaVa &&
        !s.observations.some((o) => o.auteurId === utilisateur.id)
    );

  const suivisActifs = mesEleves.filter((e) => dossierActif(e));
  const elevesAContribuer = mesEleves.filter(aContribuer);
  const mesSignales = mesEleves.filter((e) =>
    signalementsDe(db, e.id).some((s) => s.statut !== "clos" && s.auteurId === utilisateur.id)
  );
  const taches = tachesEnseignant(db, utilisateur, mesEleves);

  const groupes = [...new Set(mesCours.map((c) => c.groupe))].sort();
  const visibles = mesEleves
    .filter((e) => {
      if (vue === "suivi") return dossierActif(e);
      if (vue === "miens") return mesSignales.includes(e);
      if (vue === "contribuer") return aContribuer(e);
      return true;
    })
    .filter((e) => filtreGroupe === "tous" || e.groupe === filtreGroupe)
    .filter((e) => {
      if (fEtape === "toutes") return true;
      const actif = dossierActif(e);
      return actif && actif.niveauIntervention === Number(fEtape);
    })
    .filter((e) => {
      if (fCycles === "tous") return true;
      const n = signalementsDe(db, e.id).length;
      if (fCycles === "0") return n === 0;
      if (fCycles === "1") return n === 1;
      return n >= 2; // « 2+ »
    })
    .filter((e) => nomComplet(e).toLowerCase().includes(recherche.toLowerCase()))
    .sort((a, b) => a.annee - b.annee || a.groupe.localeCompare(b.groupe) || a.nom.localeCompare(b.nom));

  // Cliquer une carte du tableau de bord ouvre la liste, déjà filtrée.
  const allerAuxDossiers = (v) => { setVue(v); setOnglet("dossiers"); };

  // Deux graphiques sûrs pour l'enseignant : ils n'utilisent que ce
  // qu'il ou elle voit déjà (ses élèves, l'étape des suivis actifs).
  const couleurBarre = sombre ? "#C7AC8A" : "#584427";
  const parGroupe = groupes.map((g) => ({
    nom: g,
    valeur: mesEleves.filter((e) => e.groupe === g).length,
    couleur: couleurBarre,
  }));
  const parEtape = ETAPES.map((et) => ({
    nom: et.nom,
    valeur: suivisActifs.filter((e) => dossierActif(e).niveauIntervention === et.n).length,
    couleur: couleurBarre,
  }));

  return (
    <>
      <h2>Mon tableau de bord</h2>
      <p className="sous-titre">
        {utilisateur.matiere} · {mesCours.map((c) => `${c.groupe}`).join(", ")}
      </p>

      <div className="onglets" role="tablist">
        <button role="tab" aria-selected={onglet === "bord"} className="onglet" onClick={() => setOnglet("bord")}>Tableau de bord</button>
        <button role="tab" aria-selected={onglet === "afaire"} className="onglet" onClick={() => setOnglet("afaire")}>À faire{taches.length > 0 ? ` · ${taches.length}` : ""}</button>
        <button role="tab" aria-selected={onglet === "kanban"} className="onglet" onClick={() => setOnglet("kanban")}>Kanban</button>
        <button role="tab" aria-selected={onglet === "dossiers"} className="onglet" onClick={() => setOnglet("dossiers")}>Dossiers</button>
        <button role="tab" aria-selected={onglet === "calendrier"} className="onglet" onClick={() => setOnglet("calendrier")}>Calendrier</button>
        <button role="tab" aria-selected={onglet === "chronologie"} className="onglet" onClick={() => setOnglet("chronologie")}>Chronologie</button>
      </div>

      {onglet === "bord" && (
        <>
          <div className="grille-cartes">
            <button className="carte-stat cliquable" onClick={() => allerAuxDossiers("tous")}>
              <span className="stat-icone"><Users size={18} strokeWidth={1.5} aria-hidden="true" /></span>
              <span className="valeur">{mesEleves.length}</span><span className="nom">Mes élèves</span>
            </button>
            <button className="carte-stat cliquable" onClick={() => allerAuxDossiers("suivi")}>
              <span className="stat-icone"><Activity size={18} strokeWidth={1.5} aria-hidden="true" /></span>
              <span className="valeur">{suivisActifs.length}</span><span className="nom">Avec un suivi actif</span>
            </button>
            <button className="carte-stat cliquable" onClick={() => allerAuxDossiers("miens")}>
              <span className="stat-icone"><FileText size={18} strokeWidth={1.5} aria-hidden="true" /></span>
              <span className="valeur">{mesSignales.length}</span><span className="nom">Mes signalements actifs</span>
            </button>
            <button className="carte-stat cliquable" onClick={() => allerAuxDossiers("contribuer")}>
              <span className="stat-icone"><MessageSquarePlus size={18} strokeWidth={1.5} aria-hidden="true" /></span>
              <span className="valeur">{elevesAContribuer.length}</span><span className="nom">À contribuer</span>
            </button>
          </div>

          {elevesAContribuer.length > 0 && (
            <div className="info" role="status">
              <strong>Un collègue a signalé {elevesAContribuer.length > 1 ? "des élèves" : "un élève"} de vos groupes :</strong>{" "}
              {elevesAContribuer.map((e, i) => (
                <span key={e.id}>
                  {i > 0 && ", "}
                  <button className="bouton discret" onClick={() => setProfil(e)}>{nomComplet(e)}</button>
                </span>
              ))}
              . Ouvrez le profil pour ajouter vos observations.
            </div>
          )}

          <div className="grille-graphiques">
            <div className="panneau">
              <Barres titre="Mes élèves par groupe" donnees={parGroupe} />
            </div>
            <div className="panneau">
              <Barres titre="Suivis actifs par étape" note="Seulement mes élèves avec un cycle actif" donnees={parEtape} />
            </div>
          </div>

          <div className="panneau">
            <button
              className="bouton-legende"
              aria-expanded={legendeOuverte}
              onClick={() => setLegendeOuverte(!legendeOuverte)}
            >
              Étapes du suivi
              <ChevronDown size={16} strokeWidth={1.5} aria-hidden="true" />
            </button>
            {legendeOuverte && (
              <ol className="liste-etapes">
                {ETAPES.map((e) => (
                  <li key={e.n}><strong>{e.nom}.</strong> {e.description}</li>
                ))}
              </ol>
            )}
          </div>
        </>
      )}

      {onglet === "afaire" && (
        <ListeAFaire
          db={db}
          taches={taches}
          libelleAction="Ouvrir le profil"
          surAction={(t) => setProfil(db.eleves.find((x) => x.id === t.eleveId))}
        />
      )}

      {onglet === "kanban" && (
        <KanbanEnseignant
          db={db}
          eleves={mesEleves}
          dossierActif={dossierActif}
          aContribuer={aContribuer}
          surProfil={setProfil}
        />
      )}

      {onglet === "calendrier" && (
        <Calendrier
          db={db}
          sombre={sombre}
          eleveIds={mesEleves.map((e) => e.id)}
          confidentiel
          ouvrirDossier={(ev) => setProfil(db.eleves.find((x) => x.id === ev.eleveId))}
        />
      )}

      {onglet === "chronologie" && (
        <Chronologie
          db={db}
          sombre={sombre}
          eleveIds={mesEleves.map((e) => e.id)}
          confidentiel
          libelleAction="Ouvrir le profil"
          ouvrirDossier={(ev) => setProfil(db.eleves.find((x) => x.id === ev.eleveId))}
        />
      )}

      {onglet === "dossiers" && (
        <>
          <h2>{VUES[vue]}</h2>
          <div className="filtres">
            <div>
              <label htmlFor="groupe">Groupe</label>
              <select id="groupe" value={filtreGroupe} onChange={(e) => setFiltreGroupe(e.target.value)}>
                <option value="tous">Tous mes groupes</option>
                {groupes.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="f-vue">Vue</label>
              <select id="f-vue" value={vue} onChange={(e) => setVue(e.target.value)}>
                {Object.entries(VUES).map(([cle, nom]) => <option key={cle} value={cle}>{nom}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="f-etape">Étape du suivi</label>
              <select id="f-etape" value={fEtape} onChange={(e) => setFEtape(e.target.value)}>
                <option value="toutes">Toutes</option>
                {ETAPES.map((e) => <option key={e.n} value={e.n}>{e.nom}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="f-cycles">Nombre de cycles</label>
              <select id="f-cycles" value={fCycles} onChange={(e) => setFCycles(e.target.value)}>
                <option value="tous">Tous</option>
                <option value="0">Aucun</option>
                <option value="1">1 cycle</option>
                <option value="2+">2 cycles et plus</option>
              </select>
            </div>
            <div>
              <label htmlFor="recherche">Rechercher</label>
              <input id="recherche" type="search" value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Nom de l'élève" />
            </div>
            <button className="bouton" onClick={() => setFormulaire({})}>Signaler un élève</button>
          </div>

          <p className="sous-titre" aria-live="polite">
            {visibles.length} élève{visibles.length > 1 ? "s" : ""} affiché{visibles.length > 1 ? "s" : ""}.
          </p>

          <div className="defile">
            <table>
              <thead>
                <tr>
                  <th>Élève</th><th>Année</th><th>Groupe</th>
                  <th className="num">Cycles</th><th>Étape</th><th>Suivi</th><th></th>
                </tr>
              </thead>
              <tbody>
                {visibles.length === 0 && (
                  <tr><td colSpan="7" style={{ color: "var(--secondaire)" }}>Aucun élève ne correspond aux filtres.</td></tr>
                )}
                {visibles.map((e) => {
                  const dossiers = signalementsDe(db, e.id);
                  const actif = dossiers.find((s) => s.statut !== "clos");
                  return (
                    <tr key={e.id}>
                      <td>
                        <button className="bouton discret" onClick={() => setProfil(e)}>{nomComplet(e)}</button>
                        {e.eed && <> <EtiquetteES /></>}
                      </td>
                      <td className="num">{e.annee}e</td>
                      <td>{e.groupe}</td>
                      <td className="num">{dossiers.length > 0 ? <span className="pastille">{dossiers.length}</span> : "0"}</td>
                      <td>{actif ? <span className="etiquette neutre">Étape {actif.niveauIntervention}</span> : ""}</td>
                      <td>
                        {actif ? <Indicateur caVa={actif.indicateurCaVa} /> : <span className="etiquette neutre">Aucun suivi</span>}
                        {aContribuer(e) && <> <span className="etiquette moyen">À contribuer</span></>}
                      </td>
                      <td><button className="bouton discret" onClick={() => setFormulaire({ eleve: e })}>Signaler</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {formulaire && (
        <FormulaireSignalement
          db={db} utilisateur={utilisateur} actions={actions}
          eleveInitial={formulaire.eleve || null}
          fermer={() => setFormulaire(null)}
        />
      )}
      {profil && (
        <ProfilEleve
          db={db}
          eleve={db.eleves.find((e) => e.id === profil.id)}
          utilisateur={utilisateur}
          actions={actions}
          fermer={() => setProfil(null)}
          signaler={() => { const e = profil; setProfil(null); setFormulaire({ eleve: e }); }}
        />
      )}
    </>
  );
}
