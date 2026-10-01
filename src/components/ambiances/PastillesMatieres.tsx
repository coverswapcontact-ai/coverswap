import { AMBIANCES } from "@/data/ambiances";
import { urlVignette } from "@/lib/simulateur/generation-client";

/**
 * Les matières d'une petite carte (mission 19, cartes de pièces) : pas de trait, une rangée de pastilles rondes de la
 * vraie matière qui se chevauchent dans le coin haut droit de la photo (l'étiquette « Ambiance » est en bas) ; les noms apparaissent au survol, au focus, ou tant que
 * le doigt appuie sur la carte (`group-active`). La carte est déjà un bouton ou un lien : les pastilles ne sont pas
 * interactives elles-mêmes, et restent muettes pour les lecteurs d'écran (la photo de la carte est décorative).
 * Lit `data/ambiances` seulement (pas le catalogue) : sans poids pour le simulateur. Sans état.
 */
export function matieresDeLImage(nom: string) {
  return AMBIANCES.find((a) => a.image === nom)?.surfaces ?? [];
}

export function PastillesMatieres({ image, className }: { image: string; className?: string }) {
  const matieres = matieresDeLImage(image);
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
            className={`h-[22px] w-[22px] rounded-full object-cover ring-2 ring-white shadow-[0_1px_3px_rgba(0,0,0,0.3)]${i > 0 ? " -ml-1.5" : ""}`}
          />
        ))}
      </span>
    </span>
  );
}
