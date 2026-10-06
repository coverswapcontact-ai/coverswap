import Link from "@/components/LienSite";
import { NB_REFERENCES } from "@/lib/offre";

/** Une chaîne entière (un nom de classe collé à `${…}` échapperait à Tailwind, qui ne le générerait pas). */
const CLASSES_PASTILLE = "inline-flex h-28 w-28 shrink-0 -rotate-6 flex-col items-center justify-center rounded-full bg-accent text-center text-blanc shadow-[0_6px_16px_rgba(27,22,19,0.18)] transition-colors duration-[var(--duree-courte)] hover:bg-accent-survol active:bg-accent-survol md:h-36 md:w-36";

/**
 * La pastille « 497 matières » (site 3.0, lot B3) : un des trois endroits où le rouge est permis (énoncé, phase B),
 * parce que c'est une action — elle mène au présentoir `/matieres`. Un disque rouge un peu penché, le nombre en
 * Playfair 900 et « matières » en petites capitales, blanc sur rouge (6,54:1), rouge plus sombre au survol et à
 * l'appui. Le nombre est celui du catalogue (`NB_REFERENCES`, compté dans `revetements.json`), jamais écrit en dur.
 * 112 px sur téléphone, 144 px à partir de 768 px (cible tactile ≥ 44 px). Composant serveur.
 */
export function Pastille497({ className }: { className?: string }) {
  return (
    <Link
      href="/matieres"
      aria-label={`Voir les ${NB_REFERENCES} matières`}
      className={`${CLASSES_PASTILLE}${className ? ` ${className}` : ""}`}
    >
      <span className="font-display text-[40px] leading-[0.9] font-black md:text-[52px]">{NB_REFERENCES}</span>
      <span className="cartel mt-1">matières</span>
    </Link>
  );
}
