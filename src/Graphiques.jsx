// Graphiques du tableau de bord : dessinés en SVG, sans librairie externe.
// Palette validée pour l'accessibilité (daltonisme) avec le vérificateur
// du guide de visualisation : ordre fixe bleu profond, terracotta,
// sarcelle sauge, or sable.
import { trouverEleve, STATUTS, TYPES_SIGNALEMENT, typesDe } from "./aides.js";

// Chaque thème a sa propre palette, validée sur sa propre surface.
const CATEGORIEL_CLAIR = ["#3568A8", "#C2621F", "#0D9488", "#BE8322"];
const CATEGORIEL_SOMBRE = ["#5588DB", "#D0764A", "#1D9D8F", "#B8892F"];
// Rampe ordinale monochrome (urgence 0 à 4) : le niveau 4 est toujours
// le plus visible (le plus foncé en clair, le plus clair en sombre).
// Rampe sépia : les bruns d'encre ancienne, du pâle au profond.
const ORDINAL_CLAIR = ["#BCA684", "#9C8560", "#7B6442", "#584427", "#362810"];
const ORDINAL_SOMBRE = ["#6B5637", "#8A7150", "#A98D6B", "#C7AC8A", "#E3D3B5"];

// Un segment d'anneau (donut) entre deux angles, en coordonnées SVG.
function arc(cx, cy, r1, r2, a0, a1) {
  const p = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const [x0, y0] = p(r2, a0), [x1, y1] = p(r2, a1);
  const [x2, y2] = p(r1, a1), [x3, y3] = p(r1, a0);
  const grand = a1 - a0 > Math.PI ? 1 : 0;
  return `M ${x0} ${y0} A ${r2} ${r2} 0 ${grand} 1 ${x1} ${y1} L ${x2} ${y2} A ${r1} ${r1} 0 ${grand} 0 ${x3} ${y3} Z`;
}

export function Donut({ titre, note, donnees }) {
  const total = donnees.reduce((somme, d) => somme + d.valeur, 0);
  let angle = -Math.PI / 2;
  const segments = donnees
    .filter((d) => d.valeur > 0)
    .map((d) => {
      const balayage = total ? (d.valeur / total) * Math.PI * 2 : 0;
      const seg = { ...d, a0: angle, a1: angle + balayage };
      angle += balayage;
      return seg;
    });
  return (
    <figure className="graphique" role="img" aria-label={`${titre} : ${donnees.map((d) => `${d.nom} ${d.valeur}`).join(", ")}`}>
      <figcaption>
        <strong>{titre}</strong>
        {note && <span className="aide">{note}</span>}
      </figcaption>
      <div className="donut-ligne">
        <svg viewBox="0 0 160 160" width="150" height="150" aria-hidden="true">
          {segments.length === 1 ? (
            <circle cx="80" cy="80" r="59" fill="none" stroke={segments[0].couleur} strokeWidth="18" />
          ) : (
            segments.map((s) => (
              <path key={s.nom} className="seg" d={arc(80, 80, 50, 68, s.a0, s.a1)} fill={s.couleur}>
                <title>{`${s.nom} : ${s.valeur} (${Math.round((s.valeur / total) * 100)} %)`}</title>
              </path>
            ))
          )}
          <text x="80" y="76" textAnchor="middle" className="donut-total">{total}</text>
          <text x="80" y="94" textAnchor="middle" className="donut-libelle">au total</text>
        </svg>
        <ul className="legende">
          {donnees.map((d) => (
            <li key={d.nom}>
              <span className="pastille-couleur" style={{ background: d.couleur }} aria-hidden="true" />
              <span className="legende-nom">{d.nom}</span>
              <span className="legende-valeur num">
                {d.valeur}{total > 0 && d.valeur > 0 ? ` · ${Math.round((d.valeur / total) * 100)} %` : ""}
              </span>
            </li>
          ))}
        </ul>
      </div>
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
  const CATEGORIEL = sombre ? CATEGORIEL_SOMBRE : CATEGORIEL_CLAIR;
  const ORDINAL = sombre ? ORDINAL_SOMBRE : ORDINAL_CLAIR;

  const parType = TYPES_SIGNALEMENT.map((t, i) => ({
    nom: t.charAt(0).toUpperCase() + t.slice(1),
    valeur: signalements.filter((s) => typesDe(s).includes(t)).length,
    couleur: CATEGORIEL[i],
  }));

  const parStatut = Object.entries(STATUTS).map(([cle, nom], i) => ({
    nom,
    valeur: signalements.filter((s) => s.statut === cle).length,
    couleur: CATEGORIEL[i],
  }));

  const parAnnee = [7, 8, 9, 10, 11, 12].map((a) => ({
    nom: `${a}e`,
    valeur: signalements.filter((s) => trouverEleve(db, s.eleveId).annee === a).length,
    couleur: sombre ? "#C7AC8A" : "#584427",
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
          <Donut titre="Par type de signalement" note="Un signalement à types multiples compte dans chaque type coché" donnees={parType} />
        </div>
        <div className="panneau">
          <Donut titre="Par statut du dossier" donnees={parStatut} />
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
