import { useState } from "react";
import { nomComplet, signalementsDe, trouverTuteur } from "./aides.js";
import { Indicateur, EtiquetteES } from "./Etiquettes.jsx";
import { X } from "lucide-react";

// Le profil d'un élève, vu par un enseignant : identité, famille,
// NOMBRE de signalements, et pour chaque dossier actif, seulement
// l'indicateur « ça va / à risque » et ses propres commentaires.
// Le détail complet reste réservé à l'équipe et à la direction.
// Le bouton « Faire un signalement » ouvre le formulaire prérempli.
export default function ProfilEleve({ db, eleve, utilisateur, actions, fermer, signaler }) {
  const dossiers = signalementsDe(db, eleve.id);
  const actifs = dossiers.filter((s) => s.statut !== "clos");
  const [textes, setTextes] = useState({});
  const [majOuverte, setMajOuverte] = useState(null); // id du dossier en cours de mise à jour
  const [majRencontre, setMajRencontre] = useState(false);
  const [majParents, setMajParents] = useState("");
  const [majNote, setMajNote] = useState("");

  const ajouter = (signId) => {
    const texte = (textes[signId] || "").trim();
    if (!texte) return;
    actions.ajouterObservation(signId, texte);
    setTextes((t) => ({ ...t, [signId]: "" }));
  };

  const envoyerMaj = (signId) => {
    actions.majSignalementAuteur(signId, {
      rencontreEleve: majRencontre,
      communicationParents: majParents,
      note: majNote.trim(),
    });
    setMajOuverte(null);
    setMajRencontre(false);
    setMajParents("");
    setMajNote("");
  };

  return (
    <div className="voile" role="dialog" aria-modal="true" aria-label={`Profil de ${nomComplet(eleve)}`}>
      <div className="modale">
        <div className="modale-entete">
          <h2>{nomComplet(eleve)} {eleve.eed && <EtiquetteES />}</h2>
          <button className="fermer" onClick={fermer} aria-label="Fermer"><X size={16} aria-hidden="true" /></button>
        </div>
        <p className="sous-titre">
          {eleve.annee}e année · groupe {eleve.groupe} · {eleve.anneeScolaire}, semestre {eleve.semestre} · {eleve.courriel}
        </p>
        {signaler && (
          <div className="rangee-boutons" style={{ marginTop: 0, marginBottom: 16 }}>
            <button className="bouton" onClick={signaler}>Faire un signalement pour {eleve.prenom}</button>
          </div>
        )}

        <div className="grille-cartes">
          <div className="carte-stat">
            <div className="valeur">{dossiers.length}</div>
            <div className="nom">Signalement{dossiers.length > 1 ? "s" : ""} au total</div>
          </div>
          <div className="carte-stat">
            <div className="valeur">{actifs.length}</div>
            <div className="nom">Cycle{actifs.length > 1 ? "s" : ""} actif{actifs.length > 1 ? "s" : ""}</div>
          </div>
        </div>

        <h3>Famille</h3>
        <ul>
          {eleve.famille.tuteurs.map((tid) => {
            const t = trouverTuteur(db, tid);
            return <li key={tid}>{nomComplet(t)} ({t.lien}) · {t.courriel} · {t.telephone}</li>;
          })}
        </ul>

        <h3>Suivis en cours</h3>
        {actifs.length === 0 && <p className="sous-titre">Aucun signalement actif pour cet élève.</p>}
        {actifs.map((s) => {
          const mesCommentaires = s.observations.filter((o) => o.auteurId === utilisateur.id);
          const jeSuisAuteur = s.auteurId === utilisateur.id;
          return (
            <div key={s.id} className="panneau">
              <p style={{ margin: "0 0 8px" }}>
                Signalement du {s.date} · <Indicateur caVa={s.indicateurCaVa} />
                {jeSuisAuteur && <> <span className="etiquette neutre">Votre signalement</span></>}
              </p>
              <p className="aide">
                Par confidentialité, vous voyez seulement l'indicateur global et vos propres commentaires.
                Le dossier complet est suivi par l'ERRÉ et la direction.
              </p>
              {jeSuisAuteur && <p><strong>Votre signalement :</strong> {s.raisons}</p>}
              {mesCommentaires.length > 0 && (
                <ul className="journal">
                  {mesCommentaires.map((o, i) => (
                    <li key={i}><span className="quand">{o.date}</span><br />{o.texte}</li>
                  ))}
                </ul>
              )}

              {jeSuisAuteur && (
                majOuverte === s.id ? (
                  <div className="panneau" style={{ marginBottom: 0 }}>
                    <h4 style={{ margin: "0 0 8px" }}>Mettre à jour mon signalement (étape 2)</h4>
                    <div className="case">
                      <input id={`maj-rencontre-${s.id}`} type="checkbox" checked={majRencontre} onChange={(e) => setMajRencontre(e.target.checked)} />
                      <span><label htmlFor={`maj-rencontre-${s.id}`} style={{ display: "inline", color: "inherit" }}>J'ai rencontré l'élève depuis mon signalement</label></span>
                    </div>
                    <div className="champ">
                      <label htmlFor={`maj-parents-${s.id}`}>J'ai communiqué avec les parents</label>
                      <select id={`maj-parents-${s.id}`} value={majParents} onChange={(e) => setMajParents(e.target.value)}>
                        <option value="">Pas de changement</option>
                        <option value="courriel">Oui, par courriel</option>
                        <option value="téléphone">Oui, par téléphone</option>
                        <option value="en personne">Oui, en personne</option>
                      </select>
                    </div>
                    <div className="champ">
                      <label htmlFor={`maj-note-${s.id}`}>Note de suivi</label>
                      <textarea id={`maj-note-${s.id}`} rows="2" value={majNote} onChange={(e) => setMajNote(e.target.value)}
                        placeholder="Ce qui s'est passé depuis : le suivi a été fait, réaction de l'élève après l'intervention…" />
                    </div>
                    <div className="rangee-boutons">
                      <button className="bouton" onClick={() => envoyerMaj(s.id)}>Enregistrer la mise à jour</button>
                      <button className="bouton secondaire" onClick={() => setMajOuverte(null)}>Annuler</button>
                    </div>
                  </div>
                ) : (
                  <div className="rangee-boutons">
                    <button className="bouton secondaire" onClick={() => setMajOuverte(s.id)}>
                      Mettre à jour mon signalement
                    </button>
                  </div>
                )
              )}

              {!jeSuisAuteur && !s.indicateurCaVa && (
                <div className="champ">
                  <label htmlFor={`obs-${s.id}`}>Ajouter une observation</label>
                  <textarea id={`obs-${s.id}`} rows="2" value={textes[s.id] || ""}
                    onChange={(e) => setTextes((t) => ({ ...t, [s.id]: e.target.value }))}
                    placeholder="Ce que j'observe dans mon cours…" />
                  <div className="rangee-boutons">
                    <button className="bouton" onClick={() => ajouter(s.id)}>Ajouter</button>
                  </div>
                </div>
              )}
              {!jeSuisAuteur && s.indicateurCaVa && (
                <p className="aide">L'indicateur est à « ça va » : rien à ajouter pour l'instant.</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
