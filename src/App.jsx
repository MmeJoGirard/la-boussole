import { useEffect, useState } from "react";
import donneesInitiales from "../donnees-fictives.json";
import {
  maintenant, nomComplet, ROLES, estEquipe, estDirection, roleClasse,
  profsDe, trouverEleve, trouverMembre, trouverTuteur,
} from "./aides.js";
import VueEnseignant from "./VueEnseignant.jsx";
import VueEquipe from "./VueEquipe.jsx";
import BoiteCourriels from "./BoiteCourriels.jsx";
import { Mail, RotateCcw, LogOut, Moon, Sun } from "lucide-react";

let compteurDemo = 0;

// L'aiguille de la boussole : elle tourne un tour complet en 40 secondes,
// presque imperceptiblement (et reste immobile si la personne préfère
// réduire les animations).
function Aiguille({ taille = 20 }) {
  return (
    <svg className="aiguille" width={taille} height={taille} viewBox="0 0 24 24" aria-hidden="true">
      <polygon points="12,1.5 15,12 12,10.2 9,12" fill="var(--accent)" />
      <polygon points="12,22.5 9,12 12,13.8 15,12" fill="var(--sourdine)" />
      <circle cx="12" cy="12" r="1.6" fill="var(--encre-fort)" />
    </svg>
  );
}

