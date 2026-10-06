import { ENTREPRISE } from "./entreprise";
import type { SourcesImage } from "./images-preparees";

/**
 * Les `ImageObject` des avant / après (site 3.0, lot F4), en règles pures, sans autre dépendance que l'adresse du
 * site : `components/ambiances/CarteAmbiance` et l'ouverture (`components/accueil/etudes`) les lisent sans tirer le
 * gabarit des données structurées (`JsonLd.tsx`, qui les réexporte).
 */

/** Le `creditText` d'une image d'ambiance : ce qu'elle est, sans laisser croire à une photo de chantier. */
export const CREDIT_AMBIANCE = "Image d'ambiance générée aux teintes du catalogue";

/** L'adresse absolue de l'image la plus grande d'une source préparée (le dernier JPEG du `srcset`), sinon son `src`. */
export function adresseImage(src: string, sources?: Pick<SourcesImage, "jpg"> | null): string {
  const entrees = (sources?.jpg ?? "")
    .split(",")
    .map((e) => e.trim().split(/\s+/))
    .filter((e) => e[0])
    .map(([adresse, largeur]) => ({ adresse, largeur: Number.parseInt(largeur ?? "", 10) || 0 }))
    .sort((a, b) => b.largeur - a.largeur);
  const adresse = entrees[0]?.adresse ?? src;
  return /^https?:\/\//.test(adresse) ? adresse : `${ENTREPRISE.site}${adresse.startsWith("/") ? "" : "/"}${adresse}`;
}

/**
 * L'`ImageObject` d'un avant / après rendu (site 3.0, lot F4) : l'image « après » (la plus grande préparée), sa légende
 * (`caption` : ce que la page écrit sous l'image ou son titre et ses matières), sa description (le texte alternatif,
 * précédé de l'étiquette quand elle est donnée) et, pour une image d'ambiance, `creditText` : `CREDIT_AMBIANCE`. Une
 * réalisation (vraie photo de chantier) n'en porte pas : on ne sait pas qui l'a prise. `@id` : l'adresse de l'image
 * suivie de `#image` (le `Service` de la page y renvoie).
 */
export function imageObjet({ src, sources, legende, description, ambiance }: { src: string; sources?: Pick<SourcesImage, "jpg"> | null; legende: string; description: string; ambiance: boolean }): Record<string, unknown> {
  const contentUrl = adresseImage(src, sources);
  return {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    "@id": `${contentUrl.replace(/[?#].*$/, "")}#image`,
    contentUrl,
    caption: legende,
    description,
    ...(ambiance ? { creditText: CREDIT_AMBIANCE } : {}),
  };
}

/** La légende d'une ambiance : son titre, puis chaque surface et sa matière (« Cuisine en L. Façades Deep Green NF13, plan de travail Pale Oak AG13. »). */
export function legendeAmbiance(titre: string, surfaces: readonly { surface: string; nom: string; ref: string }[]): string {
  const liste = surfaces.map((s) => `${s.surface} ${s.nom} ${s.ref}`).join(", ");
  return liste ? `${titre}. ${liste.charAt(0).toUpperCase()}${liste.slice(1)}.` : `${titre}.`;
}

/** La référence d'un `Service` (ou d'une autre donnée) à l'`ImageObject` posé sur la page. */
export const refImage = (objet: Record<string, unknown> | null | undefined) => (objet?.["@id"] ? { "@id": objet["@id"] } : null);
