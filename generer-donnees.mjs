// Générateur de données fictives pour la démo Boussole (nom de travail).
// Toutes les personnes sont inventées. Aucun vrai nom, aucun vrai courriel.
// Usage : node generer-donnees.mjs  →  produit donnees-fictives.json
import { writeFileSync } from "node:fs";

// Générateur pseudo-aléatoire avec graine fixe : chaque exécution
// produit exactement les mêmes données (pratique pour la démo et les tests).
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20262027);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const pickN = (arr, n) => {
  const copie = [...arr], res = [];
  while (res.length < n && copie.length) res.push(copie.splice(Math.floor(rand() * copie.length), 1)[0]);
  return res;
};

// ---------------------------------------------------------------------------
// Banques de noms : francophones et diversifiés (Canada français, Afrique de
// l'Ouest, Maghreb, Haïti, Liban, Vietnam, etc.)
// ---------------------------------------------------------------------------
const PRENOMS_F = [
  "Léa", "Amina", "Gabrielle", "Yasmine", "Fatoumata", "Chloé", "Rosalie",
  "Naomie", "Maya", "Élodie", "Aïcha", "Mariama", "Linh", "Camille", "Anaïs",
  "Juliette", "Adjoua", "Sofia", "Nadia", "Esther", "Salima", "Fanta",
  "Océane", "Delphine", "Mélissa", "Bintou", "Marguerite", "Noémie",
  "Khadija", "Émilie", "Awa", "Clara", "Micheline", "Sarah", "Josiane",
];
const PRENOMS_M = [
  "Nathan", "Koffi", "Étienne", "Mathis", "Olivier", "Ibrahim", "Tariq",
  "Émile", "Jean-Daniel", "Rachid", "Samuel", "Zachary", "Félix", "Youssef",
  "Thierno", "Karim", "Noah", "Marc-Antoine", "Didier", "Xavier", "Loïc",
  "William", "Moussa", "Hakim", "Renaud", "Mamadou", "Antoine", "Sékou",
  "Gabriel", "Wadih", "Minh", "Patrick", "Ousmane", "Charles-Éric", "Elias",
];
const NOMS = [
  "Lalonde", "Séguin", "Bélanger", "Charbonneau", "Diallo", "Traoré",
  "N'Guessan", "Ben Salem", "Haddad", "Nguyen", "Jean-Baptiste",
  "Pierre-Louis", "Boucher", "Gagnon", "Lefebvre", "Racine", "Ouellette",
  "Bergeron", "Kamara", "El Amrani", "Mbala", "Desrosiers", "Vachon",
  "Larocque", "Cissé", "Chidiac", "Tran", "Sanogo", "Villeneuve",
  "Thériault", "Bationo", "Aubin", "Kouassi", "Meilleur", "Zerhouni",
  "Sauvé", "Deschamps", "Okou", "Lacroix", "Bakayoko",
];

const slug = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "");
const courrielsPris = new Set();
function courriel(prenom, nom, domaine) {
  let base = `${slug(prenom)}.${slug(nom)}`, c = `${base}@${domaine}`, i = 2;
  while (courrielsPris.has(c)) c = `${base}${i++}@${domaine}`;
  courrielsPris.add(c);
  return c;
}
let compteur = 0;
const id = (prefixe) => `${prefixe}-${String(++compteur).padStart(3, "0")}`;

// ---------------------------------------------------------------------------
// Personnel : 20 enseignants, 2 ERRÉ, 3 éducation spécialisée, 3 direction
// ---------------------------------------------------------------------------
// 7e-8e : 5 enseignants par élève (Français, Maths, Histoire-Géographie,
// Éducation physique, Arts). 9e-12e : 4 membres du personnel par élève.
const POSTES_ENSEIGNANTS = [
  { matiere: "Français", annees: [7] }, { matiere: "Français", annees: [8] },
  { matiere: "Mathématiques", annees: [7] }, { matiere: "Mathématiques", annees: [8] },
  { matiere: "Histoire-Géographie", annees: [7] }, { matiere: "Histoire-Géographie", annees: [8] },
  { matiere: "Éducation physique", annees: [7, 8] }, { matiere: "Arts", annees: [7, 8] },
  { matiere: "Français", annees: [9] }, { matiere: "Français", annees: [10] },
  { matiere: "Français", annees: [11, 12] },
  { matiere: "Mathématiques", annees: [9] }, { matiere: "Mathématiques", annees: [10] },
  { matiere: "Mathématiques", annees: [11, 12] },
  { matiere: "Géographie", annees: [9, 12] }, { matiere: "Histoire", annees: [10, 11] },
  { matiere: "Éducation physique", annees: [9, 10] }, { matiere: "Éducation physique", annees: [11, 12] },
  { matiere: "Arts", annees: [9, 10] }, { matiere: "Arts", annees: [11, 12] },
];

