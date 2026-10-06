import type { Prestation } from "@/data/prestations";
import { GrandNumero } from "@/components/revue/GrandNumero";
import { ENTREPRISE } from "@/lib/entreprise";
import { FACTEURS_PRIX, PRIX_PLAGE } from "@/lib/offre-legere";

/**
 * Les blocs d'une page de prestation (mission 16, partie 4), dessinés UNE fois et rendus par `ContenuPrestation`
 * (`/prestations/[slug]`), par `/pro` et par `/comment-ca-marche` : surfaces et atouts, déroulement numéroté, phrase du
 * tarif, questions fréquentes. `titre` : la balise du titre de chaque bloc — `h3` sous un titre de section (`h2`), `h4`
 * quand le bloc est déjà sous un `h3` (sur /pro, « en détail »). Composants serveur, textes de `data/prestations.ts`.
 *
 * Site 3.0 (lot C3) : plus de cartes blanches encadrées, qui détonnaient avec les filets du reste des pages. Chaque
 * bloc se pose sous un FILET (`.filet` : la teinte de la page, `--teinte`, sinon l'encre), les étapes portent leur
 * grand numéro (`GrandNumero`, jamais rouge) comme « Comment on travaille », les questions se replient entre des
 * filets comme celles de l'accueil (docs/DESIGN.md, « Le filet »).
 */

/** Un trait à la teinte de la page (l'encre sans teinte), pour le bas d'une liste fermée par un filet. */
const BAS_FILET = "border-b border-[color:var(--teinte,var(--color-encre))]";

type BaliseTitre = "h3" | "h4";

export function CartesSurfaces({ surfaces, titre = "h3" }: { surfaces: Prestation["surfaces"]; titre?: BaliseTitre }) {
  const Titre = titre;
  return (
    <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
      {surfaces.map((s) => (
        <article key={s.titre} className="filet pt-4">
          <Titre className="mb-2 text-[17px] font-semibold text-encre">{s.titre}</Titre>
          <p className="texte-2">{s.texte}</p>
        </article>
      ))}
    </div>
  );
}

export function CartesAtouts({ atouts, className = "" }: { atouts: Prestation["atouts"]; className?: string }) {
  return (
    <ul className={`grid grid-cols-2 gap-x-6 gap-y-5 lg:grid-cols-4${className ? ` ${className}` : ""}`}>
      {atouts.map((a) => (
        <li key={a.titre} className="filet pt-3">
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
    <ol className={`grid gap-x-6 gap-y-8 ${GRILLE_ETAPES[etapes.length === 3 ? 3 : 4]}`}>
      {etapes.map((e, i) => (
        <li key={e.titre} className="filet pt-3">
          <div className="flex items-baseline gap-3">
            <GrandNumero valeur={i + 1} />
            <Titre className="font-display text-[22px] leading-tight font-semibold text-encre">{e.titre}</Titre>
          </div>
          <p className="mt-2 text-[14.5px] leading-relaxed text-encre-2">{e.texte}</p>
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
    <div className={BAS_FILET}>
      {faq.map((f) => (
        <details key={f.q} className="group filet">
          <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 py-4 text-[17px] font-semibold text-encre [&::-webkit-details-marker]:hidden">
            {f.q}
            <span aria-hidden="true" className="font-display text-[26px] leading-none font-normal transition-transform duration-[var(--duree-courte)] group-open:rotate-45">
              +
            </span>
          </summary>
          <p className="texte-2 pb-5">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
