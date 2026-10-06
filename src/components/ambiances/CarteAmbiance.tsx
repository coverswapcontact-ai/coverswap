import Link from "@/components/LienSite";
import type { ReactNode } from "react";
import { DonneesStructurees } from "@/components/ScriptJsonLd";
import { Cartel } from "@/components/revue/Cartel";
import { AvantApres } from "@/components/simulation/AvantApres";
import { Photo } from "@/components/simulation/Photo";
import { lienMatiere } from "@/lib/matieres-vedettes";
import { imageObjetCas, type CasAmbiance } from "./cas";
import { LiensAmbiance } from "./LiensAmbiance";

/**
 * Le cas d'une ambiance (site 3.0, lots B6 et C1) : un titre, l'image — le curseur avant / après d'une paire calée
 * (« Ambiance · avant / après »), ou la photo seule (« Ambiance ») —, les cartels des matières posées (une même
 * référence sur deux surfaces ne fait qu'un cartel) et « Essayer cette composition chez moi » (le simulateur, la
 * composition posée zone par zone, avec `depuis`). Rendu par « Des cuisines comme la vôtre » (accueil) et par les cas
 * des pages de prestation. Toutes ces images sont générées : jamais « Réalisation », jamais « Simulation ».
 * `resoudreCas` est pur (testé) et vit dans `./cas` (lot F7 : un module de données qui n'importe aucun composant, lu
 * par `lib/partage.ts`) ; `CarteAmbiance` est un composant serveur (seul le curseur est client), rendu dans l'élément
 * de liste de la page.
 */
export { imageObjetCas, regrouperMatieres, resoudreCas, type CasAmbiance } from "./cas";

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
