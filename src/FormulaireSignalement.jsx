import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { nomComplet, coursDe, TYPES_SIGNALEMENT, OPTIONS_ETAPE_ENSEIGNANT } from "./aides.js";

// Le formulaire de signalement, en quatre boîtes guidées par une ligne
// verticale : 1-2 l'élève, 3-4 le signalement, 5-7 ce qui a été fait et
// la suite, puis les informations complémentaires. Tout est préprogrammé
// par des menus déroulants pour éliminer doublons et fautes de frappe.
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
  const [raisons, setRaisons] = useState("");
  const [rencontreEleve, setRencontreEleve] = useState(false);
  const [communicationParents, setCommunicationParents] = useState("");
  const [caseEED, setCaseEED] = useState(eleveInitial ? eleveInitial.eed : false);
  const [etapePerso, setEtapePerso] = useState("");
  const [etapePersoAutre, setEtapePersoAutre] = useState("");
  const [autreInformation, setAutreInformation] = useState("");
  const [erreur, setErreur] = useState("");

  const basculerType = (t) =>
    setTypes((liste) => (liste.includes(t) ? liste.filter((x) => x !== t) : [...liste, t]));

  const choisirEleve = (id) => {
    setEleveId(id);
    const e = db.eleves.find((x) => x.id === id);
    setCaseEED(e ? e.eed : false); // précochée si l'élève est identifié ES
  };

  const soumettre = (ev) => {
    ev.preventDefault();
    if (!eleveId) return setErreur("Choisissez un élève dans la liste.");
    if (types.length === 0) return setErreur("Cochez au moins un type de signalement.");
    if (!raisons.trim()) return setErreur("Décrivez les raisons de vos inquiétudes.");
    const prochaineEtapeEnseignant = etapePerso === "Autre" ? etapePersoAutre.trim() : etapePerso;
    actions.creerSignalement({
      eleveId, types, niveauUrgence: Number(urgence), raisons: raisons.trim(),
      rencontreEleve, communicationParents, caseEED,
      prochaineEtapeEnseignant,
      autreInformation: autreInformation.trim(),
    });
    fermer();
  };

  const infoUrgence = db.echelleUrgence.find((e) => e.niveau === Number(urgence));

  return (
    <div className="voile" role="dialog" aria-modal="true" aria-label="Signaler un élève">
      <form className="modale" onSubmit={soumettre}>
        <div className="modale-entete">
          <h2 className="fiche-nom">Signaler un élève</h2>
          <button type="button" className="fermer" onClick={fermer} aria-label="Fermer"><X size={16} aria-hidden="true" /></button>
        </div>
        <p className="sous-titre">
          En remplissant ce formulaire, je signale que l'élève semble montrer des signes qui m'inquiètent.
          Signalé par <strong>{nomComplet(utilisateur)}</strong> (rempli automatiquement avec votre compte).
        </p>

        {/* Boîte 1 : l'élève concerné. */}
        <fieldset className="groupe-form">
          <div className="champ">
            <label htmlFor="cours"><span className="no-champ">1</span>Mon cours et le groupe</label>
            <select id="cours" value={coursId} onChange={(e) => { setCoursId(e.target.value); setEleveId(""); }}>
              {mesCours.map((c) => (
                <option key={c.id} value={c.id}>{c.matiere} · {c.groupe}</option>
              ))}
            </select>
          </div>
          <div className="champ">
            <label htmlFor="eleve"><span className="no-champ">2</span>L'élève</label>
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
        </fieldset>

        {/* Boîte 2 : le signalement. */}
        <fieldset className="groupe-form">
          <div className="champ">
            <span className="legende-champ"><span className="no-champ">3</span>Type de signalement (cochez tout ce qui s'applique)</span>
            {TYPES_SIGNALEMENT.map((t) => (
              <div className="case" key={t}>
                <input id={`type-${t}`} type="checkbox" checked={types.includes(t)} onChange={() => basculerType(t)} />
                <span>
                  <label htmlFor={`type-${t}`} style={{ display: "inline", color: "inherit", textTransform: "capitalize" }}>{t}</label>
                </span>
              </div>
            ))}
          </div>
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
                et ne laissez pas l'élève seul. La Boussole sert à documenter, pas à remplacer le protocole.
              </div>
            )}
          </div>
          <div className="champ">
            <label htmlFor="raisons"><span className="no-champ">4</span>Raisons de mes inquiétudes</label>
            <textarea id="raisons" rows="3" value={raisons} onChange={(e) => setRaisons(e.target.value)}
              placeholder="Ce que j'observe : comportements, résultats, changements…" />
          </div>
        </fieldset>

        {/* Boîte 3 : ce qui a été fait, et la suite. */}
        <fieldset className="groupe-form">
          <div className="case">
            <input id="rencontre" type="checkbox" checked={rencontreEleve} onChange={(e) => setRencontreEleve(e.target.checked)} />
            <span>
              <label htmlFor="rencontre" style={{ display: "inline", color: "inherit" }}>
                <span className="no-champ">5</span>J'ai rencontré l'élève pour mieux comprendre la situation
              </label>
            </span>
          </div>
          <div className="champ">
            <label htmlFor="parents"><span className="no-champ">6</span>J'ai communiqué avec les parents</label>
            <select id="parents" value={communicationParents} onChange={(e) => setCommunicationParents(e.target.value)}>
              <option value="">Non, pas encore</option>
              <option value="courriel">Oui, par courriel</option>
              <option value="téléphone">Oui, par téléphone</option>
              <option value="en personne">Oui, en personne</option>
            </select>
          </div>
          <div className="champ">
            <label htmlFor="etape-perso"><span className="no-champ">7</span>Prochaines étapes (facultatif)</label>
            <select id="etape-perso" value={etapePerso} onChange={(e) => setEtapePerso(e.target.value)}>
              <option value="">Aucune pour l'instant</option>
              {OPTIONS_ETAPE_ENSEIGNANT.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            {etapePerso === "Autre" && (
              <textarea rows="2" value={etapePersoAutre} onChange={(e) => setEtapePersoAutre(e.target.value)}
                placeholder="Décrivez votre prochaine étape…" style={{ marginTop: 8 }}
                aria-label="Préciser la prochaine étape" />
            )}
            <p className="aide">Cette étape s'ajoutera à votre liste « À faire », pour ne rien échapper.</p>
          </div>
        </fieldset>

        {/* Boîte 4 : informations complémentaires. */}
        <fieldset className="groupe-form">
          <div className="champ" style={{ marginBottom: 0 }}>
            <label htmlFor="autre">Autres informations (facultatif)</label>
            <textarea id="autre" rows="2" value={autreInformation} onChange={(e) => setAutreInformation(e.target.value)} />
          </div>
        </fieldset>

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
