import { urlVignette } from "@/lib/simulateur/adresses-crm";

/** Une matière d'une pastille : sa référence, son nom, la surface qui la porte. */
export type MatierePastille = { ref: string; nom: string; surface: string };

/**
 * Les pastilles des matières d'une petite carte (le rendu de `PastillesMatieres`), les matières déjà connues — site
 * 3.0, lot F7 : un composant envoyé au navigateur (les cartes de pièces du simulateur) les reçoit de la page serveur,
 * sans emporter les données des ambiances dans son JavaScript. Même rendu. Sans état.
 */
export function Pastilles({ matieres, className }: { matieres: readonly MatierePastille[]; className?: string }) {
  if (matieres.length === 0) return null;
  return (
    <span aria-hidden className={`pointer-events-none absolute top-2 right-2 flex flex-col-reverse items-end${className ? ` ${className}` : ""}`}>
      <span className="mt-1.5 hidden max-w-[180px] rounded-[4px] bg-white/90 px-2 py-1 text-right text-[11.5px] leading-snug text-encre shadow-[0_1px_4px_rgba(0,0,0,0.18)] group-hover:block group-focus-visible:block group-active:block">
        {matieres.map((m) => (
          <span key={m.ref + m.surface} className="block whitespace-nowrap">
            {`${m.nom} · ${m.ref}`}
          </span>
        ))}
      </span>
      <span className="flex">
        {matieres.map((m, i) => (
          // eslint-disable-next-line @next/next/no-img-element -- vignette de 320 px servie par le CRM
          <img
            key={m.ref + m.surface}
            src={urlVignette(m.ref)}
            alt=""
            width={22}
            height={22}
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            className={`h-[22px] w-[22px] rounded-full object-cover ring-2 ring-white shadow-[0_1px_3px_rgba(0,0,0,0.3)]${i > 0 ? " -ml-1.5" : ""}`}
          />
        ))}
      </span>
    </span>
  );
}
