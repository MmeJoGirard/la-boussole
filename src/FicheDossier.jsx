import { useState } from "react";
import { nomComplet, trouverEleve, trouverMembre, trouverTuteur, PROCHAINES_ETAPES, ETAPES, typesDe } from "./aides.js";
import { EtiquetteUrgence, EtiquetteStatut, Indicateur, EtiquetteES } from "./Etiquettes.jsx";
import { X, Shield, Edit3, Mail, Phone } from "lucide-react";

const MOIS_COURTS = ["JAN", "FÉV", "MAR", "AVR", "MAI", "JUIN", "JUIL", "AOÛT", "SEP", "OCT", "NOV", "DÉC"];
const dateEditoriale = (date, avecAnnee = true) => {
  const [a, m, j] = date.slice(0, 10).split("-").map(Number);
  return `${String(j).padStart(2, "0")} ${MOIS_COURTS[m - 1]}${avecAnnee ? ` ${a}` : ""}`;
};

// Le marqueur de section éditorial : le même que sur l'écran d'accueil.
// Le premier (sansFilet) évite un double trait sous le bloc d'identité.
function MarqueurSection({ no, titre, compte, sansFilet }) {
  return (
    <div className={`section-divider${sansFilet ? " no-line" : ""}`}>
      <hr className="section-line" />
      <h3 className="section-header">
        <span className="section-number">{no}</span>
        <span className="section-dash">—</span>
        <span className="section-title">{titre}</span>
        <span className="section-leader" aria-hidden="true"></span>
        {compte && <span className="section-count">{compte}</span>}
      </h3>
    </div>
  );
}

