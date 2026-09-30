import { useId, type ReactNode } from "react";

/**
 * Une section du site (mission 16) : une seule idée, de l'air. Largeur de
 * lecture (`max-w-3xl`) ou large (`max-w-6xl`), gouttière 16 px (24 px à
 * partir de 768), espace vertical `--espace-5` (64 px, 96 px à partir de
 * 768), fond `fond` ou `fond-2`. Le titre est un h2 `titre-2`, l'intro un
 * `texte-2` de trois lignes au plus. Composant serveur.
 */
export type ProprietesSection = {
  id?: string;
  surtitre?: ReactNode;
  titre?: ReactNode;
  intro?: ReactNode;
  large?: boolean;
  fond?: "fond" | "fond-2";
  className?: string;
  children?: ReactNode;
};

export function Section({ id, surtitre, titre, intro, large = false, fond = "fond", className, children }: ProprietesSection) {
  const idTitre = useId();
  const aUnEnTete = !!(surtitre || titre || intro);
  return (
    <section id={id} aria-labelledby={titre ? idTitre : undefined} className={`${fond === "fond-2" ? "bg-fond-2" : "bg-fond"} px-4 py-[var(--espace-5)] md:px-6${className ? ` ${className}` : ""}`}>
      <div className={`mx-auto w-full ${large ? "max-w-6xl" : "max-w-3xl"}`}>
        {aUnEnTete ? (
          <div className={`max-w-3xl${children ? " mb-8 md:mb-10" : ""}`}>
            {surtitre ? <p className="surtitre">{surtitre}</p> : null}
            {titre ? (
              <h2 id={idTitre} className={`titre-2 text-encre${surtitre ? " mt-2" : ""}`}>
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
