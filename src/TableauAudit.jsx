import { useState } from "react";
import { nomComplet, trouverMembre } from "./aides.js";

const NOMS_ACTIONS = {
  connexion: "Connexion",
  deconnexion: "Déconnexion",
  signalement_cree: "Signalement créé",
  signalement_mis_a_jour: "Signalement mis à jour",
  plan_modifie: "Plan de sécurité / adaptations",
  observation_ajoutee: "Observation ajoutée",
  intervention_ajoutee: "Intervention ajoutée",
  indicateur_modifie: "Indicateur modifié",
  etape_modifiee: "Étape modifiée",
  transfert_direction: "Transfert à la direction",
  cycle_clos: "Cycle clos",
  courriel_parents: "Courriel aux parents",
  courriel_envoye: "Courriel envoyé",
};

// Le journal d'audit : chaque connexion et chaque action, horodatées.
// Consultable par la direction seulement.
export default function TableauAudit({ db }) {
  const [filtre, setFiltre] = useState("toutes");
  const entrees = [...db.audit]
    .filter((a) => filtre === "toutes" || a.action === filtre)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <div className="filtres">
        <div>
          <label htmlFor="f-action">Type d'action</label>
          <select id="f-action" value={filtre} onChange={(e) => setFiltre(e.target.value)}>
            <option value="toutes">Toutes ({db.audit.length})</option>
            {Object.entries(NOMS_ACTIONS).map(([cle, nom]) => <option key={cle} value={cle}>{nom}</option>)}
          </select>
        </div>
      </div>
      <div className="defile">
        <table>
          <thead>
            <tr><th>Date et heure</th><th>Personne</th><th>Action</th><th>Détails</th></tr>
          </thead>
          <tbody>
            {entrees.map((a, i) => {
              const membre = trouverMembre(db, a.utilisateurId);
              return (
                <tr key={i}>
                  <td className="num">{a.date.replace("T", " ").slice(0, 16)}</td>
                  <td>{membre ? nomComplet(membre) : a.utilisateurId}</td>
                  <td>{NOMS_ACTIONS[a.action] || a.action}</td>
                  <td>{a.details}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
