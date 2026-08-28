import { useMemo, useState } from "react";
import { nomComplet, coursDe, TYPES_SIGNALEMENT } from "./aides.js";

// Le formulaire de signalement : tout est préprogrammé par des menus
// déroulants (cours, groupe, élève) pour éliminer les doublons et les
// fautes de frappe. Le nom de l'enseignant vient de son compte.
export default function FormulaireSignalement({ db, utilisateur, actions, eleveInitial, fermer }) {
  const mesCours = coursDe(db, utilisateur);
  const [coursId, setCoursId] = useState(() => {
    if (eleveInitial) {
      const c = mesCours.find((x) => x.annee === eleveInitial.annee && x.groupe === eleveInitial.groupe);
      if (c) return c.id;
    }
    return mesCours[0]?.id || "";
  });
  const coursChoisi = mesCours.find((c) => c.id === coursId);
  const elevesDuGroupe = useMemo(
    () => db.eleves.filter((e) => coursChoisi && e.annee === coursChoisi.annee && e.groupe === coursChoisi.groupe),
    [db, coursChoisi]
  );
  const [eleveId, setEleveId] = useState(eleveInitial ? eleveInitial.id : "");
  const eleve = db.eleves.find((e) => e.id === eleveId);

  const [types, setTypes] = useState(["motivation"]);
  const [urgence, setUrgence] = useState(1);

  const basculerType = (t) =>
    setTypes((liste) => (liste.includes(t) ? liste.filter((x) => x !== t) : [...liste, t]));
  const [raisons, setRaisons] = useState("");
  const [rencontreEleve, setRencontreEleve] = useState(false);
  const [communicationParents, setCommunicationParents] = useState("");
  const [caseEED, setCaseEED] = useState(eleveInitial ? eleveInitial.eed : false);
  const [autreInformation, setAutreInformation] = useState("");
  const [erreur, setErreur] = useState("");

  const choisirEleve = (id) => {
    setEleveId(id);
    const e = db.eleves.find((x) => x.id === id);
    setCaseEED(e ? e.eed : false); // précochée si l'élève est identifié EED
  };

  const soumettre = (ev) => {
    ev.preventDefault();
    if (!eleveId) return setErreur("Choisissez un élève dans la liste.");
    if (types.length === 0) return setErreur("Cochez au moins un type de signalement.");
    if (!raisons.trim()) return setErreur("Décrivez les raisons de vos inquiétudes.");
    actions.creerSignalement({
      eleveId, types, niveauUrgence: Number(urgence), raisons: raisons.trim(),
      rencontreEleve, communicationParents, caseEED, autreInformation: autreInformation.trim(),
    });
    fermer();
  };

  const infoUrgence = db.echelleUrgence.find((e) => e.niveau === Number(urgence));

  return (
    <div className="voile" role="dialog" aria-modal="true" aria-label="Signaler un élève">
      <form className="modale" onSubmit={soumettre}>
        <div className="modale-entete">
          <h2>Signaler un élève</h2>
          <button type="button" className="fermer" onClick={fermer} aria-label="Fermer">✕</button>
        </div>
        <p className="sous-titre">
          En remplissant ce formulaire, je signale que l'élève semble montrer des signes qui m'inquiètent.
          Signalé par <strong>{nomComplet(utilisateur)}</strong> (rempli automatiquement avec votre compte).
        </p>

        <div className="champ">
          <label htmlFor="cours">Mon cours et le groupe</label>
          <select id="cours" value={coursId} onChange={(e) => { setCoursId(e.target.value); setEleveId(""); }}>
            {mesCours.map((c) => (
              <option key={c.id} value={c.id}>{c.matiere} · {c.groupe}</option>
            ))}
          </select>
        </div>

        <div className="champ">
          <label htmlFor="eleve">L'élève</label>
          <select id="eleve" value={eleveId} onChange={(e) => choisirEleve(e.target.value)}>
            <option value="">Choisir…</option>
            {elevesDuGroupe.map((e) => (
              <option key={e.id} value={e.id}>{nomComplet(e)}{e.eed ? " (ES)" : ""}</option>
            ))}
          </select>
        </div>

        <div className="case">
          <input id="es" type="checkbox" checked={caseEED} onChange={(e) => setCaseEED(e.target.checked)} />
          <span>
            <label htmlFor="es" style={{ display: "inline", color: "inherit" }}>
              <strong>Élève identifié ES</strong> (éducation spécialisée)
            </label>
            <span className="aide">Si cochée, un courriel est envoyé automatiquement à l'équipe d'éducation spécialisée. {eleve?.eed ? "Précochée : cet élève est identifié ES au dossier." : ""}</span>
          </span>
        </div>

        <fieldset style={{ border: "none", padding: 0, margin: "0 0 14px" }}>
          <legend className="legende-champ">Type de signalement (cochez tout ce qui s'applique)</legend>
          {TYPES_SIGNALEMENT.map((t) => (
            <div className="case" key={t}>
              <input id={`type-${t}`} type="checkbox" checked={types.includes(t)} onChange={() => basculerType(t)} />
              <span>
                <label htmlFor={`type-${t}`} style={{ display: "inline", color: "inherit", textTransform: "capitalize" }}>{t}</label>
              </span>
            </div>
          ))}
        </fieldset>

        <div className="champ">
          <label htmlFor="urgence">Niveau d'urgence</label>
          <select id="urgence" value={urgence} onChange={(e) => setUrgence(e.target.value)}>
            {db.echelleUrgence.map((n) => (
              <option key={n.niveau} value={n.niveau}>{n.niveau} · {n.libelle}</option>
            ))}
          </select>
          {infoUrgence && <p className="aide">{infoUrgence.indicateurs} Attendu : {infoUrgence.interventionAttendue}</p>}
          {Number(urgence) === 4 && (
            <div className="avertissement">
              <strong>Danger imminent :</strong> déclenchez immédiatement le protocole d'urgence de l'école
              et ne laissez pas l'élève seul. Boussole sert à documenter, pas à remplacer le protocole.
            </div>
          )}
        </div>

        <div className="champ">
          <label htmlFor="raisons">Raisons de mes inquiétudes</label>
          <textarea id="raisons" rows="3" value={raisons} onChange={(e) => setRaisons(e.target.value)}
            placeholder="Ce que j'observe : comportements, résultats, changements…" />
        </div>

        <fieldset style={{ border: "none", padding: 0, margin: "0 0 14px" }}>
          <legend className="legende-champ">Ce qui a été fait</legend>
          <div className="case">
            <input id="rencontre" type="checkbox" checked={rencontreEleve} onChange={(e) => setRencontreEleve(e.target.checked)} />
            <span><label htmlFor="rencontre" style={{ display: "inline", color: "inherit" }}>J'ai rencontré l'élève pour mieux comprendre la situation</label></span>
          </div>
          <div className="champ">
            <label htmlFor="parents">J'ai communiqué avec les parents</label>
            <select id="parents" value={communicationParents} onChange={(e) => setCommunicationParents(e.target.value)}>
              <option value="">Non, pas encore</option>
              <option value="courriel">Oui, par courriel</option>
              <option value="téléphone">Oui, par téléphone</option>
              <option value="en personne">Oui, en personne</option>
            </select>
          </div>
        </fieldset>

        <div className="champ">
          <label htmlFor="autre">Autre information (facultatif)</label>
          <textarea id="autre" rows="2" value={autreInformation} onChange={(e) => setAutreInformation(e.target.value)} />
        </div>

        {erreur && <div className="avertissement" role="alert">{erreur}</div>}
        <div className="info">
          À l'envoi : courriel automatique aux ERRÉ, à la direction et aux enseignants de l'élève
          {caseEED ? ", ainsi qu'à l'équipe d'éducation spécialisée (case ES cochée)" : ""}. Tout est consigné dans l'audit.
        </div>
        <div className="rangee-boutons">
          <button type="submit" className="bouton">Envoyer le signalement</button>
          <button type="button" className="bouton secondaire" onClick={fermer}>Annuler</button>
        </div>
      </form>
    </div>
  );
}
