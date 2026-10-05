import type { CSSProperties } from "react";
import { ligneCartel, type MatiereCartel } from "@/lib/cartel";

/**
 * Le cartel d'une matière (site 3.0, lot B3) : le nom en Playfair italique, puis « RÉF · famille · finition » en
 * petites capitales (`.cartel`), à côté d'un filet vertical à la TEINTE (celle de la prestation passée en `teinte`,
 * sinon la couleur de la matière elle-même). Le texte ne prend jamais la teinte : elle n'est que le filet.
 *
 * Trois variantes :
 *  - `clair` (par défaut) : sur le papier ou fond-2, nom à l'encre, ligne au gris chaud (5,28 / 4,78:1) ;
 *  - `encre` : sur un bloc encre, nom au papier, ligne en `sur-encre-2` (6,69:1) ;
 *  - `sur-photo` : posé sur une image (bande de matière, ambiance), sur un voile d'encre à 80 %, tout en blanc.
 *
 * Composant serveur. Un fin liseré à l'encre borde le filet : une matière blanche reste visible sur le papier.
 */
export type VarianteCartel = "clair" | "encre" | "sur-photo";

const VARIANTES: Record<VarianteCartel, { boite: string; nom: string; ligne: string }> = {
  clair: { boite: "pl-[15px]", nom: "text-encre", ligne: "text-encre-2" },
  encre: { boite: "pl-[15px]", nom: "text-fond", ligne: "text-sur-encre-2" },
  "sur-photo": { boite: "w-fit max-w-full rounded-[4px] bg-encre/80 py-2 pr-3 pl-[23px]", nom: "text-blanc", ligne: "text-blanc" },
};

export function Cartel({ matiere, teinte, variante = "clair", className }: { matiere: MatiereCartel; /** La teinte du filet (hexadécimal du catalogue) ; par défaut, celle de la matière. */ teinte?: string; variante?: VarianteCartel; className?: string }) {
  const v = VARIANTES[variante];
  const couleur = teinte ?? matiere.hex;
  const style = couleur ? ({ "--teinte": couleur } as CSSProperties) : undefined;
  return (
    <p className={`relative ${v.boite}${className ? ` ${className}` : ""}`} style={style}>
      <span aria-hidden="true" className={`absolute w-[3px] bg-[color:var(--teinte,var(--color-encre))] ring-1 ring-encre/15 ring-inset ${variante === "sur-photo" ? "inset-y-2 left-2" : "inset-y-0 left-0"}`} />
      <span className={`block font-display text-[19px] leading-tight italic ${v.nom}`}>{matiere.nom}</span>
      <span className={`cartel mt-1 block ${v.ligne}`}>
        <span className="sr-only"> · </span>
        {ligneCartel(matiere)}
      </span>
    </p>
  );
}