const personnel = [];
function creerMembre(role, options = {}) {
  const genre = options.genre || (rand() < 0.5 ? "F" : "M");
  const prenom = pick(genre === "F" ? PRENOMS_F : PRENOMS_M);
  const nom = pick(NOMS);
  const membre = {
    id: id("pers"), prenom, nom, genre, role,
    courriel: courriel(prenom, nom, "conseil-demo.ca"),
    ...options.extra,
  };
  personnel.push(membre);
  return membre;
}
const enseignants = POSTES_ENSEIGNANTS.map((p) =>
  creerMembre("enseignant", { extra: { matiere: p.matiere, annees: p.annees } })
);
// Sa note : « profils enseignantes » pour l'équipe ERRÉ / éduc. spécialisée.
const erres = [
  creerMembre("erre", { genre: "F" }),
  creerMembre("erre", { genre: "F" }),
];
const educSpec = [
  creerMembre("educ_specialisee", { genre: "F" }),
  creerMembre("educ_specialisee", { genre: "F" }),
  creerMembre("educ_specialisee", { genre: "F" }),
];
const direction = [
  creerMembre("direction", {}),
  creerMembre("direction_adjointe", {}),
  creerMembre("direction_adjointe", {}),
];

// ---------------------------------------------------------------------------
// Élèves : 50, de la 7e à la 12e année, avec familles variées
// ---------------------------------------------------------------------------
const REPARTITION = { 7: 9, 8: 9, 9: 8, 10: 8, 11: 8, 12: 8 };
const GROUPES = { 7: ["7A", "7B"], 8: ["8A", "8B"], 9: ["9A"], 10: ["10A"], 11: ["11A"], 12: ["12A"] };

const eleves = [];
const tuteurs = [];
function creerTuteur(prenomsPool, nomFamille, lien) {
  const prenom = pick(prenomsPool);
  const t = {
    id: id("tut"), prenom, nom: nomFamille, lien,
    courriel: courriel(prenom, nomFamille, "courriel-demo.ca"),
    telephone: `613-555-0${String(Math.floor(rand() * 900) + 100)}`,
  };
  tuteurs.push(t);
  return t;
}

for (const [anneeStr, nombre] of Object.entries(REPARTITION)) {
  const annee = Number(anneeStr);
  for (let i = 0; i < nombre; i++) {
    const genre = rand() < 0.5 ? "F" : "M";
    const prenom = pick(genre === "F" ? PRENOMS_F : PRENOMS_M);
    const nom = pick(NOMS);
    const groupe = GROUPES[annee][i % GROUPES[annee].length];

    // Structures familiales : deux parents, monoparentale, recomposée.
    const tirage = rand();
    let famille;
    if (tirage < 0.55) {
      famille = {
        type: "deux_parents",
        tuteurs: [
          creerTuteur(PRENOMS_F, nom, "mère").id,
          creerTuteur(PRENOMS_M, rand() < 0.6 ? nom : pick(NOMS), "père").id,
        ],
      };
    } else if (tirage < 0.8) {
      famille = {
        type: "monoparentale",
        tuteurs: [creerTuteur(rand() < 0.7 ? PRENOMS_F : PRENOMS_M, nom, rand() < 0.7 ? "mère" : "père").id],
      };
    } else {
      famille = {
        type: "recomposee",
        tuteurs: [
          creerTuteur(PRENOMS_F, nom, "mère").id,
          creerTuteur(PRENOMS_M, pick(NOMS), "beau-père"),
        ].map((t) => (typeof t === "string" ? t : t.id)),
      };
    }

    eleves.push({
      id: id("elev"), prenom, nom, genre, annee, groupe,
      anneeScolaire: "2026-2027", semestre: 1,
      courriel: courriel(prenom, nom, "eleves-demo.ca"),
      eed: rand() < 0.18, // élève identifié EED (enfance en difficulté)
      famille,
    });
  }
}

