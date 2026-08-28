import { useState } from "react";
import { nomComplet, trouverEleve, trouverMembre, trouverTuteur, PROCHAINES_ETAPES, ETAPES, typesDe } from "./aides.js";
import { EtiquetteUrgence, EtiquetteStatut, Indicateur, EtiquetteES } from "./Etiquettes.jsx";

// La fiche complète d'un dossier : réservée à l'ERRÉ, à l'éducation
// spécialisée et à la direction.
export default function FicheDossier({ db, signId, utilisateur, actions, direction, fermer }) {
  const s = db.signalements.find((x) => x.id === signId);
  const eleve = trouverEleve(db, s.eleveId);
  const auteur = trouverMembre(db, s.auteurId);

  const [noteIntervention, setNoteIntervention] = useState("");
  const [typeIntervention, setTypeIntervention] = useState(PROCHAINES_ETAPES[0]);
  const [etapeIntervention, setEtapeIntervention] = useState(s.niveauIntervention);
  const [noteCloture, setNoteCloture] = useState("");
  const [clotureOuverte, setClotureOuverte] = useState(false);
  const [erreur, setErreur] = useState("");

  const [planOuvert, setPlanOuvert] = useState(false);
  const [planSecurite, setPlanSecurite] = useState(s.planSecurite || "");
  const [adaptations, setAdaptations] = useState(s.adaptations || "");

  const [courrielOuvert, setCourrielOuvert] = useState(false);
  const [objetParents, setObjetParents] = useState(`Suivi concernant ${eleve.prenom}`);
  const [corpsParents, setCorpsParents] = useState(
    `Bonjour,\n\nNous souhaitons vous informer que l'équipe-école accompagne ${eleve.prenom} depuis quelques jours (${typesDe(s).join(", ")}). ` +
    `Nous aimerions vous rencontrer pour en discuter et convenir ensemble des prochaines étapes.\n\n` +
    `Merci de nous indiquer vos disponibilités.\n\nCordialement,\n${nomComplet(utilisateur)}\n${db.ecole.nom}`
  );

  const clos = s.statut === "clos";

  const ajouterIntervention = () => {
    if (!noteIntervention.trim()) return setErreur("Ajoutez une note pour documenter l'intervention.");
    setErreur("");
    actions.ajouterIntervention(s.id, { type: typeIntervention, note: noteIntervention.trim(), niveau: Number(etapeIntervention) });
    setNoteIntervention("");
  };

  const clore = () => {
    if (!noteCloture.trim()) return setErreur("La note de clôture est obligatoire.");
    setErreur("");
    actions.cloreCycle(s.id, noteCloture.trim());
    setClotureOuverte(false);
  };

  const sauvegarderPlans = () => {
    actions.sauvegarderPlans(s.id, { planSecurite: planSecurite.trim(), adaptations: adaptations.trim() });
    setPlanOuvert(false);
  };

  const envoyerParents = () => {
    actions.courrielParents(s.id, objetParents, corpsParents);
    setCourrielOuvert(false);
  };

  return (
    <div className="voile" role="dialog" aria-modal="true" aria-label={`Dossier de ${nomComplet(eleve)}`}>
      <div className="modale">
        <div className="modale-entete">
          <h2>{nomComplet(eleve)} {eleve.eed && <EtiquetteES />}</h2>
          <button className="fermer" onClick={fermer} aria-label="Fermer">✕</button>
        </div>
        <p className="sous-titre">
          {eleve.annee}e année · groupe {eleve.groupe} · signalé le {s.date} par {nomComplet(auteur)}
        </p>
        <p>
          <EtiquetteStatut statut={s.statut} />{" "}
          <EtiquetteUrgence niveau={s.niveauUrgence} echelle={db.echelleUrgence} />{" "}
          <span className="etiquette neutre" title={ETAPES.find((e) => e.n === s.niveauIntervention)?.description}>
            Étape {s.niveauIntervention}
          </span>{" "}
          <Indicateur caVa={s.indicateurCaVa} equipe />
          {s.caseEED && <> <span className="etiquette eed">Éducation spécialisée avisée</span></>}
        </p>

        <h3>Signalement</h3>
        <p><strong>Type(s) :</strong> {typesDe(s).join(", ")} · <strong>Raisons :</strong> {s.raisons}</p>
        <p className="aide">
          Déjà fait par l'enseignant·e : {s.dejaFait.rencontreEleve ? "rencontre avec l'élève" : "pas encore de rencontre"} ·{" "}
          {s.dejaFait.communicationParents ? `parents contactés (${s.dejaFait.communicationParents})` : "parents pas encore contactés"}
          {s.autreInformation ? ` · ${s.autreInformation}` : ""}
        </p>

        <h3>Famille</h3>
        <ul>
          {eleve.famille.tuteurs.map((tid) => {
            const t = trouverTuteur(db, tid);
            return <li key={tid}>{nomComplet(t)} ({t.lien}) · {t.courriel} · {t.telephone}</li>;
          })}
        </ul>

        <h3>Plan de sécurité et adaptations</h3>
        {planOuvert ? (
          <div className="panneau">
            <div className="champ">
              <label htmlFor="plan-securite">Plan de sécurité</label>
              <textarea id="plan-securite" rows="3" value={planSecurite} onChange={(e) => setPlanSecurite(e.target.value)}
                placeholder="Personne-ressource, lieu sûr, vérifications, qui est informé…" />
            </div>
            <div className="champ">
              <label htmlFor="adaptations">Adaptations</label>
              <textarea id="adaptations" rows="3" value={adaptations} onChange={(e) => setAdaptations(e.target.value)}
                placeholder="Aménagements en classe, évaluations, encadrement…" />
            </div>
            <div className="rangee-boutons">
              <button className="bouton" onClick={sauvegarderPlans}>Enregistrer</button>
              <button className="bouton secondaire" onClick={() => setPlanOuvert(false)}>Annuler</button>
            </div>
          </div>
        ) : (
          <>
            <p><strong>Plan de sécurité :</strong> {s.planSecurite || "Aucun pour l'instant."}</p>
            <p><strong>Adaptations :</strong> {s.adaptations || "Aucune pour l'instant."}</p>
            {!clos && (
              <div className="rangee-boutons">
                <button className="bouton secondaire" onClick={() => { setPlanSecurite(s.planSecurite || ""); setAdaptations(s.adaptations || ""); setPlanOuvert(true); }}>
                  Modifier le plan et les adaptations
                </button>
              </div>
            )}
          </>
        )}

        <h3>Observations des enseignants ({s.observations.length})</h3>
        {s.observations.length === 0 && <p className="sous-titre">Aucune observation pour l'instant.</p>}
        <ul className="journal">
          {s.observations.map((o, i) => (
            <li key={i}>
              <span className="qui">{nomComplet(trouverMembre(db, o.auteurId))}</span>{" "}
              <span className="quand">{o.date}</span>
              <br />{o.texte}
            </li>
          ))}
        </ul>

        <h3>Interventions ({s.interventions.length})</h3>
        <ul className="journal">
          {s.interventions.map((inter, i) => (
            <li key={i}>
              <span className="qui">Étape {inter.niveau} · {inter.type}</span>{" "}
              <span className="quand">{inter.date} · {nomComplet(trouverMembre(db, inter.responsableId))}</span>
              <br />{inter.note}
            </li>
          ))}
        </ul>

        {clos ? (
          <div className="info">
            <strong>Cycle clos.</strong> Note de clôture : {s.noteCloture}
          </div>
        ) : (
          <>
            <div className="panneau">
              <h3 style={{ marginTop: 0 }}>Ajouter une intervention</h3>
              <div className="filtres">
                <div>
                  <label htmlFor="type-inter">Type</label>
                  <select id="type-inter" value={typeIntervention} onChange={(e) => setTypeIntervention(e.target.value)}>
                    {PROCHAINES_ETAPES.filter((p) => p !== "Référence à la direction").map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="etape-inter">Étape</label>
                  <select id="etape-inter" value={etapeIntervention} onChange={(e) => setEtapeIntervention(e.target.value)}>
                    {ETAPES.map((e) => <option key={e.n} value={e.n}>{e.nom}</option>)}
                  </select>
                </div>
              </div>
              <p className="aide">{ETAPES.find((e) => e.n === Number(etapeIntervention))?.description}</p>
              <div className="champ">
                <label htmlFor="note-inter">Note de suivi</label>
                <textarea id="note-inter" rows="2" value={noteIntervention} onChange={(e) => setNoteIntervention(e.target.value)}
                  placeholder="Ce qui a été fait, ce qui est convenu…" />
              </div>
              <div className="filtres">
                <div>
                  <label htmlFor="etape">Prochaine étape</label>
                  <select id="etape" value={s.prochaineEtape || ""} onChange={(e) => actions.changerProchaineEtape(s.id, e.target.value)}>
                    {PROCHAINES_ETAPES.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="indicateur">Indicateur visible aux enseignants</label>
                  <select id="indicateur" value={s.indicateurCaVa ? "oui" : "non"} onChange={(e) => actions.changerIndicateur(s.id, e.target.value === "oui")}>
                    <option value="non">À risque · suivi</option>
                    <option value="oui">Ça va</option>
                  </select>
                </div>
              </div>
              <div className="rangee-boutons">
                <button className="bouton" onClick={ajouterIntervention}>Enregistrer l'intervention</button>
                {!direction && s.statut !== "transfere_direction" && (
                  <button className="bouton secondaire" onClick={() => actions.transfererDirection(s.id)}>
                    Transférer à la direction
                  </button>
                )}
                {direction && (
                  <button className="bouton secondaire" onClick={() => setCourrielOuvert(!courrielOuvert)}>
                    Courriel aux parents (suggestion)
                  </button>
                )}
                <button className="bouton danger" onClick={() => setClotureOuverte(!clotureOuverte)}>
                  Clore le cycle
                </button>
              </div>
            </div>

            {courrielOuvert && (
              <div className="panneau">
                <h3 style={{ marginTop: 0 }}>Suggestion de courriel aux parents</h3>
                <p className="aide">Le texte est proposé automatiquement : relisez-le et adaptez-le avant l'envoi (simulé en mode démo).</p>
                <div className="champ">
                  <label htmlFor="objet-parents">Objet</label>
                  <input id="objet-parents" type="text" value={objetParents} onChange={(e) => setObjetParents(e.target.value)} style={{ width: "100%" }} />
                </div>
                <div className="champ">
                  <label htmlFor="corps-parents">Message</label>
                  <textarea id="corps-parents" rows="8" value={corpsParents} onChange={(e) => setCorpsParents(e.target.value)} />
                </div>
                <button className="bouton" onClick={envoyerParents}>Envoyer aux parents (simulé)</button>
              </div>
            )}

            {clotureOuverte && (
              <div className="panneau">
                <h3 style={{ marginTop: 0 }}>Clore le cycle d'intervention</h3>
                <p className="aide">
                  Réservé à l'ERRÉ, à l'éducation spécialisée et à la direction. La note de clôture est obligatoire;
                  l'enseignant·e qui a fait le signalement en est avisé·e par courriel.
                </p>
                <div className="champ">
                  <label htmlFor="note-cloture">Note de clôture</label>
                  <textarea id="note-cloture" rows="2" value={noteCloture} onChange={(e) => setNoteCloture(e.target.value)}
                    placeholder="Pourquoi le cycle se termine : situation stabilisée, plan en place…" />
                </div>
                <button className="bouton danger" onClick={clore}>Confirmer la clôture</button>
              </div>
            )}
          </>
        )}
        {erreur && <div className="avertissement" role="alert">{erreur}</div>}
      </div>
    </div>
  );
}
