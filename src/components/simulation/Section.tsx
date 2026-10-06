import { useId, type ReactNode } from "react";

/**
 * Une section du site (mission 16) : une seule idée, de l'air. Largeur de
 * lecture (`max-w-3xl`) ou large (`max-w-6xl`), gouttière 16 px (24 px à
 * partir de 768), espace vertical `--espace-5` (64 px, 96 px à partir de
 * 768), un ton (plus bas). Le titre est un h2 `titre-2`, l'intro un
 * `texte-2` de trois lignes au plus. Composant serveur.
 *
 * Mission 16 (partie 6) : `differee` pose `sous-la-ligne` (`content-visibility: auto`) — pour une section sous la
 * ligne de flottaison, sans élément fixe ni collant (les feuilles et le plein écran passent par un portail).
 *
 * Site 3.0, lot B3 : trois tons (`ton`), les blocs qui alternent papier clair et encre (docs/DESIGN.md) :
 *  - `papier` (par défaut) : le papier de la page, avec son grain — la section est transparente et laisse voir le
 *    corps de page (`body`, ou l'enveloppe `.papier` du gabarit) : le grain court sans raccord d'une section à
 *    l'autre. Ne se pose donc que sur la page, jamais dans un bloc d'une autre couleur ;
 *  - `papier-2` : le papier foncé (`bg-fond-2`), SANS grain (le gris chaud y tient 4,78:1, le grain le ferait
 *    tomber sous 4,5) ;
 *  - `encre` : `ton-encre bg-encre text-fond`, sans grain ; le titre au papier, le surtitre et l'intro en
 *    `sur-encre-2` (6,69:1, jamais le gris chaud : 2,92), les liens de texte au papier, le focus au papier
 *    (globals.css, `.ton-encre`). Ses boutons prennent la variante `sur-encre`.
 * `fond` (« fond » / « fond-2 ») est l'ancien nom de `papier` / `papier-2`, gardé pour les pages pas encore refaites.
 */
export type TonSection = "papier" | "papier-2" | "encre";

/** Le fond de chaque ton, et la couleur de son titre. Jamais `.papier` avec un autre fond (theme.test.ts). */
export const TONS_SECTION: Record<TonSection, { fond: string; titre: string }> = {
  papier: { fond: "", titre: "text-encre" },
  "papier-2": { fond: "bg-fond-2", titre: "text-encre" },
  encre: { fond: "ton-encre bg-encre text-fond", titre: "text-fond" },
};

export type ProprietesSection = {
  id?: string;
  surtitre?: ReactNode;
  titre?: ReactNode;
  intro?: ReactNode;
  large?: boolean;
  ton?: TonSection;
  /** L'ancien nom du ton (« fond » = papier, « fond-2 » = papier-2) ; `ton` passe devant. */
  fond?: "fond" | "fond-2";
  /** Sous la ligne de flottaison : rendue à l'approche (`content-visibility: auto`). */
  differee?: boolean;
  className?: string;
  children?: ReactNode;
};

export function Section({ id, surtitre, titre, intro, large = false, ton, fond = "fond", differee = false, className, children }: ProprietesSection) {
  const idTitre = useId();
  const aUnEnTete = !!(surtitre || titre || intro);
  const t = TONS_SECTION[ton ?? (fond === "fond-2" ? "papier-2" : "papier")];
  return (
    <section id={id} aria-labelledby={titre ? idTitre : undefined} className={`${t.fond ? `${t.fond} ` : ""}px-4 py-[var(--espace-5)] md:px-6${differee ? " sous-la-ligne" : ""}${className ? ` ${className}` : ""}`}>
      <div className={`mx-auto w-full ${large ? "max-w-6xl" : "max-w-3xl"}`}>
        {aUnEnTete ? (
          <div className={`max-w-3xl${children ? " mb-8 md:mb-10" : ""}`}>
            {surtitre ? <p className="surtitre">{surtitre}</p> : null}
            {titre ? (
              <h2 id={idTitre} className={`titre-2 ${t.titre}${surtitre ? " mt-2" : ""}`}>
                {titre}
              </h2>
            ) : null}
            {intro ? <p className="texte-2 mt-3 max-w-2xl">{intro}</p> : null}
          </div>
        ) : null}
        {children}
      </div>
    </section>
  );
}
