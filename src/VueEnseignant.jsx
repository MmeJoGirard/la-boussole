import { useMemo, useState } from "react";
import { nomComplet, coursDe, elevesDe, signalementsDe, ETAPES } from "./aides.js";
import { Indicateur, EtiquetteES } from "./Etiquettes.jsx";
import FormulaireSignalement from "./FormulaireSignalement.jsx";
import ProfilEleve from "./ProfilEleve.jsx";
import { Users, Activity, FileText, MessageSquarePlus, ChevronDown } from "lucide-react";

// Vue enseignant : tableau de bord, puis « tous mes élèves »,
// classés par année, cours et groupe.
export default function VueEnseignant({ db, utilisateur, actions }) {
  const mesCours = coursDe(db, utilisateur);
  const mesEleves = useMemo(() => elevesDe(db, utilisateur), [db, utilisateur]);

  const [filtreGroupe, setFiltreGroupe] = useState("tous");
  const [recherche, setRecherche] = useState("");
  const [formulaire, setFormulaire] = useState(null); // null | {eleve?}
  const [profil, setProfil] = useState(null);
  const [legendeOuverte, setLegendeOuverte] = useState(false);

  const groupes = [...new Set(mesCours.map((c) => c.groupe))].sort();
  const visibles = mesEleves
    .filter((e) => filtreGroupe === "tous" || e.groupe === filtreGroupe)
    .filter((e) => nomComplet(e).toLowerCase().includes(recherche.toLowerCase()))
    .sort((a, b) => a.annee - b.annee || a.groupe.localeCompare(b.groupe) || a.nom.localeCompare(b.nom));

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

  const suivisActifs = mesEleves.filter((e) => signalementsDe(db, e.id).some((s) => s.statut !== "clos"));
  const elevesAContribuer = mesEleves.filter(aContribuer);
  const mesSignalements = db.signalements.filter((s) => s.auteurId === utilisateur.id && s.statut !== "clos");

  return (
    <>
      <h2>Mon tableau de bord</h2>
      <p className="sous-titre">
        {utilisateur.matiere} · {mesCours.map((c) => `${c.groupe}`).join(", ")}
      </p>

      <div className="grille-cartes">
        <div className="carte-stat">
          <span className="stat-icone"><Users size={18} strokeWidth={1.5} aria-hidden="true" /></span>
          <span className="valeur">{mesEleves.length}</span><span className="nom">Mes élèves</span>
        </div>
        <div className="carte-stat">
          <span className="stat-icone"><Activity size={18} strokeWidth={1.5} aria-hidden="true" /></span>
          <span className="valeur">{suivisActifs.length}</span><span className="nom">Avec un suivi actif</span>
        </div>
        <div className="carte-stat">
          <span className="stat-icone"><FileText size={18} strokeWidth={1.5} aria-hidden="true" /></span>
          <span className="valeur">{mesSignalements.length}</span><span className="nom">Mes signalements actifs</span>
        </div>
        <div className="carte-stat">
          <span className="stat-icone"><MessageSquarePlus size={18} strokeWidth={1.5} aria-hidden="true" /></span>
          <span className="valeur">{elevesAContribuer.length}</span><span className="nom">À contribuer</span>
        </div>
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

      <h2>Mes élèves</h2>
      <div className="filtres">
        <div>
          <label htmlFor="groupe">Groupe</label>
          <select id="groupe" value={filtreGroupe} onChange={(e) => setFiltreGroupe(e.target.value)}>
            <option value="tous">Tous mes groupes</option>
            {groupes.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="recherche">Rechercher</label>
          <input id="recherche" type="search" value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Nom de l'élève" />
        </div>
        <button className="bouton" onClick={() => setFormulaire({})}>Signaler un élève</button>
      </div>

      <div className="defile">
        <table>
          <thead>
            <tr>
              <th>Élève</th><th>Année</th><th>Groupe</th>
              <th className="num">Signalements</th><th>Suivi</th><th></th>
            </tr>
          </thead>
          <tbody>
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

      {formulaire && (
        <FormulaireSignalement
          db={db} utilisateur={utilisateur} actions={actions}
          eleveInitial={formulaire.eleve || null}
          fermer={() => setFormulaire(null)}
        />
      )}
      {profil && (
        <ProfilEleve db={db} eleve={db.eleves.find((e) => e.id === profil.id)} utilisateur={utilisateur} actions={actions} fermer={() => setProfil(null)} />
      )}
    </>
  );
}
