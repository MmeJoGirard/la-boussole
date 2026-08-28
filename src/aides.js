// Petites fonctions et constantes partagées par toute l'application.

export const maintenant = () => {
  const d = new Date();
  return d.toISOString().slice(0, 10) + " " + d.toTimeString().slice(0, 5);
};

export const nomComplet = (p) => `${p.prenom} ${p.nom}`;

export const ROLES = {
  enseignant: "Enseignant·e",
  erre: "ERRÉ",
  educ_specialisee: "Éducation spécialisée",
  direction: "Direction",
  direction_adjointe: "Direction adjointe",
};

export const STATUTS = {
  nouveau: "Nouveau",
  pris_en_charge: "Pris en charge",
  transfere_direction: "Transféré à la direction",
  clos: "Clos",
};

export const TYPES_SIGNALEMENT = ["motivation", "académique", "absentéisme", "autre"];

// Prochaines étapes que l'enseignant·e peut se planifier au moment du
// signalement : elles apparaissent dans sa liste « À faire ».
export const OPTIONS_ETAPE_ENSEIGNANT = [
  "Rencontrer l'élève",
  "Communiquer avec les parents",
  "Rencontrer les parents",
  "En discuter avec l'équipe de la réussite",
  "Autre",
];

export const PROCHAINES_ETAPES = [
  "Rencontre avec l'élève",
  "Rencontre de l'équipe de la réussite",
  "Communication aux parents",
  "Rencontre avec les parents",
  "Référence à la direction",
];

// Les étapes du suivi : la légende est affichée dans les tableaux de bord.
export const ETAPES = [
  { n: 1, nom: "Étape 1", description: "Premières interventions : vérification par l'équipe, rencontre avec l'élève, observations des enseignants." },
  { n: 2, nom: "Étape 2", description: "Interventions élargies : rencontre de l'équipe de la réussite, communication ou rencontre avec les parents, mise à jour du signalement." },
  { n: 3, nom: "Étape 3", description: "Interventions intensives : référence à la direction, plan de sécurité, adaptations." },
];

// Un signalement peut avoir plusieurs types cochés.
export const typesDe = (s) => s.types || (s.type ? [s.type] : []);

// L'équipe qui traite les dossiers : ERRÉ + éducation spécialisée.
export const estEquipe = (membre) => membre.role === "erre" || membre.role === "educ_specialisee";
export const estDirection = (membre) => membre.role === "direction" || membre.role === "direction_adjointe";

// Code couleur des rôles : bleu pâle enseignants, bleu moyen ERRÉ/ES, bleu foncé direction.
export const roleClasse = (membre) =>
  membre.role === "enseignant" ? "role-enseignant" : estEquipe(membre) ? "role-equipe" : "role-direction";

// Les cours donnés par un membre du personnel.
export const coursDe = (db, membre) => db.cours.filter((c) => c.enseignantId === membre.id);

// Les élèves d'un enseignant, sans doublons, via ses cours.
export function elevesDe(db, membre) {
  const paires = new Set(coursDe(db, membre).map((c) => `${c.annee}-${c.groupe}`));
  return db.eleves.filter((e) => paires.has(`${e.annee}-${e.groupe}`));
}

// Les enseignants d'un élève (ids), via les cours de son groupe.
export function profsDe(db, eleve) {
  return [
    ...new Set(
      db.cours
        .filter((c) => c.annee === eleve.annee && c.groupe === eleve.groupe)
        .map((c) => c.enseignantId)
    ),
  ];
}

export const signalementsDe = (db, eleveId) => db.signalements.filter((s) => s.eleveId === eleveId);

export const trouverEleve = (db, id) => db.eleves.find((e) => e.id === id);
export const trouverMembre = (db, id) => db.personnel.find((p) => p.id === id);
export const trouverTuteur = (db, id) => db.tuteurs.find((t) => t.id === id);
