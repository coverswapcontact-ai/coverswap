import Link from "@/components/LienSite";
import type { MatiereCartel } from "@/lib/cartel";
import { urlVignette } from "@/lib/simulateur/adresses-crm";
import { Cartel } from "./Cartel";

/**
 * Un échantillon physique (site 3.0, lot B3 ; énoncé, phase D) : la VRAIE vignette du catalogue (320 px, servie par
 * le CRM, `/api/site/echantillons/<REF>?l=320`), carrée, coin arrondi, ombre portée légère, posée sur la couleur de
 * la matière tant qu'elle charge ; dessous, son cartel. Place réservée (carré), chargement différé sauf `priorite`.
 *
 * `href` : tout l'échantillon devient un lien (la fiche, `/matieres/<famille>/<REF>`…), nommé par son cartel. La vignette est
 * décorative (`alt=""`) : le cartel dit tout. Lot F6 : le nom du lien vient du texte du cartel lui-même (« Sage Green ·
 * RM20 · Couleur · Standard », le « · » caché aux yeux compris), plus d'`aria-label` qui le doublait sans reprendre
 * le texte visible mot pour mot (WCAG 2.5.3, « le nom contient l'étiquette visible »). Composant serveur.
 *
 * Lot D2 : la vignette seule (`VignetteEchantillon`) sert aussi au présentoir de /matieres, où l'échantillon est un
 * bouton (la matière en grand) ; une vignette qui ne répond pas laisse voir la couleur de la matière.
 */
export const OMBRE_ECHANTILLON = "shadow-[0_10px_22px_rgba(40,25,15,0.18)]";

export function VignetteEchantillon({ matiere, priorite = false, className }: { matiere: Pick<MatiereCartel, "id" | "hex">; priorite?: boolean; className?: string }) {
  return (
    <span className={["block aspect-square overflow-hidden rounded-[var(--rayon-sm)] bg-fond-2", OMBRE_ECHANTILLON, className].filter(Boolean).join(" ")} style={matiere.hex ? { backgroundColor: matiere.hex } : undefined}>
      {/* eslint-disable-next-line @next/next/no-img-element -- vignette servie et mise en cache par le CRM */}
      <img src={urlVignette(matiere.id)} alt="" width={320} height={320} loading={priorite ? "eager" : "lazy"} decoding="async" referrerPolicy="no-referrer" className="block h-full w-full object-cover" />
    </span>
  );
}

export function Echantillon({ matiere, href, teinte, priorite = false, className }: { matiere: MatiereCartel; href?: string; /** La teinte du filet du cartel (celle de la prestation) ; par défaut, la couleur de la matière. */ teinte?: string; priorite?: boolean; className?: string }) {
  const figure = (
    <figure className={["m-0 flex flex-col gap-3", href ? null : className].filter(Boolean).join(" ")}>
      <VignetteEchantillon matiere={matiere} priorite={priorite} />
      <figcaption>
        <Cartel matiere={matiere} teinte={teinte} />
      </figcaption>
    </figure>
  );
  if (!href) return figure;
  return (
    <Link href={href} className={["group block rounded-[var(--rayon-sm)]", className].filter(Boolean).join(" ")}>
      {figure}
    </Link>
  );
}