// ---------------------------------------------------------------------------
// Cours : le lien entre chaque groupe et ses enseignants
// ---------------------------------------------------------------------------
// En 9e-12e, chaque année a une matière de sciences humaines (géo ou histoire)
// et une matière au choix (éduc phys en 9e-10e, arts en 11e-12e), pour un
// total de 4 membres du personnel par élève, comme prévu au plan.
const MATIERES_PAR_ANNEE = {
  7: ["Français", "Mathématiques", "Histoire-Géographie", "Éducation physique", "Arts"],
  8: ["Français", "Mathématiques", "Histoire-Géographie", "Éducation physique", "Arts"],
  9: ["Français", "Mathématiques", "Géographie", "Éducation physique"],
  10: ["Français", "Mathématiques", "Histoire", "Éducation physique"],
  11: ["Français", "Mathématiques", "Histoire", "Arts"],
  12: ["Français", "Mathématiques", "Géographie", "Arts"],
};
const cours = [];
for (const [anneeStr, matieres] of Object.entries(MATIERES_PAR_ANNEE)) {
  const annee = Number(anneeStr);
  for (const groupe of GROUPES[annee]) {
    for (const matiere of matieres) {
      const prof = enseignants.find((e) => e.matiere === matiere && e.annees.includes(annee));
      cours.push({ id: id("cours"), matiere, annee, groupe, enseignantId: prof.id });
    }
  }
}

// ---------------------------------------------------------------------------
// Signalements : 20 dossiers préremplis pour que la démo soit vivante
// ---------------------------------------------------------------------------
const TYPES = ["motivation", "académique", "absentéisme", "autre"];
// Échelle d'urgence officielle du projet (décision du 2026-08-27).
// Le niveau 4 existe dans l'échelle mais n'a volontairement aucun cas de démo :
// à ce niveau, le protocole d'urgence de l'école prime sur la plateforme.
const ECHELLE_URGENCE = [
  { niveau: 0, libelle: "Information", indicateurs: "Événement sans risque apparent; note à conserver.", interventionAttendue: "Documenter et fermer, ou surveiller." },
  { niveau: 1, libelle: "Faible", indicateurs: "Signal isolé, changement léger, difficulté ponctuelle.", interventionAttendue: "Vérification et suivi dans les prochains jours." },
  { niveau: 2, libelle: "Modéré", indicateurs: "Signaux répétés, absentéisme, détresse ou comportement qui s'intensifie.", interventionAttendue: "Intervention dans la journée ou le prochain jour scolaire; aviser la personne responsable." },
  { niveau: 3, libelle: "Élevé", indicateurs: "Risque sérieux pour l'élève ou autrui, menace crédible, forte détresse, perte de contrôle.", interventionAttendue: "Intervention immédiate de la direction ou de l'équipe désignée; évaluation et plan de sécurité." },
  { niveau: 4, libelle: "Critique (danger imminent)", indicateurs: "Violence en cours, arme, blessure grave, intention immédiate de se faire du mal ou de faire du mal à autrui.", interventionAttendue: "Déclencher immédiatement le protocole d'urgence; ne pas laisser l'élève seul; contacter les services d'urgence selon le protocole." },
];
const RAISONS = [
  "Baisse marquée des résultats depuis la rentrée. Devoirs incomplets ou non remis.",
  "Se met à l'écart du groupe, participe très peu, semble fatigué·e en classe.",
  "Trois absences non motivées cette semaine, arrive souvent en retard.",
  "Changement d'attitude soudain, réactions vives avec les pairs.",
  "Difficulté à se concentrer, oublie régulièrement son matériel.",
  "Résultats sous la note de passage aux deux dernières évaluations.",
  "Semble découragé·e, dit ouvertement que « ça ne sert à rien ».",
  "Isolement remarqué à la cafétéria et lors des travaux d'équipe.",
];
const OBSERVATIONS = [
  "Même constat dans mon cours : peu de participation, travaux remis en retard.",
  "De mon côté, l'élève va bien dans mon groupe, participe normalement.",
  "J'ai remarqué de la fatigue en après-midi, mais bonne attitude générale.",
  "Situation semblable chez moi. J'appuie le signalement.",
  "L'élève m'a confié avoir de la difficulté à la maison, sans détails.",
];
const NOTES_SUIVI = [
  "Rencontre faite avec l'élève. Plan de rattrapage établi, suivi dans deux semaines.",
  "Appel à la maison, message laissé. Deuxième tentative prévue jeudi.",
  "Rencontre de l'équipe de la réussite : ajustements d'échéanciers convenus.",
  "Courriel envoyé aux parents avec proposition de rencontre.",
  "L'élève accepte de passer à la récupération deux midis par semaine.",
];
const PROCHAINES_ETAPES = [
  "Rencontre avec l'élève",
  "Rencontre de l'équipe de la réussite",
  "Communication aux parents",
  "Rencontre avec les parents",
  "Référence à la direction",
];
// Dates réparties sur les premières semaines de l'année scolaire 2026-2027.
const DATES = [
  "2026-09-08", "2026-09-10", "2026-09-14", "2026-09-15", "2026-09-17",
  "2026-09-21", "2026-09-22", "2026-09-24", "2026-09-28", "2026-09-29",
  "2026-10-01", "2026-10-05", "2026-10-06", "2026-10-08", "2026-10-13",
  "2026-10-15", "2026-10-19", "2026-10-20", "2026-10-22", "2026-10-26",
];

