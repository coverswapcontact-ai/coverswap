import type { Prestation } from "@/data/prestations";
import { ENTREPRISE } from "@/lib/entreprise";
import { FACTEURS_PRIX, PRIX_PLAGE } from "@/lib/offre-legere";

/**
 * Les blocs d'une page de prestation (mission 16, partie 4), dessinés UNE fois et rendus par `ContenuPrestation`
 * (`/prestations/[slug]`) comme par `/pro` : cartes des surfaces et des atouts, déroulement numéroté, phrase du tarif,
 * questions fréquentes. `titre` : la balise du titre de chaque carte — `h3` sous un titre de section (`h2`), `h4`
 * quand la carte est déjà sous un `h3` (sur /pro, « en détail »). Composants serveur, textes de `data/prestations.ts`.
 */

export const CARTE_PRESTATION = "rounded-[var(--rayon-md)] border border-trait bg-white";

type BaliseTitre = "h3" | "h4";

export function CartesSurfaces({ surfaces, titre = "h3" }: { surfaces: Prestation["surfaces"]; titre?: BaliseTitre }) {
  const Titre = titre;
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {surfaces.map((s) => (
        <article key={s.titre} className={`${CARTE_PRESTATION} h-full p-6`}>
          <Titre className="mb-2 text-[17px] font-semibold text-encre">{s.titre}</Titre>
          <p className="texte-2">{s.texte}</p>
        </article>
      ))}
    </div>
  );
}

export function CartesAtouts({ atouts, className = "" }: { atouts: Prestation["atouts"]; className?: string }) {
  return (
    <ul className={`grid grid-cols-2 gap-4 lg:grid-cols-4${className ? ` ${className}` : ""}`}>
      {atouts.map((a) => (
        <li key={a.titre} className={`${CARTE_PRESTATION} p-5`}>
          <p className="mb-1 text-[16px] font-semibold text-encre">{a.titre}</p>
          <p className="text-[14px] leading-relaxed text-encre-2">{a.texte}</p>
        </li>
      ))}
    </ul>
  );
}

/** Colonnes de la grille des étapes : trois étapes sur une rangée, quatre sur deux puis une. */
const GRILLE_ETAPES = { 3: "md:grid-cols-3", 4: "md:grid-cols-2 lg:grid-cols-4" } as const;

export function EtapesPrestation({ etapes, titre = "h3" }: { etapes: Prestation["deroulement"]; titre?: BaliseTitre }) {
  const Titre = titre;
  return (
    <ol className={`grid gap-5 ${GRILLE_ETAPES[etapes.length === 3 ? 3 : 4]}`}>
      {etapes.map((e, i) => (
        <li key={e.titre} className={`${CARTE_PRESTATION} p-6`}>
          <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-full border border-encre font-display text-[14px] font-semibold text-encre">
            {i + 1}
          </span>
          <Titre className="mt-3 mb-2 text-[17px] font-semibold text-encre">{e.titre}</Titre>
          <p className="text-[14.5px] leading-relaxed text-encre-2">{e.texte}</p>
        </li>
      ))}
    </ol>
  );
}

/** La phrase du tarif au mètre linéaire, telle que toutes les pages de prestation la disent (`offre`). */
export function PhraseTarif({ className = "" }: { className?: string }) {
  return (
    <p className={`text-[14px] text-encre-2${className ? ` ${className}` : ""}`}>
      Tarif au mètre linéaire de film posé, fourni et posé : {PRIX_PLAGE}, déterminé au devis selon {FACTEURS_PRIX}. {ENTREPRISE.tvaMention}.
    </p>
  );
}

export function QuestionsPrestation({ faq }: { faq: Prestation["faq"] }) {
  return (
    <div className="space-y-2.5">
      {faq.map((f) => (
        <details key={f.q} className={`group ${CARTE_PRESTATION} p-4`}>
          <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-4 text-[16px] font-semibold text-encre">
            {f.q}
            <span aria-hidden className="text-2xl leading-none text-encre-2 transition-transform duration-[var(--duree-courte)] group-open:rotate-45">
              +
            </span>
          </summary>
          <p className="texte-2 mt-3">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
