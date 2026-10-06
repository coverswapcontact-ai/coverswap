import Link from "next/link";
import type { ReactNode } from "react";
import { DonneesStructurees } from "@/components/ScriptJsonLd";
import { Cartel } from "@/components/revue/Cartel";
import { AvantApres } from "@/components/simulation/AvantApres";
import { Photo } from "@/components/simulation/Photo";
import { PAIRES_SERIE_2 } from "@/data/ambiances";
import { ambianceDeLImage, type AmbianceResolue } from "@/lib/ambiances";
import type { MatiereCartel } from "@/lib/cartel";
import { sourcesPhoto, type ManifesteImages, type SourcesPhoto } from "@/lib/images-preparees";
import { MANIFESTE_IMAGES } from "@/lib/images-manifeste";
import { imageObjet, legendeAmbiance } from "@/lib/donnees-images";
import { avecDepuis } from "@/lib/liens-simulateur";
import { lienMatiere, matiereCartel } from "@/lib/matieres-vedettes";
import { LiensAmbiance } from "./LiensAmbiance";

/**
 * Le cas d'une ambiance (site 3.0, lots B6 et C1) : un titre, l'image — le curseur avant / après d'une paire calée
 * (« Ambiance · avant / après »), ou la photo seule (« Ambiance ») —, les cartels des matières posées (une même
 * référence sur deux surfaces ne fait qu'un cartel) et « Essayer cette composition chez moi » (le simulateur, la
 * composition posée zone par zone, avec `depuis`). Rendu par « Des cuisines comme la vôtre » (accueil) et par les cas
 * des pages de prestation. Toutes ces images sont générées : jamais « Réalisation », jamais « Simulation ».
 * `resoudreCas` est pur (testé) ; `CarteAmbiance` est un composant serveur (seul le curseur est client), rendu dans
 * l'élément de liste de la page.
 */
export type CasAmbiance = {
  /** Le titre de la carte : un nom choisi (accueil), sinon celui de l'ambiance. */
  nom: string;
  ambiance: AmbianceResolue;
  /** Le texte de l'« avant » (paire seulement). */
  altAvant?: string;
  ratio: string;
  preparees: { avant: SourcesPhoto | null; apres: SourcesPhoto };
  /** Les matières posées, une fois chacune, avec les surfaces qui les portent. */
  matieres: { surfaces: string; matiere: MatiereCartel }[];
  lien: string;
};

const majuscule = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** Les matières d'une ambiance, une fois chacune : les surfaces d'une même référence réunies (« Meubles bas et meubles hauts »). */
export function regrouperMatieres(surfaces: readonly { surface: string; ref: string; nom: string; famille?: string; hex?: string }[]): { surfaces: string; matiere: MatiereCartel }[] {
  const parRef = new Map<string, { surfaces: string[]; matiere: MatiereCartel }>();
  for (const s of surfaces) {
    const deja = parRef.get(s.ref);
    if (deja) deja.surfaces.push(s.surface);
    else parRef.set(s.ref, { surfaces: [s.surface], matiere: matiereCartel(s.ref) ?? { id: s.ref, nom: s.nom, famille: s.famille ?? "", ...(s.hex ? { hex: s.hex } : {}) } });
  }
  return [...parRef.values()].map((m) => ({ surfaces: majuscule(m.surfaces.join(" et ")), matiere: m.matiere }));
}

/** Le cas d'une image (nom du manifeste, l'« après » d'une paire ou une image seule) ; `null` si elle n'est pas préparée ou n'a pas d'ambiance. */
export function resoudreCas(image: string, { nom, depuis }: { nom?: string; depuis: string }, manifeste: ManifesteImages = MANIFESTE_IMAGES): CasAmbiance | null {
  const ambiance = ambianceDeLImage(image);
  const sApres = sourcesPhoto(image, manifeste);
  if (!ambiance || !sApres) return null;
  const sAvant = ambiance.avant ? sourcesPhoto(ambiance.avant, manifeste) : null;
  if (ambiance.avant && !sAvant) return null;
  const paire = ambiance.avant ? PAIRES_SERIE_2.find((p) => p.avant === ambiance.avant) : undefined;
  return {
    nom: nom ?? ambiance.titre,
    ambiance,
    ...(sAvant ? { altAvant: paire ? `${paire.scene}. Image d'ambiance.` : "La même pièce avant la pose, avec ses matières d'origine. Image d'ambiance." } : {}),
    ratio: paire?.ratio ?? `${sApres.largeur} / ${sApres.hauteur}`,
    preparees: { avant: sAvant, apres: sApres },
    matieres: regrouperMatieres(ambiance.surfaces),
    lien: avecDepuis(ambiance.lienComposition, depuis),
  };
}