const profsDeLEleve = (eleve) =>
  cours.filter((c) => c.annee === eleve.annee && c.groupe === eleve.groupe).map((c) => c.enseignantId);

const elevesSignales = pickN(eleves, 20);
const signalements = elevesSignales.map((eleve, i) => {
  const profs = profsDeLEleve(eleve);
  const auteurId = pick(profs);
  const niveau = i < 10 ? 1 : i < 16 ? 2 : 3; // 10 dossiers niveau 1, 6 niveau 2, 4 niveau 3
  const statut = niveau === 1 ? (i < 4 ? "nouveau" : "pris_en_charge")
    : niveau === 2 ? "pris_en_charge"
    : i < 18 ? "transfere_direction" : "clos";
  const responsable = niveau === 3 ? pick(direction) : pick([...erres, ...educSpec]);
  const caVa = statut === "clos" || (niveau === 1 && rand() < 0.4);
  // Urgence corrélée à l'avancement du dossier : 2 cas de niveau 0, 8 de
  // niveau 1, 7 de niveau 2, 3 de niveau 3, aucun de niveau 4 (voir échelle).
  const niveauUrgence = i < 2 ? 0 : i < 10 ? 1 : i < 17 ? 2 : 3;

  const observations = pickN(profs.filter((p) => p !== auteurId), Math.min(2, profs.length - 1))
    .map((profId, j) => ({
      auteurId: profId,
      date: DATES[i],
      texte: OBSERVATIONS[(i + j) % OBSERVATIONS.length],
    }));

  const interventions = [];
  for (let n = 1; n <= niveau; n++) {
    interventions.push({
      niveau: n,
      type: PROCHAINES_ETAPES[(i + n) % 4],
      date: DATES[Math.min(i + n, DATES.length - 1)],
      responsableId: responsable.id,
      note: NOTES_SUIVI[(i + n) % NOTES_SUIVI.length],
    });
  }

  return {
    id: id("sign"),
    eleveId: eleve.id,
    auteurId,
    date: DATES[i],
    // Un signalement peut cocher plusieurs types à la fois.
    types: rand() < 0.3
      ? [TYPES[i % TYPES.length], TYPES[(i + 1) % TYPES.length]]
      : [TYPES[i % TYPES.length]],
    niveauUrgence,
    urgenceLibelle: ECHELLE_URGENCE[niveauUrgence].libelle,
    caseEED: eleve.eed, // case « ES » : cochée → courriel automatique à l'éducation spécialisée
    niveauIntervention: niveau,
    statut,
    indicateurCaVa: caVa, // visible aux enseignants : ça va (true) ou non (false)
    raisons: RAISONS[i % RAISONS.length],
    dejaFait: {
      rencontreEleve: rand() < 0.7,
      communicationParents: rand() < 0.5 ? pick(["courriel", "téléphone", "en personne"]) : null,
    },
    autreInformation: "",
    responsableId: responsable.id,
    prochaineEtape: statut === "clos" ? null : PROCHAINES_ETAPES[(i + 2) % PROCHAINES_ETAPES.length],
    noteCloture: statut === "clos" ? "Situation stabilisée après rencontre avec les parents. Suivi terminé." : null,
    planSecurite: niveauUrgence >= 3
      ? "Personne-ressource identifiée (ERRÉ). L'élève sait où se présenter en cas de détresse. Vérification quotidienne discrète pendant deux semaines. Parents informés du plan."
      : "",
    adaptations: eleve.eed
      ? "Temps supplémentaire pour les évaluations. Consignes reprises individuellement. Place assise près de l'enseignant·e."
      : "",
    observations,
    interventions,
  };
});

