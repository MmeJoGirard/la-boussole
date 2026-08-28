// Graphiques du tableau de bord : dessinés en SVG et en HTML, sans
// librairie externe. Palette stricte de bleus : une répartition se lit
// par la longueur des barres et ses étiquettes, jamais par la teinte —
// c'est à la fois plus sobre et parfaitement lisible pour tout le monde.
import { trouverEleve, STATUTS, TYPES_SIGNALEMENT, typesDe } from "./aides.js";

const ACCENT = { clair: "#20599A", sombre: "#6FA3D8" };
// Rampe ordinale de bleus (urgence 0 à 4), validée pour le daltonisme :
// le niveau 4 est toujours le plus visible.
const ORDINAL_CLAIR = ["#8FB7D6", "#5F94C2", "#3B76AC", "#20599A", "#153459"];
const ORDINAL_SOMBRE = ["#3D5A78", "#4F7196", "#6389B4", "#84A9CE", "#A2C4DB"];

// Répartition en barres horizontales : une seule teinte, l'étiquette à
// gauche, la valeur et le pourcentage à droite.
export function BarresH({ titre, note, donnees, couleur }) {
  const total = donnees.reduce((somme, d) => somme + d.valeur, 0);
  const max = Math.max(1, ...donnees.map((d) => d.valeur));
  return (
    <figure className="graphique" role="img" aria-label={`${titre} : ${donnees.map((d) => `${d.nom} ${d.valeur}`).join(", ")}`}>
      <figcaption>
        <strong>{titre}</strong>
        {note && <span className="aide">{note}</span>}
      </figcaption>
      <p className="repartition-total"><span className="num">{total}</span> au total</p>
      <ul className="repartition">
        {donnees.map((d) => (
          <li key={d.nom} className="repartition-ligne">
            <span className="repartition-nom">{d.nom}</span>
            <span className="repartition-piste" aria-hidden="true">
              <span className="repartition-barre" style={{ width: `${(d.valeur / max) * 100}%`, background: couleur }} />
            </span>
            <span className="repartition-valeur num">
              {d.valeur}{total > 0 ? ` · ${Math.round((d.valeur / total) * 100)} %` : ""}
            </span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

export function Barres({ titre, note, donnees }) {
  const max = Math.max(1, ...donnees.map((d) => d.valeur));
  const largeur = 320, hauteur = 170, basY = 140, hautY = 26;
  const pas = largeur / donnees.length;
  const largeurBarre = Math.min(32, pas * 0.45);
  const barre = (x, y, l, h, r) =>
    h <= r
      ? `M ${x} ${basY} L ${x} ${y} L ${x + l} ${y} L ${x + l} ${basY} Z`
      : `M ${x} ${basY} L ${x} ${y + r} Q ${x} ${y} ${x + r} ${y} L ${x + l - r} ${y} Q ${x + l} ${y} ${x + l} ${y + r} L ${x + l} ${basY} Z`;
  return (
    <figure className="graphique" role="img" aria-label={`${titre} : ${donnees.map((d) => `${d.nom} ${d.valeur}`).join(", ")}`}>
      <figcaption>
        <strong>{titre}</strong>
        {note && <span className="aide">{note}</span>}
      </figcaption>
      <svg viewBox={`0 0 ${largeur} ${hauteur}`} style={{ width: "100%", height: "auto" }} aria-hidden="true">
        {[0.5, 1].map((f) => (
          <line key={f} x1="0" x2={largeur} y1={basY - (basY - hautY) * f} y2={basY - (basY - hautY) * f} className="grille" strokeWidth="1" />
        ))}
        <line x1="0" x2={largeur} y1={basY} y2={basY} className="base" strokeWidth="1" />
        {donnees.map((d, i) => {
          const h = (d.valeur / max) * (basY - hautY);
          const x = i * pas + (pas - largeurBarre) / 2;
          const y = basY - h;
          return (
            <g key={d.nom}>
              {d.valeur > 0 && <path d={barre(x, y, largeurBarre, h, 4)} fill={d.couleur}><title>{`${d.nom} : ${d.valeur}`}</title></path>}
              <text x={x + largeurBarre / 2} y={y - 6} textAnchor="middle" className="barre-valeur">{d.valeur}</text>
              <text x={x + largeurBarre / 2} y={basY + 16} textAnchor="middle" className="barre-nom">{d.nom}</text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}

// Le tableau de bord visuel : totaux et répartitions de tous les
// signalements de l'année scolaire (cycles actifs et clos).
export default function TableauDeBord({ db, sombre }) {
  const signalements = db.signalements;
  const accent = ACCENT[sombre ? "sombre" : "clair"];
  const ORDINAL = sombre ? ORDINAL_SOMBRE : ORDINAL_CLAIR;

  const parType = TYPES_SIGNALEMENT.map((t) => ({
    nom: t.charAt(0).toUpperCase() + t.slice(1),
    valeur: signalements.filter((s) => typesDe(s).includes(t)).length,
  }));

  const parStatut = Object.entries(STATUTS).map(([cle, nom]) => ({
    nom,
    valeur: signalements.filter((s) => s.statut === cle).length,
  }));

  const parAnnee = [7, 8, 9, 10, 11, 12].map((a) => ({
    nom: `${a}e`,
    valeur: signalements.filter((s) => trouverEleve(db, s.eleveId).annee === a).length,
    couleur: accent,
  }));

  const parUrgence = db.echelleUrgence.map((n) => ({
    nom: `${n.niveau}`,
    valeur: signalements.filter((s) => s.niveauUrgence === n.niveau).length,
    couleur: ORDINAL[n.niveau],
  }));

  const eed = signalements.filter((s) => s.caseEED).length;

  return (
    <>
      <p className="callout-note">
        Tous les signalements de l'année scolaire ({signalements.length}), cycles actifs et clos,
        dont {eed} avec la case ES cochée.
      </p>
      <div className="grille-graphiques">
        <div className="panneau">
          <BarresH titre="Par type de signalement" note="Un signalement à types multiples compte dans chaque type coché" donnees={parType} couleur={accent} />
        </div>
        <div className="panneau">
          <BarresH titre="Par statut du dossier" donnees={parStatut} couleur={accent} />
        </div>
        <div className="panneau">
          <Barres titre="Par année scolaire" note="Nombre de signalements par niveau" donnees={parAnnee} />
        </div>
        <div className="panneau">
          <Barres titre="Par niveau d'urgence" note="0 Information · 1 Faible · 2 Modéré · 3 Élevé · 4 Critique" donnees={parUrgence} />
        </div>
      </div>
    </>
  );
}