export default function App() {
  const [db, setDb] = useState(() => structuredClone(donneesInitiales));
  const [utilisateur, setUtilisateur] = useState(null);
  const [courriels, setCourriels] = useState([]);
  const [boiteOuverte, setBoiteOuverte] = useState(false);

  // Thème clair ou sombre : le choix est mémorisé dans le navigateur.
  const [sombre, setSombre] = useState(() => {
    try { return localStorage.getItem("boussole-theme") === "sombre"; } catch { return false; }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = sombre ? "sombre" : "";
    try { localStorage.setItem("boussole-theme", sombre ? "sombre" : "clair"); } catch { /* stockage indisponible : tant pis */ }
  }, [sombre]);
  const boutonTheme = (
    <button className="bouton-entete" onClick={() => setSombre(!sombre)} aria-pressed={sombre}>
      {sombre ? <Sun size={15} strokeWidth={1.5} aria-hidden="true" /> : <Moon size={15} strokeWidth={1.5} aria-hidden="true" />}
      {sombre ? "Mode clair" : "Mode sombre"}
    </button>
  );

  // ------------------------------------------------------------------
  // Actions : chaque action modifie les données ET laisse une trace
  // dans le journal d'audit. En mode démo, les courriels sont simulés :
  // ils s'accumulent dans la boîte « Courriels simulés » de l'entête.
  // ------------------------------------------------------------------
  const ajouterAudit = (bd, action, details, utilisateurId) => ({
    ...bd,
    audit: [...bd.audit, { date: maintenant(), utilisateurId, action, details }],
  });

  const envoyer = (liste) => {
    if (liste.length) setCourriels((c) => [...liste.map((m) => ({ ...m, date: maintenant() })), ...c]);
  };

  const connexion = (membre) => {
    setUtilisateur(membre);
    setDb((bd) => ajouterAudit(bd, "connexion", `${nomComplet(membre)} s'est connecté·e.`, membre.id));
  };

  const deconnexion = () => {
    setDb((bd) => ajouterAudit(bd, "deconnexion", `${nomComplet(utilisateur)} s'est déconnecté·e.`, utilisateur.id));
    setUtilisateur(null);
  };

  const reinitialiser = () => {
    setDb(structuredClone(donneesInitiales));
    setCourriels([]);
    setUtilisateur(null);
  };

  const creerSignalement = (formulaire) => {
    const eleve = trouverEleve(db, formulaire.eleveId);
    const equipeERRE = db.personnel.filter((p) => p.role === "erre");
    const educSpec = db.personnel.filter((p) => p.role === "educ_specialisee");
    const directionListe = db.personnel.filter((p) => estDirection(p));
    const collegues = profsDe(db, eleve).filter((id) => id !== utilisateur.id);

    const nouveau = {
      id: `sign-demo-${++compteurDemo}`,
      eleveId: eleve.id,
      auteurId: utilisateur.id,
      date: maintenant().slice(0, 10),
      types: formulaire.types,
      niveauUrgence: formulaire.niveauUrgence,
      urgenceLibelle: db.echelleUrgence.find((e) => e.niveau === formulaire.niveauUrgence).libelle,
      caseEED: formulaire.caseEED,
      niveauIntervention: 1,
      statut: "nouveau",
      indicateurCaVa: false,
      raisons: formulaire.raisons,
      dejaFait: {
        rencontreEleve: formulaire.rencontreEleve,
        communicationParents: formulaire.communicationParents || null,
      },
      autreInformation: formulaire.autreInformation,
      responsableId: null,
      prochaineEtape: "Vérification par l'équipe de la réussite",
      noteCloture: null,
      planSecurite: "",
      adaptations: "",
      observations: [],
      interventions: [],
    };

    const objet = `La Boussole : nouveau signalement pour ${nomComplet(eleve)} (${eleve.groupe})`;
    const corps = `${nomComplet(utilisateur)} a signalé ${nomComplet(eleve)}.\nType(s) : ${nouveau.types.join(", ")} · Urgence : ${nouveau.niveauUrgence} (${nouveau.urgenceLibelle})\n\nRaisons : ${nouveau.raisons}`;
    const messages = [
      { a: equipeERRE.map((p) => p.courriel), objet, corps: corps + "\n\nMerci d'en prendre connaissance et d'assurer le suivi." },
      { a: directionListe.map((p) => p.courriel), objet, corps },
      {
        a: collegues.map((id) => trouverMembre(db, id).courriel),
        objet: `La Boussole : un de vos élèves a été signalé (${nomComplet(eleve)})`,
        corps: `${nomComplet(eleve)} (${eleve.groupe}) a fait l'objet d'un signalement.\nVous pouvez ajouter vos observations dans La Boussole.`,
      },
    ];
    if (formulaire.caseEED) {
      messages.push({
        a: educSpec.map((p) => p.courriel),
        objet: `La Boussole : signalement d'un élève ES (${nomComplet(eleve)})`,
        corps: `La case ES (éducation spécialisée) a été cochée pour ce signalement.\n${corps}`,
      });
    }
    envoyer(messages);

    setDb((bd) =>
      ajouterAudit(
        { ...bd, signalements: [...bd.signalements, nouveau] },
        "signalement_cree",
        `Signalement ${nouveau.id} créé pour ${nomComplet(eleve)}${formulaire.caseEED ? " (case ES cochée, éducation spécialisée avisée)" : ""}.`,
        utilisateur.id
      )
    );
    return nouveau.id;
  };

  const modifierSignalement = (signId, transformation, actionAudit, detailsAudit) => {
    setDb((bd) => {
      const suivant = {
        ...bd,
        signalements: bd.signalements.map((s) => (s.id === signId ? transformation(s) : s)),
      };
      return ajouterAudit(suivant, actionAudit, detailsAudit, utilisateur.id);
    });
  };

  const ajouterObservation = (signId, texte) => {
    modifierSignalement(
      signId,
      (s) => ({ ...s, observations: [...s.observations, { auteurId: utilisateur.id, date: maintenant().slice(0, 10), texte }] }),
      "observation_ajoutee",
      `Observation ajoutée au dossier ${signId} par ${nomComplet(utilisateur)}.`
    );
  };

  // L'enseignant·e qui a signalé peut mettre à jour son signalement
  // (étape 2) : ce qui a été fait depuis, et une note de suivi.
  const majSignalementAuteur = (signId, { rencontreEleve, communicationParents, note }) => {
    modifierSignalement(
      signId,
      (s) => ({
        ...s,
        dejaFait: {
          rencontreEleve: rencontreEleve || s.dejaFait.rencontreEleve,
          communicationParents: communicationParents || s.dejaFait.communicationParents,
        },
        observations: note
          ? [...s.observations, { auteurId: utilisateur.id, date: maintenant().slice(0, 10), texte: `Mise à jour du signalement : ${note}` }]
          : s.observations,
      }),
      "signalement_mis_a_jour",
      `Signalement ${signId} mis à jour par ${nomComplet(utilisateur)}.`
    );
  };

  // Plan de sécurité et adaptations : réservés à l'équipe et à la direction.
  const sauvegarderPlans = (signId, { planSecurite, adaptations }) => {
    modifierSignalement(
      signId,
      (s) => ({ ...s, planSecurite, adaptations }),
      "plan_modifie",
      `Plan de sécurité et adaptations mis à jour au dossier ${signId} par ${nomComplet(utilisateur)}.`
    );
  };

  const ajouterIntervention = (signId, { type, note, niveau }) => {
    modifierSignalement(
      signId,
      (s) => ({
        ...s,
        statut: s.statut === "nouveau" ? "pris_en_charge" : s.statut,
        responsableId: s.responsableId || utilisateur.id,
        niveauIntervention: Math.max(s.niveauIntervention, niveau),
        interventions: [
          ...s.interventions,
          { niveau, type, date: maintenant().slice(0, 10), responsableId: utilisateur.id, note },
        ],
      }),
      "intervention_ajoutee",
      `Intervention de niveau ${niveau} (${type}) au dossier ${signId}.`
    );
  };

  const changerIndicateur = (signId, caVa) => {
    modifierSignalement(
      signId,
      (s) => ({ ...s, indicateurCaVa: caVa }),
      "indicateur_modifie",
      `Indicateur du dossier ${signId} : ${caVa ? "ça va" : "à risque"}.`
    );
  };

  const changerProchaineEtape = (signId, etape) => {
    modifierSignalement(
      signId,
      (s) => ({ ...s, prochaineEtape: etape }),
      "etape_modifiee",
      `Prochaine étape du dossier ${signId} : ${etape}.`
    );
  };

  const transfererDirection = (signId) => {
    const directionListe = db.personnel.filter((p) => estDirection(p));
    const s = db.signalements.find((x) => x.id === signId);
    const eleve = trouverEleve(db, s.eleveId);
    envoyer([
      {
        a: directionListe.map((p) => p.courriel),
        objet: `La Boussole : dossier transféré à la direction (${nomComplet(eleve)})`,
        corps: `${nomComplet(utilisateur)} vous transfère le dossier de ${nomComplet(eleve)} (${eleve.groupe}).\nUrgence : ${s.niveauUrgence} (${s.urgenceLibelle}) · Étape ${s.niveauIntervention}.`,
      },
    ]);
    modifierSignalement(
      signId,
      (x) => ({ ...x, statut: "transfere_direction", prochaineEtape: "Prise en charge par la direction" }),
      "transfert_direction",
      `Dossier ${signId} transféré à la direction par ${nomComplet(utilisateur)}.`
    );
  };

  // « Fermer un cycle » : seuls l'ERRÉ, l'éducation spécialisée et la
  // direction peuvent clore, avec une note de clôture obligatoire.
  const cloreCycle = (signId, note) => {
    const s = db.signalements.find((x) => x.id === signId);
    const eleve = trouverEleve(db, s.eleveId);
    const auteur = trouverMembre(db, s.auteurId);
    envoyer([
      {
        a: [auteur.courriel],
        objet: `La Boussole : cycle d'intervention clos pour ${nomComplet(eleve)}`,
        corps: `Le cycle d'intervention que vous aviez ouvert pour ${nomComplet(eleve)} est maintenant clos.\nNote de clôture : ${note}`,
      },
    ]);
    modifierSignalement(
      signId,
      (x) => ({ ...x, statut: "clos", indicateurCaVa: true, noteCloture: note, prochaineEtape: null }),
      "cycle_clos",
      `Cycle ${signId} clos par ${nomComplet(utilisateur)}. Note : ${note}`
    );
  };

  const courrielParents = (signId, objet, corps) => {
    const s = db.signalements.find((x) => x.id === signId);
    const eleve = trouverEleve(db, s.eleveId);
    const destinataires = eleve.famille.tuteurs.map((tid) => trouverTuteur(db, tid).courriel);
    envoyer([{ a: destinataires, objet, corps }]);
    modifierSignalement(
      signId,
      (x) => x,
      "courriel_parents",
      `Courriel envoyé aux parents de ${nomComplet(eleve)} (dossier ${signId}).`
    );
  };

  const actions = {
    creerSignalement, ajouterObservation, ajouterIntervention, changerIndicateur,
    changerProchaineEtape, transfererDirection, cloreCycle, courrielParents,
    majSignalementAuteur, sauvegarderPlans,
  };

  // ------------------------------------------------------------------
  // Écran de connexion : en mode démo, on choisit un profil.
  // En production, ce sera la connexion unique Google Workspace.
  // ------------------------------------------------------------------
  if (!utilisateur) {
    const groupes = [
      { titre: "Enseignant·e·s", membres: db.personnel.filter((p) => p.role === "enseignant") },
      { titre: "ERRÉ et éducation spécialisée", membres: db.personnel.filter((p) => estEquipe(p)) },
      { titre: "Direction", membres: db.personnel.filter((p) => estDirection(p)) },
    ];
    return (
      <main className="connexion">
        <div style={{ display: "flex", justifyContent: "flex-end" }}>{boutonTheme}</div>
        <div className="logo"><Aiguille taille={44} /></div>
        <h1>La <em>Boussole</em></h1>
        <p className="sous-titre">
          Suivi des interventions · {db.ecole.nom} · {db.ecole.anneeScolaire}, semestre {db.ecole.semestre}
        </p>
        <div className="info">
          <strong>Mode démonstration.</strong> Choisissez un profil pour explorer la plateforme.
          En production, la connexion se fera avec le compte Google Workspace du conseil (connexion unique).
          Toutes les personnes sont fictives. Code couleur : cuivre pour les enseignant·e·s,
          vert forêt pour l'ERRÉ et l'éducation spécialisée, bleu ardoise pour la direction.
        </div>
        {groupes.map((g, i) => (
          <section key={g.titre} className={`groupe-profils ${roleClasse(g.membres[0])}`}>
            <h3 className="chapitre">
              <span className="chapitre-no">{String(i + 1).padStart(2, "0")} —</span>
              <span className="chapitre-titre">{g.titre}</span>
              <span className="points-suite" aria-hidden="true"></span>
              <span className="chapitre-compte">{g.membres.length} personnes</span>
            </h3>
            <div className="boutons-profils">
              {g.membres.map((m) => (
                <button key={m.id} className="bouton-profil" onClick={() => connexion(m)}>
                  {nomComplet(m)}
                  <span className="detail">
                    {ROLES[m.role]}
                    {m.matiere ? ` · ${m.matiere} (${m.annees.map((a) => a + "e").join(", ")})` : ""}
                  </span>
                </button>
              ))}
            </div>
          </section>
        ))}
        <footer className="devise">Faite pour orienter, non pour classer.</footer>
      </main>
    );
  }

  return (
    <>
      <header className="entete">
        <span className="marque"><Aiguille taille={18} /> La <em>Boussole</em></span>
        <span className="role">
          <span className={`point-role ${roleClasse(utilisateur)}`} aria-hidden="true" />
          {nomComplet(utilisateur)} · {ROLES[utilisateur.role]}
        </span>
        <span className="pousse">
          {boutonTheme}
          <button className="bouton-entete" onClick={() => setBoiteOuverte(true)}>
            <Mail size={15} strokeWidth={1.5} aria-hidden="true" /> Courriels simulés ({courriels.length})
          </button>
          <button className="bouton-entete" onClick={reinitialiser}>
            <RotateCcw size={15} strokeWidth={1.5} aria-hidden="true" /> Réinitialiser la démo
          </button>
          <button className="bouton-entete" onClick={deconnexion}>
            <LogOut size={15} strokeWidth={1.5} aria-hidden="true" /> Se déconnecter
          </button>
        </span>
      </header>
      <div className="page">
        {utilisateur.role === "enseignant" ? (
          <VueEnseignant db={db} utilisateur={utilisateur} actions={actions} sombre={sombre} />
        ) : (
          <VueEquipe db={db} utilisateur={utilisateur} actions={actions} direction={estDirection(utilisateur)} sombre={sombre} />
        )}
      </div>
      <footer className="devise">Faite pour orienter, non pour classer.</footer>
      {boiteOuverte && <BoiteCourriels courriels={courriels} fermer={() => setBoiteOuverte(false)} />}
    </>
  );
}
