/**
 * Les images de l'espace client et du simulateur : les pictogrammes (familles, éléments, plans de cuisine), le logo
 * réexporté et les petites icônes d'interface au trait. Site 3.0, lot C6 : les dessins au trait des pièces (salle de
 * bain, mobilier, local professionnel, murs) ont cédé la place aux pictogrammes ; lot E2 : la cuisine de face aussi
 * (l'écran Photo du simulateur montre le picto de la pièce). Plus aucun dessin de pièce ici.
 */

/**
 * Mission 19 : les pictogrammes en image (« petites maquettes » détourées, fond transparent, AVIF + WebP en deux
 * tailles, `scripts/preparer-pictos.mjs`) remplacent les anciens dessins de la famille et des plans de cuisine ;
 * affichés à 64 px au moins. Les petites icônes d'interface (téléphone, coche, cadenas…) restent au trait, plus bas.
 */
export const DOSSIER_PICTOS = "/images/pictos";
export const PICTOS_FAMILLES: Record<string, string> = { CUISINE: "picto-cuisine", SDB: "picto-salle-de-bain", MEUBLES: "picto-mobilier", PRO: "picto-pro", MURS: "picto-murs" };
/**
 * Les pictos d'un élément précis (série 2, lot B4), même style que ceux des familles : porte, placard, plan de travail,
 * commode, meuble vasque, porte d'entrée, réfrigérateur. Décoratifs, comme les autres.
 */
export const PICTOS_ELEMENTS = {
  "porte-interieure": "picto-porte-interieure",
  "placard-coulissant": "picto-placard-coulissant",
  "plan-de-travail": "picto-plan-de-travail",
  commode: "picto-commode",
  "meuble-vasque": "picto-meuble-vasque",
  "porte-entree": "picto-porte-entree",
  refrigerateur: "picto-refrigerateur",
} as const;
/** Les formes de cuisine ; `parallele` (cuisine couloir, `plan-parallele`) ne s'affiche que si le CRM publie ce format. */
export type FormeCuisine = "une-rangee" | "en-l" | "en-u" | "ilot" | "parallele";

/**
 * Un pictogramme : `<picture>` AVIF puis WebP (128 px, 256 px en haute densité), décoratif (le texte voisin le nomme).
 * `enSvg` : le même pictogramme dans un conteneur SVG (`<image>`, WebP 256 px) — pour un bouton qui attend un dessin
 * vectoriel (les formats de l'estimation du simulateur).
 */
export function Picto({ nom, className, enSvg = false }: { nom: string; className?: string; enSvg?: boolean }) {
  if (enSvg) {
    return (
      <svg viewBox="0 0 128 128" className={className} aria-hidden>
        <image href={`${DOSSIER_PICTOS}/${nom}-256.webp`} width="128" height="128" preserveAspectRatio="xMidYMid meet" />
      </svg>
    );
  }
  const serie = (ext: string) => `${DOSSIER_PICTOS}/${nom}-128.${ext} 1x, ${DOSSIER_PICTOS}/${nom}-256.${ext} 2x`;
  return (
    <picture>
      <source type="image/avif" srcSet={serie("avif")} />
      <img src={`${DOSSIER_PICTOS}/${nom}-128.webp`} srcSet={serie("webp")} alt="" aria-hidden width={128} height={128} loading="lazy" decoding="async" className={`object-contain${className ? ` ${className}` : ""}`} />
    </picture>
  );
}

/** Le pictogramme d'une famille de prestations (cartes de l'onglet Projet, du nouveau projet, estimation). */
export function DessinFamille({ famille, className, enSvg }: { famille: string; className?: string; enSvg?: boolean }) {
  return <Picto nom={PICTOS_FAMILLES[famille] ?? PICTOS_FAMILLES.CUISINE} className={className} enSvg={enSvg} />;
}

/** Les plans de cuisine (pour estimer la longueur de meubles) : une rangée, en L, en U, avec îlot, en couloir. */
export function PlanCuisine({ forme, className, enSvg }: { forme: FormeCuisine; className?: string; enSvg?: boolean }) {
  return <Picto nom={`plan-${forme}`} className={className} enSvg={enSvg} />;
}

/** Le logo vit dans `components/Logo.tsx` (composant serveur, site 3.0) ; réexporté ici pour l'espace client. */
export { Logo } from "@/components/Logo";

export const IconeTelephone = ({ taille = 18 }: { taille?: number }) => (
  <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

export const IconePersonne = ({ taille = 18 }: { taille?: number }) => (
  <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </svg>
);

export const IconeAppareil = ({ taille = 20 }: { taille?: number }) => (
  <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);

export const IconeGalerie = ({ taille = 20 }: { taille?: number }) => (
  <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
  </svg>
);

export const IconeCoche = ({ taille = 14 }: { taille?: number }) => (
  <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export const IconeRetour = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="m15 18-6-6 6-6" />
  </svg>
);

export const IconeSuite = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="m9 18 6-6-6-6" />
  </svg>
);

/* ── Icônes des onglets (trait 2 px, 24 × 24) ─────────────────────────── */

const Trait = ({ taille = 24, children }: { taille?: number; children: React.ReactNode }) => (
  <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {children}
  </svg>
);

export const IconeCadenas = ({ taille = 14 }: { taille?: number }) => (
  <Trait taille={taille}>
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </Trait>
);

/** Projet : la règle du métreur. */
export const IconeProjet = ({ taille = 24 }: { taille?: number }) => (
  <Trait taille={taille}>
    <path d="M3 17 17 3l4 4L7 21H3z" />
    <path d="m7 13 2 2M10 10l2 2M13 7l2 2" />
  </Trait>
);

/** Simulations : l'image et sa baguette. */
export const IconeSimulation = ({ taille = 24 }: { taille?: number }) => (
  <Trait taille={taille}>
    <rect x="3" y="5" width="14" height="14" rx="2" />
    <path d="m3 15 4-4 3 3 2-2 5 5" />
    <path d="M19 3v4M17 5h4M21 11v2M20 12h2" />
  </Trait>
);

export const IconeDevis = ({ taille = 24 }: { taille?: number }) => (
  <Trait taille={taille}>
    <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
    <path d="M14 3v6h6M8 13h8M8 17h5" />
  </Trait>
);

export const IconePaiement = ({ taille = 24 }: { taille?: number }) => (
  <Trait taille={taille}>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M2 10h20M6 15h4" />
  </Trait>
);

export const IconeCoeur = ({ taille = 20, plein = false }: { taille?: number; plein?: boolean }) => (
  <svg width={taille} height={taille} viewBox="0 0 24 24" fill={plein ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" />
  </svg>
);

export const IconeLoupe = ({ taille = 20 }: { taille?: number }) => (
  <Trait taille={taille}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Trait>
);

export const IconePlus = ({ taille = 20 }: { taille?: number }) => (
  <Trait taille={taille}>
    <path d="M12 5v14M5 12h14" />
  </Trait>
);
