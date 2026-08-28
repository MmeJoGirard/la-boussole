import { X } from "lucide-react";

// En mode démo, aucun courriel réel n'est envoyé : tout arrive ici.
// En production, ces messages partiront automatiquement (Edge Function
// Supabase + service d'envoi de courriels).
export default function BoiteCourriels({ courriels, fermer }) {
  return (
    <div className="voile" role="dialog" aria-modal="true" aria-label="Courriels simulés">
      <div className="modale">
        <div className="modale-entete">
          <h2>Courriels simulés ({courriels.length})</h2>
          <button className="fermer" onClick={fermer} aria-label="Fermer"><X size={16} aria-hidden="true" /></button>
        </div>
        <p className="sous-titre">
          En mode démonstration, les courriels automatiques s'affichent ici au lieu d'être envoyés.
        </p>
        {courriels.length === 0 && <p>Aucun courriel pour l'instant. Faites un signalement pour voir les automatisations.</p>}
        {courriels.map((c, i) => (
          <div key={i} className="courriel">
            <div className="meta">{c.date} · À : {c.a.join(", ")}</div>
            <div className="objet">{c.objet}</div>
            <div className="corps">{c.corps}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