// La fiche complète d'un dossier : réservée à l'ERRÉ, à l'éducation
// spécialisée et à la direction. Structure : identité, badges d'état,
// sections ancrées par icônes, chronologies, puis la zone d'action.
export default function FicheDossier({ db, signId, utilisateur, actions, direction, fermer, changerDossier }) {
  const s = db.signalements.find((x) => x.id === signId);
  const eleve = trouverEleve(db, s.eleveId);
  const auteur = trouverMembre(db, s.auteurId);

  // Les autres signalements du même élève : on affiche le rang du dossier
  // courant (« 2e signalement ») et des liens vers les précédents.
  const tousLesSignalements = db.signalements
    .filter((x) => x.eleveId === s.eleveId)
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  const rang = tousLesSignalements.findIndex((x) => x.id === s.id) + 1;
  const autresSignalements = tousLesSignalements.filter((x) => x.id !== s.id);
  const ordinal = (n) => (n === 1 ? "1er" : `${n}e`);

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
        {/* 2. Le bloc d'identité de l'élève. */}
        <div className="modale-entete">
          <div>
            <h2 className="fiche-nom">{nomComplet(eleve)} {eleve.eed && <EtiquetteES />}</h2>
            <p className="fiche-meta">
              {eleve.annee}e année · groupe {eleve.groupe} · signalé le {s.date} par {nomComplet(auteur)}
            </p>
          </div>
          <button className="fermer" onClick={fermer} aria-label="Fermer">
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {/* 3. Les badges d'état. */}
        <div className="fiche-badges">
          <EtiquetteStatut statut={s.statut} />
          <EtiquetteUrgence niveau={s.niveauUrgence} echelle={db.echelleUrgence} />
          <span className="etiquette neutre" title={ETAPES.find((e) => e.n === s.niveauIntervention)?.description}>
            Étape {s.niveauIntervention}
          </span>
          <Indicateur caVa={s.indicateurCaVa} equipe />
          {s.caseEED && <span className="etiquette eed" title="Le service à l'intention des élèves en difficulté a été avisé par courriel">ES avisé</span>}
          {tousLesSignalements.length > 1 && (
            <span className="etiquette moyen">{ordinal(rang)} signalement pour cet élève</span>
          )}
        </div>

        {autresSignalements.length > 0 && changerDossier && (
          <div className="fiche-anterieurs">
            {autresSignalements.map((a) => (
              <button key={a.id} className="bouton discret" onClick={() => changerDossier(a.id)}>
                Voir le {ordinal(tousLesSignalements.findIndex((x) => x.id === a.id) + 1)} signalement · {dateEditoriale(a.date)}{a.statut === "clos" ? " (clos)" : ""}
              </button>
            ))}
          </div>
        )}

        <MarqueurSection
          no="01"
          titre="Signalement"
          sansFilet
          compte={<><span className="fort">{nomComplet(auteur)}</span> · {dateEditoriale(s.date)}</>}
        />
        <div className="bloc-contenu">
          <p><strong>Type(s) :</strong> {typesDe(s).join(", ")}</p>
          <p><strong>Raisons :</strong> {s.raisons}</p>
          <p>
            <strong>Déjà fait par l'enseignant·e :</strong>{" "}
            {s.dejaFait.rencontreEleve ? "rencontre avec l'élève" : "pas encore de rencontre"} ·{" "}
            {s.dejaFait.communicationParents ? `parents contactés (${s.dejaFait.communicationParents})` : "parents pas encore contactés"}
            {s.autreInformation ? ` · ${s.autreInformation}` : ""}
          </p>
        </div>

        <MarqueurSection
          no="02"
          titre="Famille"
          compte={<><span className="fort">{eleve.famille.tuteurs.length}</span> contact{eleve.famille.tuteurs.length > 1 ? "s" : ""}</>}
        />
        <div className="grille-tuteurs">
          {eleve.famille.tuteurs.map((tid) => {
            const t = trouverTuteur(db, tid);
            return (
              <div key={tid} className="carte-tuteur">
                <span className="tuteur-nom">{nomComplet(t)} <span className="tuteur-lien">({t.lien})</span></span>
                <span className="tuteur-coordonnees">
                  <Mail size={13} strokeWidth={1.5} aria-hidden="true" /> {t.courriel}
                  <Phone size={13} strokeWidth={1.5} aria-hidden="true" /> {t.telephone}
                </span>
              </div>
            );
          })}
        </div>

        <MarqueurSection
          no="03"
          titre="Plan de sécurité et adaptations"
          compte={(s.planSecurite || s.adaptations)
            ? <span className="actif">Actif</span>
            : <em>Aucun pour l'instant</em>}
        />
        {planOuvert ? (
          <div className="zone-action" style={{ marginTop: 0 }}>
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
            <div className="bloc-contenu">
              <p><strong>Plan de sécurité :</strong> {s.planSecurite || "Aucun pour l'instant."}</p>
              <p><strong>Adaptations :</strong> {s.adaptations || "Aucune pour l'instant."}</p>
            </div>
            {!clos && (
              <div className="rangee-boutons" style={{ marginTop: 12 }}>
                <button className="bouton fantome" onClick={() => { setPlanSecurite(s.planSecurite || ""); setAdaptations(s.adaptations || ""); setPlanOuvert(true); }}>
                  <Edit3 size={14} strokeWidth={1.5} aria-hidden="true" /> Modifier le plan et les adaptations
                </button>
              </div>
            )}
          </>
        )}

        <MarqueurSection
          no="04"
          titre="Observations des enseignants"
          compte={s.observations.length > 0
            ? <><span className="fort">{s.observations.length}</span> observation{s.observations.length > 1 ? "s" : ""} · {dateEditoriale(s.observations[s.observations.length - 1].date, false)}</>
            : <em>Aucune pour l'instant</em>}
        />
        {s.observations.length === 0 ? null : (
          <ol className="ligne-temps">
            {s.observations.map((o, i) => (
              <li key={i} className="lt-item">
                <span className="lt-point" aria-hidden="true" />
                <span className="lt-entete">
                  <span className="lt-auteur">{nomComplet(trouverMembre(db, o.auteurId))}</span>
                  <span className="lt-date">{o.date}</span>
                </span>
                <p className="lt-texte">{o.texte}</p>
              </li>
            ))}
          </ol>
        )}

        <MarqueurSection
          no="05"
          titre="Interventions"
          compte={s.interventions.length > 0
            ? <><span className="fort">{s.interventions.length}</span> intervention{s.interventions.length > 1 ? "s" : ""} · <span className="fort">Étape {s.niveauIntervention}</span></>
            : <em>Aucune pour l'instant</em>}
        />
        {s.interventions.length === 0 ? null : (
          <ol className="ligne-temps">
            {s.interventions.map((inter, i) => (
              <li key={i} className="lt-item">
                <span className="lt-point" aria-hidden="true" />
                <span className="lt-entete">
                  <span className="pill-etape">Étape {inter.niveau} · {inter.type}</span>
                  <span className="lt-date">{inter.date} · {nomComplet(trouverMembre(db, inter.responsableId))}</span>
                </span>
                <p className="lt-texte">{inter.note}</p>
              </li>
            ))}
          </ol>
        )}

        {clos ? (
          <div className="info" style={{ marginTop: 24 }}>
            <strong>Cycle clos.</strong> Note de clôture : {s.noteCloture}
          </div>
        ) : (
          <>
            {/* 7. La zone d'action : ajouter une intervention. */}
            <MarqueurSection
              no="06"
              titre="Ajouter une intervention"
              compte={<em className="actif">Nouveau</em>}
            />
            <div className="zone-action" style={{ marginTop: 0 }}>
              <div className="filtres">
                <div>
                  <label htmlFor="type-inter">Type</label>
                  <select id="type-inter" value={typeIntervention} onChange={(e) => setTypeIntervention(e.target.value)}>
                    {[...PROCHAINES_ETAPES.filter((p) => p !== "Référence à la direction"), "Autre"].map((p) => <option key={p}>{p}</option>)}
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
                <textarea id="note-inter" rows="3" value={noteIntervention} onChange={(e) => setNoteIntervention(e.target.value)}
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
              {/* 8. Trois intentions, trois styles de bouton. */}
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
              <div className="zone-action">
                <h3 className="zone-action-titre"><Mail size={16} aria-hidden="true" /> Suggestion de courriel aux parents</h3>
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
              <div className="zone-action">
                <h3 className="zone-action-titre"><Shield size={16} aria-hidden="true" /> Clore le cycle d'intervention</h3>
                <p className="aide">
                  Réservé à l'ERRÉ, au service à l'intention des élèves en difficulté et à la direction. La note de clôture est obligatoire;
                  l'enseignant·e qui a fait le signalement en est avisé·e par courriel.
                </p>
                <div className="champ">
                  <label htmlFor="note-cloture">Note de clôture</label>
                  <textarea id="note-cloture" rows="3" value={noteCloture} onChange={(e) => setNoteCloture(e.target.value)}
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