// Un deuxième signalement pour un élève dont le premier cycle est clos :
// la démo montre ainsi le lien « voir le 1er signalement ».
const premierClos = signalements.find((x) => x.statut === "clos");
if (premierClos) {
  const eleve = eleves.find((e) => e.id === premierClos.eleveId);
  signalements.push({
    id: id("sign"),
    eleveId: eleve.id,
    auteurId: profsDeLEleve(eleve)[0],
    date: "2026-11-02",
    types: ["académique"],
    niveauUrgence: 1,
    urgenceLibelle: ECHELLE_URGENCE[1].libelle,
    caseEED: eleve.eed,
    niveauIntervention: 1,
    statut: "nouveau",
    indicateurCaVa: false,
    raisons: "Nouvelles difficultés observées depuis la fin du premier cycle. Deuxième cycle de suivi ouvert.",
    dejaFait: { rencontreEleve: false, communicationParents: null },
    autreInformation: "",
    prochaineEtapeEnseignant: "",
    responsableId: null,
    prochaineEtape: "Vérification par l'équipe de la réussite",
    noteCloture: null,
    planSecurite: "",
    adaptations: "",
    observations: [],
    interventions: [],
  });
}

// ---------------------------------------------------------------------------
// Journal d'audit : un échantillon d'entrées pour la démo
// ---------------------------------------------------------------------------
const audit = [];
for (const s of signalements) {
  const auteur = personnel.find((p) => p.id === s.auteurId);
  audit.push({ date: `${s.date}T08:${String(10 + (audit.length % 40)).padStart(2, "0")}:00`, utilisateurId: s.auteurId, action: "connexion", details: `${auteur.prenom} ${auteur.nom} s'est connecté·e.` });
  audit.push({ date: `${s.date}T08:${String(15 + (audit.length % 40)).padStart(2, "0")}:00`, utilisateurId: s.auteurId, action: "signalement_cree", details: `Signalement ${s.id} créé pour l'élève ${s.eleveId}.` });
  for (const inter of s.interventions) {
    audit.push({ date: `${inter.date}T10:30:00`, utilisateurId: inter.responsableId, action: "intervention_ajoutee", details: `Intervention de niveau ${inter.niveau} (${inter.type}) au dossier ${s.id}.` });
  }
}
audit.sort((a, b) => a.date.localeCompare(b.date));

// ---------------------------------------------------------------------------
// Écriture du fichier + vérifications
// ---------------------------------------------------------------------------
const donnees = {
  genereLe: "2026-08-27",
  avertissement: "Données entièrement fictives, générées pour la démonstration. Aucune vraie personne.",
  ecole: { nom: "École secondaire des Rivières (fictive)", conseil: "Conseil scolaire de démonstration", anneeScolaire: "2026-2027", semestre: 1 },
  echelleUrgence: ECHELLE_URGENCE,
  personnel, eleves, tuteurs, cours, signalements, audit,
};
writeFileSync(new URL("./donnees-fictives.json", import.meta.url), JSON.stringify(donnees, null, 2), "utf8");

// Vérifications : les chiffres doivent correspondre au plan.
const parAnnee = {};
for (const e of eleves) parAnnee[e.annee] = (parAnnee[e.annee] || 0) + 1;
const profsParEleve = eleves.map((e) => new Set(profsDeLEleve(e)).size);
console.log("Élèves :", eleves.length, parAnnee);
console.log("Tuteurs :", tuteurs.length);
console.log("Enseignants :", enseignants.length, "| ERRÉ :", erres.length, "| Éduc. spéc. :", educSpec.length, "| Direction :", direction.length);
console.log("Enseignants par élève 7e-8e :", [...new Set(eleves.filter((e) => e.annee <= 8).map((e, i) => profsParEleve[eleves.indexOf(e)]))]);
console.log("Personnel par élève 9e-12e :", [...new Set(eleves.filter((e) => e.annee >= 9).map((e) => new Set(profsDeLEleve(e)).size))]);
console.log("Cours :", cours.length, "| Signalements :", signalements.length, "| Entrées d'audit :", audit.length);
