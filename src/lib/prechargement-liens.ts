/**
 * Le préchargement des liens internes, différé (site 3.0, lot F7) — la logique pure ; le composant est
 * `components/PrechargementDiffere.tsx`, les liens `components/LienSite.tsx`.
 *
 * Next précharge chaque lien visible dès que la page est hydratée : sur l'accueil, la charge RSC de « / » (le logo),
 * celle du simulateur et tout le JavaScript du simulateur (≈ 100 Ko compressés) ; sur une prestation, sept pages. Ces
 * octets partaient pendant le chargement, en concurrence avec l'image du premier écran et les polices. Désormais :
 *  - au survol, au toucher ou au focus d'un lien, il est préchargé tout de suite (comme le faisait Next) ;
 *  - les liens visibles (à 200 px près, comme Next) sont préchargés à partir du premier geste de la personne (toucher,
 *    clic, touche, molette, défilement) ou trois secondes après l'événement `load`, au premier des deux.
 * La navigation ne change pas : un clic sur un lien pas encore préchargé charge la page comme avant.
 */
export const APRES_CHARGEMENT_MS = 3000;
export const GESTES = ["pointerdown", "keydown", "touchstart", "wheel", "scroll"] as const;
export const MARGE_VISIBLE = "200px";
/** Posé par `LienSite` sur un lien écrit `prefetch={false}` : jamais préchargé. */
export const SANS_PRECHARGEMENT = "data-sans-prechargement";

type Ici = { origin: string; pathname: string; search: string };

/**
 * L'adresse à précharger pour un lien, ou `null` : un autre site, `tel:` / `mailto:`, une route `/api/`, un fichier
 * (`/llms.txt`, une image…), un nouvel onglet, un téléchargement, ou la page elle-même (une ancre).
 */
export function adressePrechargeable(lien: { href: string | null; cible?: string | null; telechargement?: boolean; sansPrechargement?: boolean }, ici: Ici): string | null {
  if (!lien.href || lien.telechargement || lien.sansPrechargement) return null;
  if (lien.cible && lien.cible !== "_self") return null;
  let url: URL;
  try {
    url = new URL(lien.href, `${ici.origin}${ici.pathname}${ici.search}`);
  } catch {
    return null;
  }
  if (url.origin !== ici.origin) return null;
  if (url.pathname.startsWith("/api/") || /\.[a-z0-9]{2,5}$/i.test(url.pathname)) return null;
  if (url.pathname === ici.pathname && url.search === ici.search) return null;
  return `${url.pathname}${url.search}`;
}

type Fenetre = {
  addEventListener: (type: string, f: () => void, options?: AddEventListenerOptions) => void;
  removeEventListener: (type: string, f: () => void, options?: EventListenerOptions) => void;
  setTimeout: (f: () => void, ms: number) => unknown;
  clearTimeout: (id: never) => void;
};

/**
 * Appelle `pret` une fois, au premier geste ou `APRES_CHARGEMENT_MS` après `load` (tout de suite + ce délai si la page
 * est déjà chargée). Rend de quoi tout défaire.
 */
export function attendreLeMoment(fenetre: Fenetre, document: { readyState: string }, pret: () => void): () => void {
  let fait = false;
  let minuterie: unknown = null;
  const defaire = () => {
    for (const g of GESTES) fenetre.removeEventListener(g, declencher, { capture: true });
    fenetre.removeEventListener("load", minuter);
    if (minuterie !== null) fenetre.clearTimeout(minuterie as never);
  };
  function declencher() {
    if (fait) return;
    fait = true;
    defaire();
    pret();
  }
  function minuter() {
    minuterie = fenetre.setTimeout(declencher, APRES_CHARGEMENT_MS);
  }
  for (const g of GESTES) fenetre.addEventListener(g, declencher, { capture: true, passive: true });
  if (document.readyState === "complete") minuter();
  else fenetre.addEventListener("load", minuter, { once: true });
  return defaire;
}