/**
 * L'`ImageObject` d'un cas qui est un avant / après (site 3.0, lot F4) : l'« après », légendé par le titre de la carte et
 * ses matières, décrit par son texte alternatif, `creditText` d'ambiance ; `null` pour une photo seule.
 */
export function imageObjetCas(cas: CasAmbiance): Record<string, unknown> | null {
  if (!cas.preparees.avant) return null;
  return imageObjet({ src: cas.preparees.apres.src, sources: cas.preparees.apres, legende: legendeAmbiance(cas.nom, cas.ambiance.surfaces), description: `Ambiance · avant / après. ${cas.ambiance.alt}`, ambiance: true });
}

/**
 * La carte (titre, image, cartels, lien), à poser dans un `<li>`. `teinte` : la teinte de la prestation, sur le filet
 * des cartels (sinon la couleur de chaque matière). `cartelsColonnes` : la grille des cartels. `children` : une ligne
 * de plus sous les cartels (le prix habituel sur `/realisations`). `sansLien` : pas de lien vers le simulateur (`/pro`,
 * une page sans simulateur). Lot C4 (`/inspirations`) : `balise` (le titre en `h2` quand la carte est directement
 * sous le `h1`), `priorite` (la première image de la page, en `fetchPriority="high"` — une photo seule seulement :
 * une paire n'est jamais prioritaire, ses deux images passeraient devant tout), `liensMatieres` (chaque cartel mène à
 * sa matière).
 * Site 3.0 (lots F4 et F5) : un avant / après pose son `ImageObject` (`imageObjetCas`) ; chaque cartel mène à la fiche
 * de sa matière (`liensMatieres`, vrai par défaut) et la carte à sa prestation (`LiensAmbiance`), sauf sur la page de
 * cette prestation (`ici` : l'adresse de la page).
 */
export function CarteAmbiance({ cas, tailles, teinte, cartelsColonnes = "sm:grid-cols-2", sansLien = false, balise = "h3", priorite = false, liensMatieres = true, ici, children }: { cas: CasAmbiance; tailles: string; teinte?: string; cartelsColonnes?: string; sansLien?: boolean; balise?: "h2" | "h3"; priorite?: boolean; liensMatieres?: boolean; ici?: string; children?: ReactNode }) {
  const { preparees } = cas;
  const Titre = balise;
  return (
    <>
      <Titre data-ambiance={cas.ambiance.id} className="font-display text-[24px] leading-tight font-semibold text-encre">
        {cas.nom}
      </Titre>
      <DonneesStructurees data={imageObjetCas(cas)} />
      {preparees.avant ? (
        <AvantApres
          className="mt-3"
          avant={preparees.avant.src}
          apres={preparees.apres.src}
          alt={cas.ambiance.alt}
          altAvant={cas.altAvant}
          ratio={cas.ratio}
          preparees={{ avant: preparees.avant, apres: preparees.apres, tailles }}
          sansOutils
          etiquette="Ambiance · avant / après"
        />
      ) : (
        <Photo nom={cas.ambiance.image} alt={cas.ambiance.alt} ratio={cas.ratio} tailles={tailles} priorite={priorite} etiquette="Ambiance" className="mt-3 rounded-[var(--rayon-md)]" />
      )}
      <ul className={`mt-4 grid gap-x-4 gap-y-3 ${cartelsColonnes}`} aria-label={`Matières posées : ${cas.nom}`}>
        {cas.matieres.map((m) => (
          <li key={m.matiere.id}>
            <p className="text-[13px] text-encre-2">{m.surfaces}</p>
            {liensMatieres ? (
              <Link href={lienMatiere(m.matiere.id)} className="mt-1 block underline-offset-4 hover:underline">
                <Cartel matiere={m.matiere} teinte={teinte} />
              </Link>
            ) : (
              <Cartel matiere={m.matiere} teinte={teinte} className="mt-1" />
            )}
          </li>
        ))}
      </ul>
      <LiensAmbiance piece={cas.ambiance.piece} ici={ici} />
      {children}
      {sansLien ? null : (
        <Link href={cas.lien} className="mt-auto inline-flex self-start pt-3 min-h-[44px] items-center text-[15px] font-medium text-encre underline underline-offset-4 hover:text-encre-2">
          Essayer cette composition chez moi
        </Link>
      )}
    </>
  );
}
